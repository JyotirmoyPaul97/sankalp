import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const versions = await db.curriculumVersion.findMany({ where: { courseId: id, status: "ACTIVE" }, include: { modules: { include: { competencyMappings: true } } } });
  const comps: { competencyId: string; coverageType: string; coverageStrength: number; expectedProficiency: string | null }[] = [];
  for (const v of versions) for (const m of v.modules) for (const cm of m.competencyMappings) comps.push({ competencyId: cm.competencyId, coverageType: cm.coverageType, coverageStrength: cm.coverageStrength, expectedProficiency: cm.expectedProficiency });
  return ok({ competencies: comps });
}
