import { ok, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { computeGapSignals } from "@/lib/intelligence/gap";

/** POST /api/v1/gaps/refresh — admin-only. Recomputes gap signals for a period. */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");

  const url = new URL(req.url);
  const period = url.searchParams.get("period");
  if (!period) return fail("BAD_REQUEST", "?period=YYYY-MM is required");

  const result = await computeGapSignals({ period });
  return ok({ period, gapsCreated: result.gapsCreated, refreshedAt: new Date().toISOString() });
}
