import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET() {
  const skills = await db.skill.findMany();
  const out = [];
  for (const skill of skills) {
    const courseSkills = await db.courseSkill.findMany({ where: { skillId: skill.id }, include: { course: true } });
    const curriculumMappings = await db.curriculumSkillMapping.findMany({ where: { skillId: skill.id } });
    const emerging = await db.emergingSkillSignal.findUnique({ where: { skillId: skill.id } });
    out.push({
      skill: { id: skill.id, name: skill.name },
      courseCoverage: courseSkills.length,
      curriculumCoverage: curriculumMappings.length,
      emergingStatus: emerging?.emergenceStatus ?? "INSUFFICIENT_EVIDENCE",
      coverageStatus: courseSkills.length >= 5 ? "FULL_COVERAGE" : courseSkills.length >= 2 ? "PARTIAL_COVERAGE" : courseSkills.length > 0 ? "INTRODUCTORY_COVERAGE" : "NOT_IDENTIFIED",
    });
  }
  return ok({ skills: out });
}
