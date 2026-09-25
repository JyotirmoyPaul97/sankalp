import { ok, fail } from "@/lib/api";
import { getSkillNeighbourhood } from "@/lib/intelligence/skill-graph";

/** GET /api/v1/skills/[id]/graph — 1-hop neighbourhood (relations + clusters + aliases). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const nb = await getSkillNeighbourhood(id);
  if (!nb) return fail("NOT_FOUND", "Skill not found");
  return ok(nb);
}
