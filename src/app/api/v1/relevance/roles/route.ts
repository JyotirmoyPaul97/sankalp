import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET() {
  const roles = await db.jobRole.findMany({ include: { sector: true, _count: { select: { courseRoleMappings: true, relevanceProfiles: true } } } });
  const out = [];
  for (const role of roles) {
    const profiles = await db.courseRelevanceProfile.findMany({ where: { jobRoleId: role.id }, orderBy: { relevanceScore: "desc" } });
    out.push({ role: { id: role.id, title: role.title, sector: role.sector?.name ?? null }, relevanceProfiles: profiles.length, topScore: profiles[0]?.relevanceScore ?? 0, alignment: profiles[0]?.coverageStatus ?? "INSUFFICIENT_DATA" });
  }
  return ok({ roles: out });
}
