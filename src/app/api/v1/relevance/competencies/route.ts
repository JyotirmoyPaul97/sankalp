import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET() {
  const roleSkills = await db.roleSkill.findMany({ include: { skill: true, jobRole: { include: { sector: true } } } });
  const out = [];
  for (const rs of roleSkills) {
    const courseSkills = await db.courseSkill.findMany({ where: { skillId: rs.skillId }, include: { course: { include: { courseRoleMappings: true } } } });
    const relevantCourses = courseSkills.filter((cs) => cs.course.courseRoleMappings.some((crm) => crm.jobRoleId === rs.jobRoleId));
    out.push({
      competency: { roleId: rs.jobRoleId, roleTitle: rs.jobRole.title, skillName: rs.skill.name, requiredProficiency: rs.proficiencyLevel },
      courseCoverage: relevantCourses.length,
      coverageStatus: relevantCourses.length >= 3 ? "FULL_COVERAGE" : relevantCourses.length >= 1 ? "PARTIAL_COVERAGE" : "NOT_IDENTIFIED",
    });
  }
  return ok({ competencies: out });
}
