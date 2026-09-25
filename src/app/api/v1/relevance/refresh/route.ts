import { ok, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { computeCourseRelevance } from "@/lib/intelligence/relevance";
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || new Date().toISOString().slice(0, 7);
  const result = await computeCourseRelevance(period);
  return ok({ period, profilesCreated: result.profilesCreated, refreshedAt: new Date().toISOString() });
}
