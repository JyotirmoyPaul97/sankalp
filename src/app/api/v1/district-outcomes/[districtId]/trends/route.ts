import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ districtId: string }> }) {
  const { districtId } = await ctx.params;
  const twins = await db.districtSkillTwin.findUnique({ where: { districtId } });
  const baselines = await db.districtBaseline.findMany({ where: { districtId }, orderBy: { observationPeriod: "desc" }, take: 5 });
  return ok({ currentTwin: twins, baselines });
}
