import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET() {
  const gaps = await db.curriculumGapSignal.findMany({ include: { course: { select: { name: true } }, skill: { select: { name: true } }, jobRole: { select: { title: true } } }, orderBy: { confidence: "desc" } });
  return ok({ gaps });
}
