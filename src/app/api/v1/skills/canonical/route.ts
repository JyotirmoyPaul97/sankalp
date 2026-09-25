import { ok, fail } from "@/lib/api";
import { resolveCanonicalSkill, resolveCanonicalSkills } from "@/lib/intelligence/skill-normalizer";

/**
 * GET /api/v1/skills/canonical?name=PLC
 * GET /api/v1/skills/canonical?names=PLC,SCADA,Python
 *
 * Resolves a raw skill string (or a comma-separated list) to canonical
 * Skill entities using the Phase 3 deterministic normalizer.
 * No embeddings, no ML.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const single = url.searchParams.get("name");
  const multi = url.searchParams.get("names");

  if (single) {
    const result = await resolveCanonicalSkill(single);
    return ok(result);
  }
  if (multi) {
    const list = multi.split(",").map((s) => s.trim()).filter(Boolean);
    const results = await resolveCanonicalSkills(list);
    return ok({ results });
  }
  return fail("BAD_REQUEST", "Provide ?name=<single> or ?names=<csv>");
}
