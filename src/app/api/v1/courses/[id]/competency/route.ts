import { ok, fail } from "@/lib/api";
import { getCourseCompetencyProfile, getCourseRoleAlignment } from "@/lib/intelligence/competency";

/**
 * GET /api/v1/courses/[id]/competency
 * Optional: ?alignWithRoleId=<id> — also returns course-vs-role alignment.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const profile = await getCourseCompetencyProfile(id);
  if (!profile) return fail("NOT_FOUND", "Course not found");

  const url = new URL(req.url);
  const alignWithRoleId = url.searchParams.get("alignWithRoleId");
  let alignment = null;
  if (alignWithRoleId) {
    alignment = await getCourseRoleAlignment(id, alignWithRoleId);
  }

  return ok({ profile, alignment });
}
