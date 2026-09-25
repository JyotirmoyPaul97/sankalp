import { ok, fail } from "@/lib/api";
import { getRoleCompetencyProfile, getCourseRoleAlignment } from "@/lib/intelligence/competency";

/**
 * GET /api/v1/job-roles/[id]/competency
 * Optional: ?alignWithCourseId=<id> — also returns course-vs-role alignment.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const profile = await getRoleCompetencyProfile(id);
  if (!profile) return fail("NOT_FOUND", "Role not found");

  const url = new URL(req.url);
  const alignWithCourseId = url.searchParams.get("alignWithCourseId");
  let alignment = null;
  if (alignWithCourseId) {
    alignment = await getCourseRoleAlignment(alignWithCourseId, id);
  }

  return ok({ profile, alignment });
}
