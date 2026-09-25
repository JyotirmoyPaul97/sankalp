import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET() {
  const types = await db.interventionType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return ok({ types });
}
