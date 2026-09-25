import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/**
 * GET /api/v1/candidate/me
 * Resolves the logged-in candidate's profile + target role summary.
 * Privacy: a CANDIDATE user only ever sees their own record (matched by email).
 */
export async function GET(req: Request) {
  const payload = await requireUser(req);
  if (!payload) return fail("UNAUTHORIZED", "Authentication required");

  const candidate = await db.candidate.findUnique({
    where: { email: payload.email },
    include: {
      district: true,
      targetProfiles: { include: { jobRole: { include: { sector: true } }, sector: true, district: true } },
      _count: { select: { skills: true, evidence: true, assessments: true, skillGaps: true } },
    },
  });
  if (!candidate) return fail("NOT_FOUND", "No candidate profile linked to this account");

  const primaryTarget = candidate.targetProfiles[0] ?? null;
  return ok({
    candidate: {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      educationLevel: candidate.educationLevel,
      experienceYears: candidate.experienceYears,
      district: candidate.district,
      status: candidate.status,
      dataStatus: candidate.dataStatus,
      createdAt: candidate.createdAt,
      counts: candidate._count,
    },
    targetRole: primaryTarget
      ? {
          targetRoleId: primaryTarget.targetRoleId,
          jobRole: primaryTarget.jobRole,
          sector: primaryTarget.sector,
          district: primaryTarget.district,
          marketDemandSignal: primaryTarget.marketDemandSignal,
          marketConfidence: primaryTarget.marketConfidence,
        }
      : null,
  });
}
