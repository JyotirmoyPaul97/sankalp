import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const data = await db.interventionMilestone.findMany({ where: { interventionId: id }, orderBy: { plannedDate: "asc" } });
  return ok({ milestones: data });
}
