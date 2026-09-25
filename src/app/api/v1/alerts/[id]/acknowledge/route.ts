import { ok, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return fail("UNAUTHORIZED", "Admin authentication required");
  const { id } = await ctx.params;
  const alert = await db.districtAlert.update({ where: { id }, data: { status: "ACKNOWLEDGED" } });
  return ok(alert);
}
