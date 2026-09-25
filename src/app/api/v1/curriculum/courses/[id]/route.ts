import { ok, fail } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const versions = await db.curriculumVersion.findMany({ where: { courseId: id }, include: { modules: { include: { skillMappings: { include: { skill: true } }, competencyMappings: true } } }, orderBy: { effectiveFrom: "desc" } });
  if (versions.length === 0) return fail("NOT_FOUND", "No curriculum versions for this course");
  return ok({ versions });
}
