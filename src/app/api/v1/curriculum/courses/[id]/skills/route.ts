import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const versions = await db.curriculumVersion.findMany({ where: { courseId: id, status: "ACTIVE" }, include: { modules: { include: { skillMappings: { include: { skill: true } } } } } });
  const skills = new Map<string, { skill: string; coverageType: string; coverageStrength: number; expectedProficiency: string | null }>();
  for (const v of versions) for (const m of v.modules) for (const sm of m.skillMappings) if (!skills.has(sm.skillId)) skills.set(sm.skillId, { skill: sm.skill.name, coverageType: sm.coverageType, coverageStrength: sm.coverageStrength, expectedProficiency: sm.expectedProficiency });
  return ok({ skills: [...skills.values()] });
}
