import { ok, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildDistrictTwin } from "@/lib/intelligence/twin";
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");
  const districts = await db.district.findMany();
  for (const d of districts) await buildDistrictTwin(d.id);
  return ok({ districtsProcessed: districts.length, refreshedAt: new Date().toISOString() });
}
