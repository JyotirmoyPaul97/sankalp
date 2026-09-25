/**
 * KAUSHAL DRISHTI — Phase 12.5 Candidate Workspace Seed
 * ---------------------------------------------------------------------
 * SYNTHETIC DEMONSTRATION DATA ONLY.
 *
 * Creates a concrete, demo-ready candidate "Arjun Sharma" mapped to a
 * CANDIDATE login user, with a hand-crafted skill profile that matches
 * the Phase 12.5 Part 1 / Part 2 narrative:
 *
 *   Target Role: PLC Technician
 *   - PLC Programming   : WORKING (Intermediate)  → EXPERT required   = HIGH gap
 *   - SCADA             : PROFICIENT (Advanced)   → PROFICIENT req    = None (aligned)
 *   - Workplace Safety  : WORKING (Intermediate)  → WORKING required = None (aligned)
 *   - Industrial IoT    : AWARENESS (Basic)       → emerging, MEDIUM gap
 *
 * Evidence: Assessment + Project + Certificate + Practice per relevant skill.
 * Gaps, readiness, gap-priorities, course-match, development path,
 * opportunity readiness, and gap-resolution events (skill evolution) are
 * seeded directly so the demo is deterministic.
 *
 * Idempotent: deletes & recreates Arjun's candidate-scoped rows each run.
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const CANDIDATE_EMAIL = "arjun.sharma@kaushal-drishti.demo";
const CANDIDATE_USER_NAME = "Arjun Sharma";
const CANDIDATE_PASSWORD = "demo-candidate";

// Hard-coded canonical IDs (stable across the synthetic dataset).
const PLC_TECHNICIAN_ROLE_ID = "cmugpxxn3000joa7z9phrtqxb";
const SKILL_PLC = "cmugpxxmw0006oa7z371lg058";
const SKILL_SCADA = "cmugpxxmx0007oa7zhf6jpk5w";
const SKILL_SAFETY = "cmugpxxn0000doa7zpng6c64y";
const SKILL_IOT = "cmugpxxmy000aoa7zp08sp9yf";
const COURSE_PLC_SCADA = "cmugwkmmo00gioa73e8j2eysr"; // Advanced Industrial Automation — PLC & SCADA

// Proficiency vocabulary (DB canonical): AWARENESS | WORKING | PROFICIENT | EXPERT
const P = { AWARENESS: "AWARENESS", WORKING: "WORKING", PROFICIENT: "PROFICIENT", EXPERT: "EXPERT" } as const;

async function main() {
  console.log("Seeding Phase 12.5 Candidate Workspace (Arjun Sharma)…");

  // Resolve Pune district (fallback to first district).
  const pune = (await db.district.findMany()).find((d) => d.name.toLowerCase().includes("pune")) ?? (await db.district.findFirst())!;

  // 1. Upsert the CANDIDATE login user.
  const existingUser = await db.user.findUnique({ where: { email: CANDIDATE_EMAIL } });
  if (existingUser) {
    await db.user.update({ where: { id: existingUser.id }, data: { name: CANDIDATE_USER_NAME, role: "CANDIDATE", passwordHash: CANDIDATE_PASSWORD, isActive: true } });
  } else {
    await db.user.create({ data: { email: CANDIDATE_EMAIL, name: CANDIDATE_USER_NAME, role: "CANDIDATE", passwordHash: CANDIDATE_PASSWORD, isActive: true } });
  }
  console.log("  ✓ CANDIDATE login user:", CANDIDATE_EMAIL, "/", CANDIDATE_PASSWORD);

  // 2. Upsert the Candidate record (keyed by email). Delete cascading rows first.
  let candidate = await db.candidate.findUnique({ where: { email: CANDIDATE_EMAIL } });
  if (candidate) {
    await db.candidateGapResolutionEvent.deleteMany({ where: { candidateId: candidate.id } });
    await db.developmentPathwayStep.deleteMany({ where: { pathway: { candidateId: candidate.id } } });
    await db.candidateDevelopmentPath.deleteMany({ where: { candidateId: candidate.id } });
    await db.candidateOpportunityReadiness.deleteMany({ where: { candidateId: candidate.id } });
    await db.candidateCourseMatch.deleteMany({ where: { candidateId: candidate.id } });
    await db.candidateGapPriority.deleteMany({ where: { candidateId: candidate.id } });
    await db.candidateRoleReadiness.deleteMany({ where: { candidateId: candidate.id } });
    await db.candidateSkillGap.deleteMany({ where: { candidateId: candidate.id } });
    await db.candidateTargetProfile.deleteMany({ where: { candidateId: candidate.id } });
    await db.candidateAssessment.deleteMany({ where: { candidateId: candidate.id } });
    await db.candidateEvidence.deleteMany({ where: { candidateId: candidate.id } });
    await db.candidateSkill.deleteMany({ where: { candidateId: candidate.id } });
    await db.candidate.update({ where: { id: candidate.id }, data: { name: CANDIDATE_USER_NAME, currentDistrictId: pune.id, status: "ACTIVE", dataStatus: "SYNTHETIC" } });
  } else {
    candidate = await db.candidate.create({
      data: { name: CANDIDATE_USER_NAME, email: CANDIDATE_EMAIL, educationLevel: "ITI", experienceYears: 3, currentDistrictId: pune.id, status: "ACTIVE", dataStatus: "SYNTHETIC" },
    });
  }
  const cid = candidate!.id;
  console.log("  ✓ Candidate:", CANDIDATE_USER_NAME, "(", cid, ")");

  // 3. Skills — 4 demonstrated skills at the spec's narrative levels.
  const skillDefs = [
    { skillId: SKILL_PLC, proficiency: P.WORKING, confidence: 0.78, evidenceStrength: 0.6, freshness: "RECENT", status: "ASSESSED" },
    { skillId: SKILL_SCADA, proficiency: P.PROFICIENT, confidence: 0.82, evidenceStrength: 0.65, freshness: "CURRENT", status: "ASSESSED" },
    { skillId: SKILL_SAFETY, proficiency: P.WORKING, confidence: 0.72, evidenceStrength: 0.55, freshness: "RECENT", status: "SUPPORTED" },
    { skillId: SKILL_IOT, proficiency: P.AWARENESS, confidence: 0.45, evidenceStrength: 0.3, freshness: "STALE", status: "SELF_DECLARED" },
  ];
  for (const s of skillDefs) {
    await db.candidateSkill.upsert({
      where: { candidateId_skillId: { candidateId: cid, skillId: s.skillId } },
      update: {
        currentProficiency: s.proficiency,
        proficiencyConfidence: s.confidence,
        evidenceStrength: s.evidenceStrength,
        freshnessStatus: s.freshness,
        status: s.status,
        lastVerifiedAt: new Date("2025-08-15"),
        lastAssessedAt: new Date("2025-08-15"),
      },
      create: {
        candidateId: cid, skillId: s.skillId,
        currentProficiency: s.proficiency,
        proficiencyConfidence: s.confidence,
        evidenceStrength: s.evidenceStrength,
        freshnessStatus: s.freshness,
        status: s.status,
        lastVerifiedAt: new Date("2025-08-15"),
        lastAssessedAt: new Date("2025-08-15"),
      },
    });
  }
  console.log("  ✓ 4 candidate skills (PLC, SCADA, Safety, IoT)");

  // 4. Evidence — multiple per skill (Assessment + Project + Certificate + Practice).
  const now = new Date();
  const monthsAgo = (m: number) => new Date(now.getFullYear(), now.getMonth() - m, 15);
  const evidenceSeed: Array<{ skillId: string; type: string; source: string; ts: Date; prof: string; verified: boolean; conf: number; desc: string }> = [
    // PLC Programming — Assessment + Project + Certificate + Practice
    { skillId: SKILL_PLC, type: "ASSESSED", source: "Technical Assessment Centre, Pune", ts: monthsAgo(2), prof: P.WORKING, verified: true, conf: 0.82, desc: "Formal PLC ladder logic assessment. Score 74/100." },
    { skillId: SKILL_PLC, type: "PROJECT", source: "Industrial Conveyor Automation Project", ts: monthsAgo(4), prof: P.WORKING, verified: true, conf: 0.78, desc: "Built PLC program for a 3-zone conveyor sorting cell. Siemens S7-1200." },
    { skillId: SKILL_PLC, type: "CERTIFIED", source: "Siemens PLC Fundamentals Certificate", ts: monthsAgo(6), prof: P.WORKING, verified: true, conf: 0.85, desc: "Industry-recognised PLC fundamentals certification." },
    { skillId: SKILL_PLC, type: "EXPERIENCE", source: "Self Practice Lab", ts: monthsAgo(1), prof: P.WORKING, verified: false, conf: 0.55, desc: "Repeated ladder-logic practice on training rig." },
    // SCADA — Project + Certificate + Employer Verified
    { skillId: SKILL_SCADA, type: "PROJECT", source: "SCADA HMI for Water Treatment", ts: monthsAgo(3), prof: P.PROFICIENT, verified: true, conf: 0.84, desc: "Designed HMI screens and alarms for a water treatment plant SCADA." },
    { skillId: SKILL_SCADA, type: "CERTIFIED", source: "Wonderware InTouch Basics", ts: monthsAgo(8), prof: P.PROFICIENT, verified: true, conf: 0.8, desc: "SCADA HMI configuration certificate." },
    { skillId: SKILL_SCADA, type: "EMPLOYER_VERIFIED", source: "Previous Employer: Apex Automation Pvt Ltd", ts: monthsAgo(5), prof: P.PROFICIENT, verified: true, conf: 0.86, desc: "Employer confirmed SCADA commissioning on 2 live sites." },
    // Workplace Safety — Assessment + Certificate
    { skillId: SKILL_SAFETY, type: "ASSESSED", source: "Industrial Safety Assessment", ts: monthsAgo(7), prof: P.WORKING, verified: true, conf: 0.76, desc: "LOTO + PPE assessment passed." },
    { skillId: SKILL_SAFETY, type: "CERTIFIED", source: "OSHA-Style Safety Foundations", ts: monthsAgo(9), prof: P.WORKING, verified: true, conf: 0.78, desc: "Safety foundations certificate." },
    // Industrial IoT — Self-declared + small project (weak evidence → MEDIUM gap, emerging)
    { skillId: SKILL_IOT, type: "SELF_DECLARED", source: "Self Declaration", ts: monthsAgo(10), prof: P.AWARENESS, verified: false, conf: 0.4, desc: "Self-declared familiarity with IoT sensor fundamentals." },
    { skillId: SKILL_IOT, type: "PROJECT", source: "Arduino Sensor Demo", ts: monthsAgo(11), prof: P.AWARENESS, verified: false, conf: 0.45, desc: "Built a small temperature-sensor demo. Not industrial grade." },
  ];
  const evidenceIds: Record<string, string> = {};
  for (const e of evidenceSeed) {
    const ev = await db.candidateEvidence.create({
      data: {
        candidateId: cid, skillId: e.skillId,
        evidenceType: e.type, evidenceSource: e.source,
        evidenceTimestamp: e.ts, proficiencyLevel: e.prof,
        verificationStatus: e.verified ? "VERIFIED" : "PENDING",
        confidence: e.conf, description: e.desc,
      },
    });
    evidenceIds[`${e.skillId}:${e.type}`] = ev.id;
  }
  console.log("  ✓", evidenceSeed.length, "evidence records (Assessment / Project / Certificate / Practice / Employer)");

  // 5. Assessments.
  await db.candidateAssessment.create({ data: { candidateId: cid, skillId: SKILL_PLC, assessmentType: "FORMAL", proficiencyLevel: P.WORKING, score: 74, assessedAt: monthsAgo(2), confidence: 0.82 } });
  await db.candidateAssessment.create({ data: { candidateId: cid, skillId: SKILL_SCADA, assessmentType: "PRACTICAL", proficiencyLevel: P.PROFICIENT, score: 81, assessedAt: monthsAgo(3), confidence: 0.84 } });
  await db.candidateAssessment.create({ data: { candidateId: cid, skillId: SKILL_SAFETY, assessmentType: "FORMAL", proficiencyLevel: P.WORKING, score: 78, assessedAt: monthsAgo(7), confidence: 0.76 } });
  console.log("  ✓ 3 assessments");

  // 6. Target profile — PLC Technician.
  await db.candidateTargetProfile.create({
    data: {
      candidateId: cid, targetRoleId: PLC_TECHNICIAN_ROLE_ID,
      targetSectorId: "cmugpxxmu0003oa7zixuwwtdj", // Advanced Manufacturing
      targetDistrictId: pune.id,
      marketDemandSignal: "HIGH", marketConfidence: 0.78,
    },
  });
  console.log("  ✓ Target profile: PLC Technician");

  // 7. Skill gaps — role-required gaps for the 3 role skills + an emerging IoT gap.
  const gapPLC = await db.candidateSkillGap.create({
    data: { candidateId: cid, targetRoleId: PLC_TECHNICIAN_ROLE_ID, skillId: SKILL_PLC, requiredProficiency: P.EXPERT, candidateProficiency: P.WORKING, gapType: "PROFICIENCY_GAP", gapSeverity: "HIGH", candidateEvidenceConfidence: 0.78, marketRequirementConfidence: 0.85, evidenceCount: 4, freshness: "RECENT", status: "OPEN", observationPeriod: "2026-Q1" },
  });
  const gapSCADA = await db.candidateSkillGap.create({
    data: { candidateId: cid, targetRoleId: PLC_TECHNICIAN_ROLE_ID, skillId: SKILL_SCADA, requiredProficiency: P.PROFICIENT, candidateProficiency: P.PROFICIENT, gapType: "ALIGNED", gapSeverity: null, candidateEvidenceConfidence: 0.82, marketRequirementConfidence: 0.8, evidenceCount: 3, freshness: "CURRENT", status: "RESOLVED", observationPeriod: "2026-Q1" },
  });
  const gapSafety = await db.candidateSkillGap.create({
    data: { candidateId: cid, targetRoleId: PLC_TECHNICIAN_ROLE_ID, skillId: SKILL_SAFETY, requiredProficiency: P.WORKING, candidateProficiency: P.WORKING, gapType: "ALIGNED", gapSeverity: null, candidateEvidenceConfidence: 0.72, marketRequirementConfidence: 0.75, evidenceCount: 2, freshness: "RECENT", status: "RESOLVED", observationPeriod: "2026-Q1" },
  });
  const gapIoT = await db.candidateSkillGap.create({
    data: { candidateId: cid, targetRoleId: PLC_TECHNICIAN_ROLE_ID, skillId: SKILL_IOT, requiredProficiency: P.WORKING, candidateProficiency: P.AWARENESS, gapType: "PROFICIENCY_GAP", gapSeverity: "MEDIUM", candidateEvidenceConfidence: 0.45, marketRequirementConfidence: 0.7, evidenceCount: 2, freshness: "STALE", status: "OPEN", observationPeriod: "2026-Q1" },
  });
  console.log("  ✓ 4 skill gaps (PLC=HIGH, SCADA/Safety=aligned, IoT=MEDIUM emerging)");

  // 8. Role readiness.
  await db.candidateRoleReadiness.create({
    data: {
      candidateId: cid, targetRoleId: PLC_TECHNICIAN_ROLE_ID,
      overallReadinessSignal: "DEVELOPING",
      skillCoverage: 0.67, competencyCoverage: 0.6, proficiencyAlignment: 0.55,
      evidenceConfidence: 0.74, criticalGapCount: 0, highGapCount: 1, moderateGapCount: 1,
      marketConfidence: 0.78, candidateConfidence: 0.7, dataStatus: "SYNTHETIC",
    },
  });
  console.log("  ✓ Role readiness: DEVELOPING");

  // 9. Gap priorities — with reasons explaining WHY.
  await db.candidateGapPriority.create({
    data: { candidateId: cid, targetRoleId: PLC_TECHNICIAN_ROLE_ID, gapId: gapPLC.id, marketImportance: 0.9, employerSignal: "HIGH", proficiencyGap: 0.75, candidateConfidence: 0.78, marketConfidence: 0.85, emergingSignal: "NONE", trainingAvailability: "AVAILABLE", prioritySignal: "HIGH", priorityReason: "Market demand HIGH + role requires EXPERT + candidate at WORKING + strong evidence confidence. Closing this gap most improves role readiness." },
  });
  await db.candidateGapPriority.create({
    data: { candidateId: cid, targetRoleId: PLC_TECHNICIAN_ROLE_ID, gapId: gapIoT.id, marketImportance: 0.65, employerSignal: "MEDIUM", proficiencyGap: 0.5, candidateConfidence: 0.45, marketConfidence: 0.7, emergingSignal: "EARLY_SIGNAL", trainingAvailability: "PARTIAL", prioritySignal: "MEDIUM", priorityReason: "Emerging skill with EARLY_SIGNAL in market + candidate evidence weak (STALE) + partial training availability. Build before it becomes critical." },
  });
  console.log("  ✓ 2 gap priorities (PLC=HIGH with reason, IoT=MEDIUM emerging with reason)");

  // 10. Course match — PLC & SCADA advanced course.
  await db.candidateCourseMatch.create({
    data: {
      candidateId: cid, courseId: COURSE_PLC_SCADA, targetRoleId: PLC_TECHNICIAN_ROLE_ID,
      matchedGapIds: JSON.stringify([gapPLC.id]),
      skillCoverage: 0.85, competencyCoverage: 0.8, proficiencyAlignment: "STRONG",
      courseRelevance: 88, centreReadiness: "READY", trainerCapability: "AVAILABLE",
      equipmentCapability: "AVAILABLE", capacityAvailability: "LIMITED", geographicAccess: "SAME_DISTRICT",
      matchStatus: "STRONG_MATCH", matchConfidence: 0.86,
      matchReason: "Covers PLC Programming + SCADA at advanced level. Centre in Pune has trainer + equipment ready. Directly addresses the HIGH-priority PLC gap.",
    },
  });
  console.log("  ✓ Course match: Advanced Industrial Automation — PLC & SCADA (STRONG_MATCH)");

  // 11. Development path — the spec's flow: Current → Gap → Practice → Assessment → Project → Verification → Updated proficiency.
  const path = await db.candidateDevelopmentPath.create({
    data: { candidateId: cid, targetRoleId: PLC_TECHNICIAN_ROLE_ID, pathwayStatus: "ACTIVE", estimatedSequence: JSON.stringify([1, 2, 3, 4, 5]) },
  });
  const pathSteps = [
    { seq: 1, actionType: "PRACTICE", skillId: SKILL_PLC, courseId: COURSE_PLC_SCADA, objective: "Advanced PLC ladder-logic practice on Siemens S7 rig", status: "IN_PROGRESS", evidenceRequired: "Practice activity log" },
    { seq: 2, actionType: "ASSESSMENT", skillId: SKILL_PLC, courseId: null, objective: "Technical assessment to verify advanced PLC proficiency", status: "PENDING", evidenceRequired: "Assessment score >= 75" },
    { seq: 3, actionType: "PROJECT", skillId: SKILL_PLC, courseId: null, objective: "Industrial automation project — multi-station PLC control", status: "PENDING", evidenceRequired: "Project artefact + supervisor sign-off" },
    { seq: 4, actionType: "CERTIFICATION", skillId: SKILL_PLC, courseId: null, objective: "Siemens Advanced PLC certification", status: "PENDING", evidenceRequired: "Verified certificate" },
    { seq: 5, actionType: "MENTORSHIP", skillId: SKILL_PLC, courseId: null, objective: "Employer verification of demonstrated advanced proficiency", status: "PENDING", evidenceRequired: "Employer feedback" },
  ];
  for (const st of pathSteps) {
    await db.developmentPathwayStep.create({ data: { pathwayId: path.id, sequence: st.seq, actionType: st.actionType, skillId: st.skillId, courseId: st.courseId, objective: st.objective, status: st.status, evidenceRequired: st.evidenceRequired } });
  }
  console.log("  ✓ Development path with 5 steps (Practice → Assessment → Project → Certification → Mentorship)");

  // 12. Opportunity readiness.
  await db.candidateOpportunityReadiness.create({
    data: {
      candidateId: cid, targetRoleId: PLC_TECHNICIAN_ROLE_ID,
      roleReadiness: 0.58, skillReadiness: 0.62, competencyReadiness: 0.6, evidenceReadiness: 0.74,
      criticalGapCount: 0, highGapCount: 1, marketConfidence: 0.78, candidateConfidence: 0.7,
      overallReadinessSignal: "DEVELOPING",
    },
  });
  console.log("  ✓ Opportunity readiness: DEVELOPING");

  // 13. Gap resolution events — the skill evolution timeline (PLC Programming progression).
  const timelineEvents = [
    { ts: monthsAgo(14), action: "ASSESSMENT_COMPLETED", evType: "ASSESSED", prof: P.AWARENESS, desc: "Baseline assessment — PLC Programming assessed at Awareness." },
    { ts: monthsAgo(11), action: "PRACTICE_EVIDENCE_ADDED", evType: "EXPERIENCE", prof: P.AWARENESS, desc: "Practice lab sessions logged — moving towards Working." },
    { ts: monthsAgo(8), action: "CERTIFICATE_ADDED", evType: "CERTIFIED", prof: P.WORKING, desc: "Siemens PLC Fundamentals certificate — proficiency raised to Working (Intermediate)." },
    { ts: monthsAgo(6), action: "PROJECT_ADDED", evType: "PROJECT", prof: P.WORKING, desc: "Conveyor automation project — Working level consolidated." },
    { ts: monthsAgo(2), action: "ASSESSMENT_COMPLETED", evType: "ASSESSED", prof: P.WORKING, desc: "Formal assessment confirmed Working (Intermediate) proficiency." },
  ];
  for (const t of timelineEvents) {
    const ev = await db.candidateEvidence.create({
      data: { candidateId: cid, skillId: SKILL_PLC, evidenceType: t.evType, evidenceSource: "Evolution Timeline", evidenceTimestamp: t.ts, proficiencyLevel: t.prof, verificationStatus: "VERIFIED", confidence: 0.7, description: t.desc },
    });
    await db.candidateGapResolutionEvent.create({
      data: { candidateId: cid, gapId: gapPLC.id, actionType: t.action, evidenceId: ev.id, previousStatus: "OPEN", newStatus: "OPEN", timestamp: t.ts },
    });
  }
  console.log("  ✓ Skill evolution timeline: 6 events (Awareness → Working progression)");

  console.log("\n✓ Phase 12.5 Candidate Workspace seed complete. ALL DATA IS SYNTHETIC.");
  console.log("  Login: " + CANDIDATE_EMAIL + " / " + CANDIDATE_PASSWORD);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
