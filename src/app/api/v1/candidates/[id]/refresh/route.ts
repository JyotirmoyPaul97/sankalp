import { ok, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeCandidateSkillProfiles, computeCandidateGaps, computeGapPriorities, matchCourses, generatePathway } from "@/lib/intelligence/candidate";
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || new Date().toISOString().slice(0, 7);
  await computeCandidateSkillProfiles(id);
  const targets = await db.candidateTargetProfile.findMany({ where: { candidateId: id } });
  for (const t of targets) {
    await computeCandidateGaps(id, t.targetRoleId, period);
    await computeGapPriorities(id, t.targetRoleId);
    await matchCourses(id, t.targetRoleId);
    await generatePathway(id, t.targetRoleId);
  }
  return ok({ candidateId: id, targetsProcessed: targets.length, period, refreshedAt: new Date().toISOString() });
}
