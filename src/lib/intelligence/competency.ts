/**
 * KAUSHAL DRISHTI — Phase 3 Competency Foundation
 * ---------------------------------------------------------------------
 * Builds competency profiles for roles and courses. This is the
 * FOUNDATION layer — it just describes what proficiency a role expects
 * and what proficiency a course teaches. It does NOT compute gaps,
 * demand-supply mismatches, or recommendations (those are later phases).
 *
 * Outputs are pure descriptions suitable for the UI to render.
 */
import { db } from "@/lib/db";
import {
  COVERAGE_TO_PROFICIENCY,
  PROFICIENCY_RANK,
  type ProficiencyLevel,
  type CoverageLevel,
} from "./vocab";

export interface RoleCompetency {
  skillId: string;
  skillName: string;
  canonicalName: string;
  category: string | null;
  importance: number;
  proficiencyExpected: ProficiencyLevel;
}

export interface CourseCompetency {
  skillId: string;
  skillName: string;
  canonicalName: string;
  category: string | null;
  coverage: CoverageLevel;
  proficiencyConfers: ProficiencyLevel;
}

export interface RoleCompetencyProfile {
  roleId: string;
  roleTitle: string;
  sectorName: string | null;
  totalSkills: number;
  byProficiency: Record<ProficiencyLevel, number>;
  competencies: RoleCompetency[];
}

export interface CourseCompetencyProfile {
  courseId: string;
  courseName: string;
  courseCode: string;
  sectorName: string | null;
  qualificationName: string | null;
  durationHours: number;
  status: string;
  totalSkills: number;
  byCoverage: Record<CoverageLevel, number>;
  competencies: CourseCompetency[];
}

/** Build a role's expected-competency profile (from RoleSkill rows). */
export async function getRoleCompetencyProfile(roleId: string): Promise<RoleCompetencyProfile | null> {
  const role = await db.jobRole.findUnique({
    where: { id: roleId },
    include: {
      sector: true,
      roleSkills: {
        include: { skill: true },
        orderBy: { importance: "desc" },
      },
    },
  });
  if (!role) return null;

  const competencies: RoleCompetency[] = role.roleSkills.map((rs) => ({
    skillId: rs.skillId,
    skillName: rs.skill.name,
    canonicalName: rs.skill.canonicalName,
    category: rs.skill.category,
    importance: rs.importance,
    proficiencyExpected: (rs.proficiencyLevel as ProficiencyLevel) ?? "WORKING",
  }));

  const byProficiency = competencies.reduce(
    (acc, c) => {
      acc[c.proficiencyExpected] = (acc[c.proficiencyExpected] ?? 0) + 1;
      return acc;
    },
    { AWARENESS: 0, WORKING: 0, PROFICIENT: 0, EXPERT: 0 } as Record<ProficiencyLevel, number>,
  );

  return {
    roleId: role.id,
    roleTitle: role.title,
    sectorName: role.sector?.name ?? null,
    totalSkills: competencies.length,
    byProficiency,
    competencies,
  };
}

/** Build a course's taught-competency profile (from CourseSkill rows). */
export async function getCourseCompetencyProfile(courseId: string): Promise<CourseCompetencyProfile | null> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      sector: true,
      qualification: true,
      courseSkills: {
        include: { skill: true },
        orderBy: { coverageLevel: "desc" },
      },
    },
  });
  if (!course) return null;

  const competencies: CourseCompetency[] = course.courseSkills.map((cs) => {
    const coverage = (cs.coverageLevel as CoverageLevel) ?? "INTRODUCED";
    return {
      skillId: cs.skillId,
      skillName: cs.skill.name,
      canonicalName: cs.skill.canonicalName,
      category: cs.skill.category,
      coverage,
      proficiencyConfers: COVERAGE_TO_PROFICIENCY[coverage],
    };
  });

  const byCoverage = competencies.reduce(
    (acc, c) => {
      acc[c.coverage] = (acc[c.coverage] ?? 0) + 1;
      return acc;
    },
    { NONE: 0, INTRODUCED: 0, REINFORCED: 0, MASTERED: 0 } as Record<CoverageLevel, number>,
  );

  return {
    courseId: course.id,
    courseName: course.name,
    courseCode: course.code,
    sectorName: course.sector?.name ?? null,
    qualificationName: course.qualification?.name ?? null,
    durationHours: course.durationHours,
    status: course.status,
    totalSkills: competencies.length,
    byCoverage,
    competencies,
  };
}

/**
 * Compare a course's conferred proficiencies against a role's expected
 * proficiencies — but ONLY at the descriptive level (matches / shortfalls
 * by proficiency rank). This is NOT a labour-market gap analysis; it is
 * a competency-level structural comparison used to populate the
 * Competency Framework UI. Demand/supply weighting arrives in Phase 4+.
 */
export interface CompetencyAlignment {
  skillId: string;
  skillName: string;
  expected: ProficiencyLevel;
  conferred: ProficiencyLevel | null;
  gap: "COVERED" | "EXCEEDS" | "SHORTFALL" | "NOT_TAUGHT";
  gapRank: number; // negative = shortfall, 0 = covered, positive = exceeds
}

export async function getCourseRoleAlignment(
  courseId: string,
  roleId: string,
): Promise<CompetencyAlignment[]> {
  const [courseProfile, roleProfile] = await Promise.all([
    getCourseCompetencyProfile(courseId),
    getRoleCompetencyProfile(roleId),
  ]);
  if (!courseProfile || !roleProfile) return [];

  const courseMap = new Map(courseProfile.competencies.map((c) => [c.skillId, c]));
  const out: CompetencyAlignment[] = [];

  for (const rc of roleProfile.competencies) {
    const cc = courseMap.get(rc.skillId);
    if (!cc) {
      out.push({
        skillId: rc.skillId,
        skillName: rc.skillName,
        expected: rc.proficiencyExpected,
        conferred: null,
        gap: "NOT_TAUGHT",
        gapRank: -PROFICIENCY_RANK[rc.proficiencyExpected],
      });
      continue;
    }
    const expRank = PROFICIENCY_RANK[rc.proficiencyExpected];
    const conRank = PROFICIENCY_RANK[cc.proficiencyConfers];
    const diff = conRank - expRank;
    out.push({
      skillId: rc.skillId,
      skillName: rc.skillName,
      expected: rc.proficiencyExpected,
      conferred: cc.proficiencyConfers,
      gap: diff === 0 ? "COVERED" : diff > 0 ? "EXCEEDS" : "SHORTFALL",
      gapRank: diff,
    });
  }
  return out;
}
