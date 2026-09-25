import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET() {
  const profiles = await db.courseRelevanceProfile.findMany({
    include: { course: { include: { sector: true } }, jobRole: true },
    orderBy: { relevanceScore: "desc" },
  });
  return ok({ courses: profiles });
}
