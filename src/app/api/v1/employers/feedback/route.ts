import { z } from "zod";
import { ok, fail, handlePrismaError } from "@/lib/api";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const SkillFeedbackSchema = z.object({
  skillId: z.string().min(1),
  proficiencyLevel: z.string().default("WORKING"),
  notes: z.string().max(2000).optional(),
});

const Schema = z.object({
  candidateId: z.string().min(1),
  jobRoleId: z.string().min(1).optional(),
  context: z.string().max(200).default("POST_PLACEMENT"),
  overallFeedback: z.string().max(2000).optional(),
  skills: z.array(SkillFeedbackSchema).default([]),
});

/**
 * POST /api/v1/employers/feedback
 * Employer records structured feedback on a candidate's demonstrated skill(s)
 * after a placement / demonstration event. Each skill entry becomes a
 * CandidateEvidence row of type EMPLOYER_VERIFIED (verificationStatus = VERIFIED).
 *
 * This is the Employer → Candidate evidence channel that closes the loop:
 *   Employer feedback → Candidate evidence → Updated capability → Outcomes.
 *
 * Privacy: feedback is written against the candidate's own evidence ledger;
 * the employer only sees outcome / opportunity-relevant signals, not personal
 * data beyond what is necessary for the application context.
 */
export async function POST(req: Request) {
  const payload = await requireUser(req);
  if (!payload) return fail("UNAUTHORIZED", "Authentication required");

  let body: unknown;
  try { body = await req.json(); } catch { return fail("BAD_REQUEST", "Invalid JSON body"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());

  const { candidateId, jobRoleId, context, overallFeedback, skills } = parsed.data;

  // Verify the candidate exists.
  const candidate = await db.candidate.findUnique({ where: { id: candidateId }, select: { id: true, name: true } });
  if (!candidate) return fail("NOT_FOUND", "Candidate not found");

  try {
    const created: { evidenceId: string; skillId: string; proficiency: string }[] = [];
    for (const s of skills) {
      const ev = await db.candidateEvidence.create({
        data: {
          candidateId,
          skillId: s.skillId,
          evidenceType: "EMPLOYER_VERIFIED",
          evidenceSource: `Employer Feedback (${context}) by ${payload.email}`,
          evidenceTimestamp: new Date(),
          proficiencyLevel: s.proficiencyLevel,
          verificationStatus: "VERIFIED",
          confidence: 0.85,
          description: overallFeedback ? `${overallFeedback}${s.notes ? " — " + s.notes : ""}` : (s.notes ?? `Employer verified proficiency at ${s.proficiencyLevel}.`),
        },
      });
      created.push({ evidenceId: ev.id, skillId: s.skillId, proficiency: s.proficiencyLevel });

      // Record a gap resolution event for traceability.
      await db.candidateGapResolutionEvent.create({
        data: {
          candidateId,
          gapId: null,
          actionType: "EMPLOYER_VERIFIED",
          evidenceId: ev.id,
          previousStatus: "OPEN",
          newStatus: "EVIDENCE_ADDED",
          timestamp: new Date(),
        },
      });

      // Update the candidate skill freshness + evidence count.
      const existing = await db.candidateSkill.findUnique({ where: { candidateId_skillId: { candidateId, skillId: s.skillId } } });
      if (existing) {
        await db.candidateSkill.update({
          where: { id: existing.id },
          data: {
            evidenceCount: { increment: 1 },
            freshnessStatus: "CURRENT",
            lastVerifiedAt: new Date(),
            status: "VERIFIED",
          },
        });
      }
    }

    return ok({
      candidateId,
      jobRoleId: jobRoleId ?? null,
      context,
      evidenceCreated: created,
      message: `Employer feedback recorded as ${created.length} verified evidence item(s). Candidate capability updated.`,
    });
  } catch (e) {
    return handlePrismaError(e);
  }
}
