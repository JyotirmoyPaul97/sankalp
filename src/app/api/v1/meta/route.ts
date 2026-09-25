import { db } from "@/lib/db";
import { ok } from "@/lib/api";

/**
 * GET /api/v1/meta — platform metadata for the frontend shell.
 * Phase status, roles, data-status vocabulary, navigation hints.
 */
export async function GET() {
  const phases = [
    { id: "overview", label: "Overview", phase: 1, active: true },
    { id: "districts", label: "District Intelligence", phase: 1, active: true },
    { id: "labour-market", label: "Labour Market", phase: 4, active: false },
    { id: "skills", label: "Skills", phase: 1, active: true },
    { id: "training", label: "Training Ecosystem", phase: 1, active: true },
    { id: "courses", label: "Courses", phase: 1, active: true },
    { id: "employer-validation", label: "Employer Validation", phase: 7, active: false },
    { id: "policy-sandbox", label: "Policy Sandbox", phase: 11, active: false },
    { id: "district-plans", label: "District Plans", phase: 9, active: false },
    { id: "outcomes", label: "Outcomes", phase: 12, active: false },
    { id: "data-sources", label: "Data Sources", phase: 1, active: true },
    { id: "admin", label: "Administration", phase: 1, active: true },
  ];

  const roleList = [
    { id: "STATE_ADMIN", label: "State Administrator" },
    { id: "DISTRICT_PLANNER", label: "District Planner" },
    { id: "TRAINING_PROVIDER", label: "Training Provider" },
    { id: "EMPLOYER", label: "Employer" },
    { id: "INSTITUTION", label: "Institution" },
    { id: "TRAINER", label: "Trainer" },
    { id: "CANDIDATE", label: "Candidate" },
    { id: "AUDITOR", label: "Auditor" },
  ];

  const dataStatusVocab = ["REAL", "SYNTHETIC", "MODELLED", "DEMO", "UNKNOWN"];

  // safe counts — never hard-coded in app code, derived from DB.
  let counts: Record<string, number> = {};
  let dataHealth: Record<string, number> = {};
  let knowledgeHealth: Record<string, number> = {};
  let marketHealth: Record<string, number> = {};
  try {
    counts = {
      districts: await db.district.count(),
      sectors: await db.sector.count(),
      jobRoles: await db.jobRole.count(),
      skills: await db.skill.count(),
      courses: await db.course.count(),
      employers: await db.employer.count(),
      institutions: await db.institution.count(),
      qualifications: await db.qualification.count(),
      dataSources: await db.dataSource.count(),
      // Phase 3 knowledge-graph counts
      skillAliases: await db.skillAlias.count(),
      skillRelations: await db.skillRelation.count(),
      skillClusters: await db.skillCluster.count(),
      roleCompetencies: await db.roleSkill.count(),
      courseCompetencies: await db.courseSkill.count(),
      // Phase 4 market-intelligence counts
      divisions: await db.division.count(),
      economicClusters: await db.economicCluster.count(),
      marketSignals: await db.marketSignal.count(),
      demandSnapshots: await db.demandSnapshot.count(),
      emergingSignals: await db.emergingSkillSignal.count(),
      skillSectorPresence: await db.skillSectorPresence.count(),
      sectorGrowthProfiles: await db.sectorGrowthProfile.count(),
      // Phase 5 training-intelligence counts
      trainingProviders: await db.trainingProvider.count(),
      trainingCentres: await db.trainingCentre.count(),
      courseOfferings: await db.courseOffering.count(),
      trainingCertifications: await db.trainingCertification.count(),
      courseRoleMappings: await db.courseRoleMapping.count(),
      trainingSupplySignals: await db.trainingSupplySignal.count(),
    };
    // Phase 2 data-health metrics for the Overview page
    const activeSources = await db.dataSource.count({ where: { isActive: true } });
    const recentImports = await db.ingestionBatch.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });
    const jobPostings = await db.jobPosting.count();
    const employerSurveys = await db.employerSurvey.count();
    const industryConsultations = await db.industryConsultation.count();
    const sectorGrowth = await db.sectorGrowth.count();
    const placementOutcomes = await db.placementOutcome.count();
    const technologyTrends = await db.technologyTrend.count();
    const totalIngested = jobPostings + employerSurveys + industryConsultations + sectorGrowth + placementOutcomes + technologyTrends;
    // Average quality score across completed batches
    const completedBatches = await db.ingestionBatch.findMany({
      where: { qualityScore: { not: null }, status: { in: ["COMPLETED", "COMPLETED_WITH_WARNINGS"] } },
      select: { qualityScore: true },
    });
    const avgQuality = completedBatches.length > 0
      ? Math.round(completedBatches.reduce((s, b) => s + (b.qualityScore ?? 0), 0) / completedBatches.length)
      : 0;
    dataHealth = {
      activeSources,
      recentImports,
      jobPostings,
      employerSurveys,
      industryConsultations,
      sectorGrowth,
      placementOutcomes,
      technologyTrends,
      totalIngested,
      avgQuality,
      totalBatches: await db.ingestionBatch.count(),
    };
    // Phase 3 knowledge-graph health
    knowledgeHealth = {
      skillAliases: counts.skillAliases,
      skillRelations: counts.skillRelations,
      skillClusters: counts.skillClusters,
      roleCompetencies: counts.roleCompetencies,
      courseCompetencies: counts.courseCompetencies,
    };
    marketHealth = {
      divisions: counts.divisions,
      economicClusters: counts.economicClusters,
      marketSignals: counts.marketSignals,
      demandSnapshots: counts.demandSnapshots,
      emergingSignals: counts.emergingSignals,
      skillSectorPresence: counts.skillSectorPresence,
      sectorGrowthProfiles: counts.sectorGrowthProfiles,
    };
  } catch {
    counts = {};
    dataHealth = {};
    knowledgeHealth = {};
    marketHealth = {};
  }

  return ok({
    service: "kaushal-drishti",
    tagline: "From Labour-Market Evidence to Better Skill Decisions.",
    phase: "phase-11",
    environment: process.env.APP_ENV || "development",
    dataDisclaimer: "Demo Environment — Synthetic Data",
    phases,
    roles: roleList,
    dataStatusVocab,
    counts,
    dataHealth,
    knowledgeHealth,
    marketHealth,
  });
}
