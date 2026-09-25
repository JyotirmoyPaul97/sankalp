import { ok, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeCandidateSkillProfiles, computeCandidateGaps, computeGapPriorities, matchCourses, generatePathway } from "@/lib/intelligence/candidate";
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");
  const url = new URL(req.url);
  const candidateId = url.searchParams.get("candidateId");
  const period = url.searchParams.get("period") || new Date().toISOString().slice(0, 7);
  const targets = candidateId ? [{ candidateId, targetRoleId: "" }] : await db.candidateTargetProfile.findMany({ select: { candidateId: true, targetRoleId: true } });
  for (const t of targets) {
    await computeCandidateSkillProfiles(t.candidateId);
    if (t.targetRoleId) {
      await computeCandidateGaps(t.candidateId, t.targetRoleId, period);
      await computeGapPriorities(t.candidateId, t.targetRoleId);
      await matchCourses(t.candidateId, t.targetRoleId);
      await generatePathway(t.candidateId, t.targetRoleId);
    }
  }
  return ok({ processed: targets.length, period, refreshedAt: new Date().toISOString() });
}
