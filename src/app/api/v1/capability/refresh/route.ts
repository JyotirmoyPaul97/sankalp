import { ok, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { computeCapability } from "@/lib/intelligence/capability";
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || new Date().toISOString().slice(0, 7);
  const result = await computeCapability(period);
  return ok({ period, gapsCreated: result.gapsCreated, refreshedAt: new Date().toISOString() });
}
