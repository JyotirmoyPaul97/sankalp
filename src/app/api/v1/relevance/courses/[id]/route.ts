import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const profiles = await db.courseRelevanceProfile.findMany({
    where: { courseId: id },
    include: { course: { include: { sector: true, qualification: true, courseSkills: { include: { skill: true } } } }, jobRole: true },
  });
  if (profiles.length === 0) return fail("NOT_FOUND", "No relevance profiles for this course");
  const gaps = await db.curriculumGapSignal.findMany({ where: { courseId: id }, include: { skill: true, jobRole: true } });
  const versions = await db.curriculumVersion.findMany({ where: { courseId: id }, include: { modules: { include: { skillMappings: { include: { skill: true } } } } }, orderBy: { effectiveFrom: "desc" } });
  return ok({ profiles, gaps, curriculumVersions: versions });
}
