/**
 * KAUSHAL DRISHTI — Phase 7 Candidate Intelligence Service
 * ---------------------------------------------------------------------
 * Computes candidate skill profiles, individual skill gaps, readiness
 * signals, gap priorities, course matches, and development pathways.
 *
 * Pipeline: CANDIDATE EVIDENCE → VERIFIED SKILLS → TARGET ROLE →
 * MARKET REQUIREMENTS → SKILL/COMPETENCY COMPARISON → INDIVIDUAL GAP
 * INTELLIGENCE → READINESS → PRIORITIES → PATHWAY
 *
 * NO employment guarantees. NO policy. Evidence-backed only.
 */
import { db } from "@/lib/db";

const PROFICIENCY_RANK: Record<string, number> = { AWARENESS: 1, WORKING: 2, PROFICIENT: 3, EXPERT: 4, BEGINNER: 1, BASIC: 2, INTERMEDIATE: 3, ADVANCED: 4 };

// ---------------------------------------------------------------------
// 1. Candidate skill profile computation (evidence aggregation)
// ---------------------------------------------------------------------

export async function computeCandidateSkillProfiles(candidateId: string): Promise<{ updated: number }> {
  const evidence = await db.candidateEvidence.findMany({
    where: { candidateId, skillId: { not: null } },
    include: { skill: true },
  });
  const assessments = await db.candidateAssessment.findMany({
    where: { candidateId, skillId: { not: null } },
  });

  // Group by skillId
  const bySkill = new Map<string, { evidence: typeof evidence; assessments: typeof assessments }>();
  for (const e of evidence) {
    if (!e.skillId) continue;
    const ex = bySkill.get(e.skillId) ?? { evidence: [], assessments: [] };
    ex.evidence.push(e);
    bySkill.set(e.skillId, ex);
  }
  for (const a of assessments) {
    if (!a.skillId) continue;
    const ex = bySkill.get(a.skillId) ?? { evidence: [], assessments: [] };
    ex.assessments.push(a);
    bySkill.set(a.skillId, ex);
  }

  let count = 0;
  for (const [skillId, data] of bySkill) {
    // Determine current proficiency: weighted by evidence type
    const evidenceWeights: Record<string, number> = {
      ASSESSED: 1.0, CERTIFIED: 1.0, EMPLOYER_VERIFIED: 0.9, PROJECT: 0.8, EXPERIENCE: 0.8, SELF_DECLARED: 0.4, SYSTEM_INFERRED: 0.3, UNKNOWN: 0.2,
    };
    let totalWeight = 0;
    let weightedRankSum = 0;
    let confidenceSum = 0;
    let latestDate = new Date(0);

    for (const e of [...data.evidence, ...data.assessments.map((a) => ({ evidenceType: "ASSESSED", evidenceTimestamp: a.assessedAt, proficiencyLevel: a.proficiencyLevel, confidence: a.confidence, skillId: a.skillId, verificationStatus: "VERIFIED" as const }))]) {
      const w = evidenceWeights[e.evidenceType] ?? 0.3;
      const rank = PROFICIENCY_RANK[e.proficiencyLevel] ?? 2;
      totalWeight += w;
      weightedRankSum += rank * w;
      confidenceSum += (e.confidence ?? 0.5) * w;
      if (e.evidenceTimestamp > latestDate) latestDate = e.evidenceTimestamp;
    }

    const avgRank = totalWeight > 0 ? weightedRankSum / totalWeight : 2;
    const currentProficiency = avgRank >= 3.5 ? "EXPERT" : avgRank >= 2.5 ? "PROFICIENT" : avgRank >= 1.5 ? "WORKING" : "AWARENESS";
    const proficiencyConfidence = totalWeight > 0 ? Math.min(1, confidenceSum / totalWeight) : 0.3;
    const evidenceStrength = Math.min(1, totalWeight / 4);
    const evidenceCount = data.evidence.length + data.assessments.length;

    // Freshness
    const monthsOld = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const freshnessStatus = latestDate.getTime() === 0 ? "UNKNOWN" : monthsOld < 6 ? "CURRENT" : monthsOld < 12 ? "RECENT" : monthsOld < 24 ? "AGING" : "STALE";

    // Status
    const hasVerified = data.evidence.some((e) => e.verificationStatus === "VERIFIED") || data.assessments.length > 0;
    const hasAssessed = data.assessments.length > 0 || data.evidence.some((e) => e.evidenceType === "ASSESSED");
    const status = evidenceCount === 0 ? "INSUFFICIENT_EVIDENCE" :
      hasAssessed ? "ASSESSED" : hasVerified ? "VERIFIED" : evidenceStrength > 0.3 ? "SUPPORTED" : freshnessStatus === "STALE" ? "STALE" : "SELF_DECLARED";

    await db.candidateSkill.upsert({
      where: { candidateId_skillId: { candidateId, skillId } },
      update: { currentProficiency, proficiencyConfidence, evidenceStrength, evidenceCount, lastVerifiedAt: latestDate, lastAssessedAt: data.assessments[0]?.assessedAt ?? null, freshnessStatus, status },
      create: { candidateId, skillId, currentProficiency, proficiencyConfidence, evidenceStrength, evidenceCount, lastVerifiedAt: latestDate, freshnessStatus, status },
    });
    count++;
  }
  return { updated: count };
}

// ---------------------------------------------------------------------
// 2. Individual gap engine
// ---------------------------------------------------------------------

export async function computeCandidateGaps(candidateId: string, targetRoleId: string, period: string): Promise<{ gapsCreated: number }> {
  // Get role requirements (from RoleSkill)
  const roleSkills = await db.roleSkill.findMany({
    where: { jobRoleId: targetRoleId },
    include: { skill: true },
  });

  // Get candidate skills
  const candidateSkills = await db.candidateSkill.findMany({ where: { candidateId } });

  let count = 0;
  for (const rs of roleSkills) {
    const cs = candidateSkills.find((c) => c.skillId === rs.skillId);
    const requiredProf = rs.proficiencyLevel;
    const candidateProf = cs?.currentProficiency ?? null;
    const reqRank = PROFICIENCY_RANK[requiredProf] ?? 0;

    let gapType = "UNKNOWN";
    let gapSeverity: string | null = null;
    let status = "OPEN";

    if (!cs || cs.evidenceCount === 0) {
      gapType = "MISSING_SKILL";
      gapSeverity = "CRITICAL";
      status = "OPEN";
    } else {
      const candRank = PROFICIENCY_RANK[candidateProf ?? "WORKING"] ?? 0;
      if (candRank >= reqRank) {
        gapType = "ALIGNED";
        gapSeverity = "LOW";
        status = "RESOLVED";
      } else if (candRank > 0 && candRank < reqRank) {
        gapType = "PROFICIENCY_GAP";
        gapSeverity = reqRank - candRank >= 2 ? "HIGH" : "MODERATE";
        status = "OPEN";
      } else {
        gapType = "INSUFFICIENT_EVIDENCE";
        gapSeverity = "INFORMATIONAL";
      }
      // Stale evidence check
      if (cs.freshnessStatus === "STALE" && gapType === "ALIGNED") {
        gapType = "STALE_EVIDENCE";
        gapSeverity = "MODERATE";
        status = "OPEN";
      }
    }

    await db.candidateSkillGap.upsert({
      where: { candidateId_targetRoleId_skillId_observationPeriod: { candidateId, targetRoleId, skillId: rs.skillId, observationPeriod: period } },
      update: { requiredProficiency: requiredProf, candidateProficiency: candidateProf ?? "UNKNOWN", gapType, gapSeverity, candidateEvidenceConfidence: cs?.proficiencyConfidence ?? 0, marketRequirementConfidence: 0.7, evidenceCount: cs?.evidenceCount ?? 0, freshness: cs?.freshnessStatus ?? "UNKNOWN", status },
      create: { candidateId, targetRoleId, skillId: rs.skillId, requiredProficiency: requiredProf, candidateProficiency: candidateProf ?? "UNKNOWN", gapType, gapSeverity, candidateEvidenceConfidence: cs?.proficiencyConfidence ?? 0, marketRequirementConfidence: 0.7, evidenceCount: cs?.evidenceCount ?? 0, freshness: cs?.freshnessStatus ?? "UNKNOWN", status, observationPeriod: period },
    });
    count++;
  }

  // Compute readiness
  await computeReadiness(candidateId, targetRoleId, period);
  return { gapsCreated: count };
}

// ---------------------------------------------------------------------
// 3. Readiness computation
// ---------------------------------------------------------------------

async function computeReadiness(candidateId: string, targetRoleId: string, period: string) {
  const gaps = await db.candidateSkillGap.findMany({ where: { candidateId, targetRoleId, observationPeriod: period } });
  const totalSkills = gaps.length;
  const aligned = gaps.filter((g) => g.gapType === "ALIGNED").length;
  const missing = gaps.filter((g) => g.gapType === "MISSING_SKILL").length;
  const proficiencyGaps = gaps.filter((g) => g.gapType === "PROFICIENCY_GAP").length;
  const stale = gaps.filter((g) => g.gapType === "STALE_EVIDENCE").length;
  const insufficient = gaps.filter((g) => g.gapType === "INSUFFICIENT_EVIDENCE").length;

  const skillCoverage = totalSkills > 0 ? aligned / totalSkills : 0;
  const proficiencyAlignment = totalSkills > 0 ? (aligned + insufficient * 0.5) / totalSkills : 0;
  const evidenceConfidence = gaps.length > 0 ? gaps.reduce((s, g) => s + g.candidateEvidenceConfidence, 0) / gaps.length : 0;

  const criticalGaps = gaps.filter((g) => g.gapSeverity === "CRITICAL").length;
  const highGaps = gaps.filter((g) => g.gapSeverity === "HIGH").length;
  const moderateGaps = gaps.filter((g) => g.gapSeverity === "MODERATE").length;

  const overallReadiness = skillCoverage >= 0.8 && criticalGaps === 0 ? "HIGH_READINESS" :
    skillCoverage >= 0.5 && criticalGaps <= 1 ? "MODERATE_READINESS" :
    skillCoverage > 0 ? "DEVELOPING" : "LOW_READINESS";

  await db.candidateRoleReadiness.upsert({
    where: { candidateId_targetRoleId: { candidateId, targetRoleId } },
    update: { overallReadinessSignal: overallReadiness, skillCoverage, proficiencyAlignment, evidenceConfidence, criticalGapCount: criticalGaps, highGapCount: highGaps, moderateGapCount: moderateGaps, marketConfidence: 0.7, candidateConfidence: evidenceConfidence },
    create: { candidateId, targetRoleId, overallReadinessSignal: overallReadiness, skillCoverage, proficiencyAlignment, evidenceConfidence, criticalGapCount: criticalGaps, highGapCount: highGaps, moderateGapCount: moderateGaps, marketConfidence: 0.7, candidateConfidence: evidenceConfidence },
  });
}

// ---------------------------------------------------------------------
// 4. Gap prioritization
// ---------------------------------------------------------------------

export async function computeGapPriorities(candidateId: string, targetRoleId: string) {
  const gaps = await db.candidateSkillGap.findMany({ where: { candidateId, targetRoleId }, include: { skill: true } });
  await db.candidateGapPriority.deleteMany({ where: { candidateId, targetRoleId } });

  for (const gap of gaps) {
    // Check if skill is emerging
    const emerging = await db.emergingSkillSignal.findUnique({ where: { skillId: gap.skillId } });
    // Check training availability
    const courseSkills = await db.courseSkill.findMany({ where: { skillId: gap.skillId } });

    let priority = "MEDIUM";
    let reason = "";

    if (gap.gapSeverity === "CRITICAL") {
      priority = "CRITICAL";
      reason = "Core skill missing — required by target role with strong market evidence.";
    } else if (gap.gapSeverity === "HIGH") {
      priority = "HIGH";
      reason = "Significant proficiency gap between market requirement and demonstrated level.";
    } else if (emerging && emerging.emergenceStatus !== "INSUFFICIENT_EVIDENCE") {
      priority = "HIGH";
      reason = `Emerging market skill (${emerging.emergenceStatus}) with role relevance.`;
    } else if (gap.gapSeverity === "MODERATE") {
      priority = "MEDIUM";
      reason = "Moderate proficiency gap — improvement recommended.";
    } else if (gap.gapType === "ALIGNED") {
      priority = "INFORMATIONAL";
      reason = "Skill aligned — no action required.";
    }

    await db.candidateGapPriority.create({
      data: {
        candidateId, targetRoleId, gapId: gap.id,
        marketImportance: gap.gapSeverity === "CRITICAL" ? 1.0 : gap.gapSeverity === "HIGH" ? 0.7 : 0.4,
        employerSignal: "MEDIUM",
        proficiencyGap: gap.gapType === "PROFICIENCY_GAP" ? 0.5 : 0,
        candidateConfidence: gap.candidateEvidenceConfidence,
        marketConfidence: gap.marketRequirementConfidence,
        emergingSignal: emerging?.emergenceStatus ?? "NONE",
        trainingAvailability: courseSkills.length > 0 ? "AVAILABLE" : "UNKNOWN",
        prioritySignal: priority,
        priorityReason: reason,
      },
    });
  }
}

// ---------------------------------------------------------------------
// 5. Course matching
// ---------------------------------------------------------------------

export async function matchCourses(candidateId: string, targetRoleId: string) {
  const gaps = await db.candidateSkillGap.findMany({ where: { candidateId, targetRoleId, gapType: { in: ["MISSING_SKILL", "PROFICIENCY_GAP", "STALE_EVIDENCE"] } }, include: { skill: true } });
  await db.candidateCourseMatch.deleteMany({ where: { candidateId, targetRoleId } });

  for (const gap of gaps) {
    // Find courses covering this skill
    const courseSkills = await db.courseSkill.findMany({ where: { skillId: gap.skillId }, include: { course: { include: { sector: true, courseOfferings: { include: { trainingCentre: { include: { district: true } } } } } } } });

    for (const cs of courseSkills.slice(0, 5)) { // top 5 per gap
      const course = cs.course;
      const offerings = course.courseOfferings;

      // Get relevance profile if exists
      const relevance = await db.courseRelevanceProfile.findFirst({ where: { courseId: course.id, jobRoleId: targetRoleId } });

      // Get delivery capability
      const deliveryGaps = await db.deliveryCapabilityGap.findMany({ where: { courseId: course.id }, take: 1 });

      const skillCoverage = cs.coverageStrength ?? 0.5;
      const proficiencyAlignment = cs.expectedProficiency && gap.candidateProficiency ?
        (PROFICIENCY_RANK[cs.expectedProficiency] ?? 0) >= (PROFICIENCY_RANK[gap.requiredProficiency] ?? 0) ? "ALIGNED" : "LOWER_THAN_MARKET" : "UNKNOWN";
      const courseRelevance = relevance?.relevanceScore ?? 50;
      const centreReadiness = deliveryGaps[0]?.overallCapabilityStatus ?? "UNKNOWN";
      const matchConfidence = Math.min(1, skillCoverage * 0.3 + (courseRelevance / 100) * 0.3 + (relevance?.evidenceConfidence ?? 0.5) * 0.2 + 0.2);

      const matchStatus = matchConfidence >= 0.7 && proficiencyAlignment === "ALIGNED" ? "STRONG_MATCH" :
        matchConfidence >= 0.5 ? "MATCH" : matchConfidence >= 0.3 ? "PARTIAL_MATCH" : "WEAK_MATCH";

      const matchReason = `Covers ${gap.skill.name} at ${cs.coverageLevel}. Course relevance: ${Math.round(courseRelevance)}/100. Proficiency alignment: ${proficiencyAlignment}.`;

      await db.candidateCourseMatch.create({
        data: {
          candidateId, courseId: course.id, targetRoleId,
          matchedGapIds: JSON.stringify([gap.id]),
          skillCoverage, proficiencyAlignment, courseRelevance,
          centreReadiness, trainerCapability: deliveryGaps[0]?.trainerStatus ?? "UNKNOWN",
          equipmentCapability: deliveryGaps[0]?.equipmentStatus ?? "UNKNOWN",
          capacityAvailability: deliveryGaps[0]?.capacityStatus ?? "UNKNOWN",
          geographicAccess: offerings.length > 0 ? "LOCAL" : "UNKNOWN",
          matchStatus, matchConfidence, matchReason,
        },
      });
    }
  }
}

// ---------------------------------------------------------------------
// 6. Development pathway generation
// ---------------------------------------------------------------------

export async function generatePathway(candidateId: string, targetRoleId: string) {
  const gaps = await db.candidateSkillGap.findMany({ where: { candidateId, targetRoleId, status: "OPEN", gapType: { in: ["MISSING_SKILL", "PROFICIENCY_GAP", "STALE_EVIDENCE", "INSUFFICIENT_EVIDENCE"] } }, include: { skill: true }, orderBy: { gapSeverity: "desc" } });
  const priorities = await db.candidateGapPriority.findMany({ where: { candidateId, targetRoleId }, orderBy: { prioritySignal: "desc" } });

  // Upsert pathway
  const existing = await db.candidateDevelopmentPath.findUnique({ where: { candidateId_targetRoleId: { candidateId, targetRoleId } } });
  if (existing) await db.developmentPathwayStep.deleteMany({ where: { pathwayId: existing.id } });

  const pathway = await db.candidateDevelopmentPath.upsert({
    where: { candidateId_targetRoleId: { candidateId, targetRoleId } },
    update: { pathwayStatus: "ACTIVE" },
    create: { candidateId, targetRoleId, pathwayStatus: "ACTIVE" },
  });

  let sequence = 1;
  for (const gap of gaps.slice(0, 8)) { // max 8 steps
    const priority = priorities.find((p) => p.gapId === gap.id);
    if (priority?.prioritySignal === "INFORMATIONAL") continue;

    // Determine action type
    let actionType = "COURSE";
    let evidenceRequired = "Assessment + Project";
    if (gap.gapType === "INSUFFICIENT_EVIDENCE") {
      actionType = "ASSESSMENT";
      evidenceRequired = "Verified assessment";
    } else if (gap.gapType === "STALE_EVIDENCE") {
      actionType = "ASSESSMENT";
      evidenceRequired = "Re-assessment";
    } else if (gap.gapType === "PROFICIENCY_GAP") {
      actionType = "PROJECT";
      evidenceRequired = "Project + Assessment";
    }

    // Find best course match for this gap
    const courseMatch = await db.candidateCourseMatch.findFirst({ where: { candidateId, targetRoleId }, orderBy: { matchConfidence: "desc" } });

    await db.developmentPathwayStep.create({
      data: {
        pathwayId: pathway.id,
        sequence: sequence++,
        actionType,
        skillId: gap.skillId,
        courseId: courseMatch?.courseId ?? null,
        objective: `Develop ${gap.skill.name} from ${gap.candidateProficiency ?? "none"} to ${gap.requiredProficiency}`,
        evidenceRequired,
        status: "PENDING",
      },
    });
  }

  // Compute opportunity readiness
  await computeOpportunityReadiness(candidateId, targetRoleId);
}

// ---------------------------------------------------------------------
// 7. Opportunity readiness
// ---------------------------------------------------------------------

async function computeOpportunityReadiness(candidateId: string, targetRoleId: string) {
  const readiness = await db.candidateRoleReadiness.findUnique({ where: { candidateId_targetRoleId: { candidateId, targetRoleId } } });
  if (!readiness) return;

  const overall = readiness.overallReadinessSignal === "HIGH_READINESS" ? "READY_FOR_CONSIDERATION" :
    readiness.overallReadinessSignal === "MODERATE_READINESS" ? "DEVELOPING" :
    readiness.overallReadinessSignal === "DEVELOPING" ? "DEVELOPING" :
    readiness.criticalGapCount > 2 ? "SIGNIFICANT_GAPS" : "INSUFFICIENT_EVIDENCE";

  await db.candidateOpportunityReadiness.upsert({
    where: { candidateId_targetRoleId: { candidateId, targetRoleId } },
    update: {
      roleReadiness: readiness.skillCoverage,
      skillReadiness: readiness.skillCoverage,
      competencyReadiness: readiness.competencyCoverage,
      evidenceReadiness: readiness.evidenceConfidence,
      criticalGapCount: readiness.criticalGapCount,
      highGapCount: readiness.highGapCount,
      marketConfidence: readiness.marketConfidence,
      candidateConfidence: readiness.candidateConfidence,
      overallReadinessSignal: overall,
    },
    create: {
      candidateId, targetRoleId,
      roleReadiness: readiness.skillCoverage,
      skillReadiness: readiness.skillCoverage,
      competencyReadiness: readiness.competencyCoverage,
      evidenceReadiness: readiness.evidenceConfidence,
      criticalGapCount: readiness.criticalGapCount,
      highGapCount: readiness.highGapCount,
      marketConfidence: readiness.marketConfidence,
      candidateConfidence: readiness.candidateConfidence,
      overallReadinessSignal: overall,
    },
  });
}
