/**
 * KAUSHAL DRISHTI — Phase 6 Part 1 Course Relevance + Curriculum Intelligence
 * ---------------------------------------------------------------------
 * Computes course relevance signals by comparing market requirements
 * (Phase 4) with course/curriculum coverage (Phase 5 + Phase 6 Part 1).
 *
 * Outputs: CourseRelevanceProfile, CurriculumGapSignal
 * NO recommendations. Diagnostic intelligence only.
 */
import { db } from "@/lib/db";

const PROFICIENCY_RANK: Record<string, number> = { AWARENESS: 1, WORKING: 2, PROFICIENT: 3, EXPERT: 4 };

export async function computeCourseRelevance(period: string): Promise<{ profilesCreated: number }> {
  await db.courseRelevanceProfile.deleteMany({ where: { observationPeriod: period } });
  await db.curriculumGapSignal.deleteMany({ where: { observationPeriod: period } });

  const courses = await db.course.findMany({
    include: {
      courseSkills: { include: { skill: true } },
      courseRoleMappings: { include: { jobRole: true } },
      curriculumVersions: { include: { modules: { include: { skillMappings: { include: { skill: true } } } } } },
    },
  });

  let count = 0;
  for (const course of courses) {
    // Get the latest active curriculum version
    const activeVersions = course.curriculumVersions.filter((v) => v.status === "ACTIVE").sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());
    const latestVersion = activeVersions[0] ?? course.curriculumVersions[0];

    // Get gap signals for this course from Phase 5
    const gaps = await db.demandSupplyGapSignal.findMany({
      where: { period, jobRoleId: { not: null } },
      include: { skill: true, jobRole: true },
    });
    const courseGaps = gaps.filter((g) => course.courseRoleMappings.some((crm) => crm.jobRoleId === g.jobRoleId));

    // Compute role alignment
    const roleAlignments = course.courseRoleMappings.map((crm) => crm.mappingType);
    const hasPrimary = roleAlignments.includes("PRIMARY");
    const roleAlignment = hasPrimary ? "STRONG_ALIGNMENT" : roleAlignments.length > 0 ? "PARTIAL_ALIGNMENT" : "NO_CONFIDENT_ALIGNMENT";

    // Compute skill alignment
    const courseSkillIds = new Set(course.courseSkills.map((cs) => cs.skillId));
    const marketSkillsInScope = courseGaps.filter((g) => g.skillId);
    const coveredMarketSkills = marketSkillsInScope.filter((g) => courseSkillIds.has(g.skillId!));
    const skillAlignment = marketSkillsInScope.length === 0 ? "INSUFFICIENT_DATA" :
      coveredMarketSkills.length === marketSkillsInScope.length ? "FULL_COVERAGE" :
      coveredMarketSkills.length > 0 ? "PARTIAL_COVERAGE" : "NOT_IDENTIFIED";

    // Compute proficiency alignment
    let profStatus = "UNKNOWN";
    if (course.courseSkills.length > 0 && marketSkillsInScope.length > 0) {
      let mismatches = 0;
      let aligned = 0;
      for (const g of marketSkillsInScope) {
        const cs = course.courseSkills.find((c) => c.skillId === g.skillId);
        if (!cs || !cs.expectedProficiency || !g.requiredProficiency) continue;
        const courseRank = PROFICIENCY_RANK[cs.expectedProficiency] ?? 0;
        const marketRank = PROFICIENCY_RANK[g.requiredProficiency] ?? 0;
        if (courseRank === 0 || marketRank === 0) continue;
        if (courseRank === marketRank) aligned++;
        else if (courseRank < marketRank) mismatches++;
      }
      profStatus = mismatches > aligned ? "LOWER_THAN_MARKET" : aligned > mismatches ? "ALIGNED" : "MIXED";
    }

    // Curriculum freshness
    let freshness = "UNKNOWN";
    if (latestVersion?.revisionDate) {
      const monthsOld = (Date.now() - latestVersion.revisionDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      freshness = monthsOld < 6 ? "RECENT" : monthsOld < 18 ? "CURRENT" : monthsOld < 36 ? "AGING" : "STALE";
    } else if (latestVersion?.effectiveFrom) {
      const monthsOld = (Date.now() - latestVersion.effectiveFrom.getTime()) / (1000 * 60 * 60 * 24 * 30);
      freshness = monthsOld < 12 ? "RECENT" : monthsOld < 24 ? "CURRENT" : monthsOld < 48 ? "AGING" : "STALE";
    }

    // Emerging skill coverage
    const emergingSkills = await db.emergingSkillSignal.findMany({
      where: { emergenceStatus: { in: ["EARLY_SIGNAL", "EMERGING", "ACCELERATING"] } },
    });
    const emergingCovered = emergingSkills.filter((e) => courseSkillIds.has(e.skillId));
    const emergingSkillAlignment = emergingSkills.length === 0 ? "INSUFFICIENT_DATA" :
      emergingCovered.length === emergingSkills.length ? "EMERGING_AND_COVERED" :
      emergingCovered.length > 0 ? "EMERGING_PARTIALLY_COVERED" : "EMERGING_NOT_IDENTIFIED";

    // Coverage status
    const coverageStatus = skillAlignment === "FULL_COVERAGE" && profStatus === "ALIGNED" ? "STRONGLY_ALIGNED" :
      skillAlignment === "PARTIAL_COVERAGE" || skillAlignment === "FULL_COVERAGE" ? "PARTIALLY_ALIGNED" :
      skillAlignment === "NOT_IDENTIFIED" ? "WEAKLY_ALIGNED" : "INSUFFICIENT_DATA";

    // Relevance score (0-100) — transparent, configurable, documented as "initial system configuration"
    const scoreComponents = {
      roleAlignment: roleAlignment === "STRONG_ALIGNMENT" ? 20 : roleAlignment === "PARTIAL_ALIGNMENT" ? 12 : 0,
      skillCoverage: skillAlignment === "FULL_COVERAGE" ? 25 : skillAlignment === "PARTIAL_COVERAGE" ? 15 : skillAlignment === "NOT_IDENTIFIED" ? 0 : 5,
      proficiency: profStatus === "ALIGNED" ? 20 : profStatus === "MIXED" ? 10 : profStatus === "LOWER_THAN_MARKET" ? 5 : 8,
      emerging: emergingSkillAlignment === "EMERGING_AND_COVERED" ? 15 : emergingSkillAlignment === "EMERGING_PARTIALLY_COVERED" ? 8 : 0,
      freshness: freshness === "RECENT" ? 10 : freshness === "CURRENT" ? 8 : freshness === "AGING" ? 4 : 2,
      curriculum: latestVersion ? 10 : 0,
    };
    const relevanceScore = Object.values(scoreComponents).reduce((a, b) => a + b, 0);
    const evidenceConfidence = Math.min(1, (course.courseSkills.length / 5) * 0.4 + (course.courseRoleMappings.length / 3) * 0.3 + (latestVersion ? 0.3 : 0));

    // Create relevance profile (one per course-role mapping)
    for (const crm of course.courseRoleMappings) {
      await db.courseRelevanceProfile.create({
        data: {
          courseId: course.id,
          jobRoleId: crm.jobRoleId,
          roleAlignment,
          competencyAlignment: skillAlignment,
          skillAlignment,
          proficiencyAlignment: profStatus,
          emergingSkillAlignment,
          curriculumFreshness: freshness,
          evidenceConfidence,
          coverageStatus,
          alignmentStatus: coverageStatus,
          relevanceScore,
          observationPeriod: period,
          dataStatus: course.dataStatus,
        },
      });
      count++;
    }

    // Create curriculum gap signals for market skills not covered
    for (const g of marketSkillsInScope) {
      if (!g.skillId) continue;
      const cs = course.courseSkills.find((c) => c.skillId === g.skillId);
      if (!cs) {
        await db.curriculumGapSignal.create({
          data: {
            courseId: course.id, jobRoleId: g.jobRoleId, skillId: g.skillId,
            marketRequirement: g.marketDemandSignal, curriculumCoverage: "NOT_IDENTIFIED",
            proficiencyAlignment: "INSUFFICIENT_DATA", emergingSignal: "UNKNOWN", freshnessSignal: freshness,
            gapType: "MISSING_SKILL", gapSignal: "NO_IDENTIFIED_SUPPLY",
            confidence: g.confidence, observationPeriod: period, dataStatus: g.dataStatus,
          },
        });
      } else if (cs.expectedProficiency && g.requiredProficiency) {
        const courseRank = PROFICIENCY_RANK[cs.expectedProficiency] ?? 0;
        const marketRank = PROFICIENCY_RANK[g.requiredProficiency] ?? 0;
        if (courseRank < marketRank) {
          await db.curriculumGapSignal.create({
            data: {
              courseId: course.id, jobRoleId: g.jobRoleId, skillId: g.skillId,
              marketRequirement: g.requiredProficiency, curriculumCoverage: cs.coverageLevel,
              proficiencyAlignment: "LOWER_THAN_MARKET", emergingSignal: "UNKNOWN", freshnessSignal: freshness,
              gapType: "PROFICIENCY_MISMATCH", gapSignal: "PROFICIENCY_MISMATCH",
              confidence: Math.min(g.confidence, cs.confidence), observationPeriod: period, dataStatus: g.dataStatus,
            },
          });
        }
      }
    }
  }

  return { profilesCreated: count };
}
