import { z } from "zod";
import { ok, fail, handlePrismaError } from "@/lib/api";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const Schema = z.object({
  skillId: z.string().min(1),
  actionType: z.enum([
    "ASSESSMENT_COMPLETED", "PROJECT_ADDED", "CERTIFICATE_ADDED",
    "PRACTICE_EVIDENCE_ADDED", "EMPLOYER_VERIFIED", "LEARNING_ACTIVITY",
  ]),
  evidenceType: z.enum(["ASSESSED", "PROJECT", "CERTIFIED", "EXPERIENCE", "EMPLOYER_VERIFIED", "SELF_DECLARED"]),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  proficiencyLevel: z.string().default("WORKING"),
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).default("PENDING"),
  confidence: z.number().min(0).max(1).default(0.5),
  evidenceSource: z.string().max(200).optional(),
  gapId: z.string().optional(),
});

/**
 * POST /api/v1/candidate/progress-event
 * Candidate records a progress event (completed assessment / project / practice /
 * certificate / learning activity). Creates a CandidateEvidence row + a
 * CandidateGapResolutionEvent so the evolution timeline updates. The new
 * evidence becomes available to downstream intelligence workflows per
 * permissions.
 */
export async function POST(req: Request) {
  const payload = await requireUser(req);
  if (!payload) return fail("UNAUTHORIZED", "Authentication required");

  let body: unknown;
  try { body = await req.json(); } catch { return fail("BAD_REQUEST", "Invalid JSON body"); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());

  const candidate = await db.candidate.findUnique({ where: { email: payload.email }, select: { id: true } });
  if (!candidate) return fail("NOT_FOUND", "No candidate profile linked to this account");

  const { skillId, actionType, evidenceType, title, description, proficiencyLevel, verificationStatus, confidence, evidenceSource, gapId } = parsed.data;

  try {
    const evidence = await db.candidateEvidence.create({
      data: {
        candidateId: candidate.id,
        skillId,
        evidenceType,
        evidenceSource: evidenceSource ?? "Candidate-submitted",
        evidenceTimestamp: new Date(),
        proficiencyLevel,
        verificationStatus,
        confidence,
        description: description ?? title,
      },
    });

    const resolution = await db.candidateGapResolutionEvent.create({
      data: {
        candidateId: candidate.id,
        gapId: gapId ?? null,
        actionType,
        evidenceId: evidence.id,
        previousStatus: "OPEN",
        newStatus: "EVIDENCE_ADDED",
        timestamp: new Date(),
      },
    });

    // Bump the candidate skill's evidence count + freshness.
    const existing = await db.candidateSkill.findUnique({ where: { candidateId_skillId: { candidateId: candidate.id, skillId } } });
    if (existing) {
      await db.candidateSkill.update({
        where: { id: existing.id },
        data: {
          evidenceCount: { increment: 1 },
          freshnessStatus: "RECENT",
          lastVerifiedAt: verificationStatus === "VERIFIED" ? new Date() : existing.lastVerifiedAt,
        },
      });
    }

    return ok({ evidence, resolutionEvent: resolution, message: "Progress event recorded. Evidence added to your skill passport." });
  } catch (e) {
    return handlePrismaError(e);
  }
}
