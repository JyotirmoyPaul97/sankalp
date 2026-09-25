import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET() {
  const trainers = await db.trainer.findMany({ include: { trainingCentre: { include: { district: true } }, skillMappings: { include: { skill: true } }, _count: { select: { competencyMappings: true } } }, orderBy: { createdAt: "desc" }, take: 50 });
  return ok({ trainers });
}
