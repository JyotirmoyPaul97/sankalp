import { ok } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET() {
  const emerging = await db.emergingSkillSignal.findMany({ include: { skill: true }, where: { emergenceStatus: { in: ["EARLY_SIGNAL", "EMERGING", "ACCELERATING"] } } });
  const out = [];
  for (const e of emerging) {
    const curriculumCoverage = await db.curriculumSkillMapping.findMany({ where: { skillId: e.skillId } });
    const courseCoverage = await db.courseSkill.findMany({ where: { skillId: e.skillId } });
    out.push({
      skill: e.skill.name,
      emergenceStatus: e.emergenceStatus,
      coursePresence: courseCoverage.length > 0,
      curriculumPresence: curriculumCoverage.length > 0,
      coverageStatus: curriculumCoverage.length > 0 ? "EMERGING_AND_COVERED" : courseCoverage.length > 0 ? "EMERGING_PARTIALLY_COVERED" : "EMERGING_NOT_IDENTIFIED",
      confidence: e.confidence,
    });
  }
  return ok({ emergingSkills: out });
}
