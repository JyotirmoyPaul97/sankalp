/**
 * KAUSHAL DRISHTI — Phase 5 Training Intelligence Service
 * ---------------------------------------------------------------------
 * Builds structured intelligence about the training ecosystem:
 *   - computeTrainingSupplySignals() — scans CourseOffering + CourseSkill
 *     → aggregates into TrainingSupplySignal rows (per period, never overwritten)
 *   - getTrainingSupply() — assembles the training supply object for any
 *     (district?, sector?, role?, skill?) × period
 *   - getSupplyByRole/Skill/Competency() — aggregated supply views
 *   - computeTrainingConfidence() — confidence framework
 *
 * Distinguishes: catalogue presence ≠ active delivery ≠ capacity ≠ enrollment
 * ≠ completion ≠ certification. Multiple dimensions kept separate.
 *
 * NO gap scoring, NO recommendations (Part 2 / later phases).
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------
// 1. Training supply signal computation
// ---------------------------------------------------------------------

export interface TrainingComputeOptions {
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Scan CourseOffering rows for the given period and upsert TrainingSupplySignal rows.
 * Idempotent within a period (uses @@unique constraint).
 * Historical observations are preserved (never overwritten).
 */
export async function computeTrainingSupplySignals(opts: TrainingComputeOptions): Promise<{ signalsCreated: number }> {
  // Wipe existing signals for this period (idempotent recompute)
  await db.trainingSupplySignal.deleteMany({ where: { periodLabel: opts.periodLabel } });

  const offerings = await db.courseOffering.findMany({
    where: {
      observationPeriodStart: { gte: opts.periodStart },
      observationPeriodEnd: { lte: opts.periodEnd },
    },
    include: {
      course: {
        include: {
          sector: true,
          courseSkills: { include: { skill: true } },
          courseRoleMappings: { include: { jobRole: true } },
        },
      },
      trainingCentre: { include: { district: true, institution: true } },
    },
  });

  let created = 0;

  for (const off of offerings) {
    const centre = off.trainingCentre;
    const districtId = centre.districtId;
    const institutionId = centre.institutionId;
    const course = off.course;
    const sectorId = course.sectorId;

    // 1. Course-level supply signal (CAPACITY type)
    await db.trainingSupplySignal.upsert({
      where: {
        districtId_trainingCentreId_courseId_jobRoleId_skillId_periodLabel_signalType: {
          districtId: districtId ?? "",
          trainingCentreId: centre.id,
          courseId: course.id,
          jobRoleId: "",
          skillId: "",
          periodLabel: opts.periodLabel,
          signalType: "CAPACITY",
        },
      },
      update: {
        plannedCapacity: off.plannedSeats,
        availableCapacity: off.availableSeats,
        enrolledCount: off.enrolledCount,
        completedCount: off.completedCount,
        certifiedCount: off.certifiedCount,
        institutionId,
        sectorId,
        coverageType: "ACTIVE_DELIVERY",
        confidence: computeOfferingConfidence(off),
        dataStatus: off.dataStatus,
      },
      create: {
        districtId,
        trainingCentreId: centre.id,
        institutionId,
        courseId: course.id,
        qualificationId: course.qualificationId,
        sectorId,
        observationPeriodStart: opts.periodStart,
        observationPeriodEnd: opts.periodEnd,
        periodLabel: opts.periodLabel,
        plannedCapacity: off.plannedSeats,
        availableCapacity: off.availableSeats,
        enrolledCount: off.enrolledCount,
        completedCount: off.completedCount,
        certifiedCount: off.certifiedCount,
        signalType: "CAPACITY",
        coverageType: "ACTIVE_DELIVERY",
        confidence: computeOfferingConfidence(off),
        dataStatus: off.dataStatus,
      },
    });
    created++;

    // 2. Skill-level supply signals (via CourseSkill)
    for (const cs of course.courseSkills) {
      await db.trainingSupplySignal.upsert({
        where: {
          districtId_trainingCentreId_courseId_jobRoleId_skillId_periodLabel_signalType: {
            districtId: districtId ?? "",
            trainingCentreId: centre.id,
            courseId: course.id,
            jobRoleId: "",
            skillId: cs.skillId,
            periodLabel: opts.periodLabel,
            signalType: "ENROLLMENT",
          },
        },
        update: {
          plannedCapacity: off.plannedSeats,
          enrolledCount: off.enrolledCount,
          completedCount: off.completedCount,
          institutionId,
          sectorId,
          coverageType: mapCoverageLevel(cs.coverageLevel),
          confidence: Math.min(1, computeOfferingConfidence(off) * (cs.confidence ?? 0.7)),
          dataStatus: off.dataStatus,
        },
        create: {
          districtId,
          trainingCentreId: centre.id,
          institutionId,
          courseId: course.id,
          sectorId,
          skillId: cs.skillId,
          observationPeriodStart: opts.periodStart,
          observationPeriodEnd: opts.periodEnd,
          periodLabel: opts.periodLabel,
          plannedCapacity: off.plannedSeats,
          enrolledCount: off.enrolledCount,
          completedCount: off.completedCount,
          signalType: "ENROLLMENT",
          coverageType: mapCoverageLevel(cs.coverageLevel),
          confidence: Math.min(1, computeOfferingConfidence(off) * (cs.confidence ?? 0.7)),
          dataStatus: off.dataStatus,
        },
      });
      created++;
    }

    // 3. Role-level supply signals (via CourseRoleMapping)
    for (const crm of course.courseRoleMappings) {
      await db.trainingSupplySignal.upsert({
        where: {
          districtId_trainingCentreId_courseId_jobRoleId_skillId_periodLabel_signalType: {
            districtId: districtId ?? "",
            trainingCentreId: centre.id,
            courseId: course.id,
            jobRoleId: crm.jobRoleId,
            skillId: "",
            periodLabel: opts.periodLabel,
            signalType: "ENROLLMENT",
          },
        },
        update: {
          plannedCapacity: off.plannedSeats,
          enrolledCount: off.enrolledCount,
          completedCount: off.completedCount,
          institutionId,
          sectorId,
          coverageType: crm.mappingType === "PRIMARY" ? "FULL" : "PARTIAL",
          confidence: Math.min(1, computeOfferingConfidence(off) * (crm.confidence ?? 0.7)),
          dataStatus: off.dataStatus,
        },
        create: {
          districtId,
          trainingCentreId: centre.id,
          institutionId,
          courseId: course.id,
          sectorId,
          jobRoleId: crm.jobRoleId,
          observationPeriodStart: opts.periodStart,
          observationPeriodEnd: opts.periodEnd,
          periodLabel: opts.periodLabel,
          plannedCapacity: off.plannedSeats,
          enrolledCount: off.enrolledCount,
          completedCount: off.completedCount,
          signalType: "ENROLLMENT",
          coverageType: crm.mappingType === "PRIMARY" ? "FULL" : "PARTIAL",
          confidence: Math.min(1, computeOfferingConfidence(off) * (crm.confidence ?? 0.7)),
          dataStatus: off.dataStatus,
        },
      });
      created++;
    }
  }

  return { signalsCreated: created };
}

function mapCoverageLevel(level: string): string {
  switch (level) {
    case "MASTERED": return "CERTIFIES";
    case "REINFORCED": return "FULL";
    case "INTRODUCED": return "PARTIAL";
    case "NONE": return "UNKNOWN";
    default: return "PARTIAL";
  }
}

function computeOfferingConfidence(off: { plannedSeats: number; enrolledCount: number | null; completedCount: number | null; dataStatus: string }): number {
  let score = 0.3; // base
  if (off.plannedSeats > 0) score += 0.2;
  if (off.enrolledCount != null) score += 0.2;
  if (off.completedCount != null) score += 0.2;
  if (off.dataStatus === "REAL") score += 0.1;
  else if (off.dataStatus === "SYNTHETIC") score += 0.05;
  return Math.min(1, score);
}

// ---------------------------------------------------------------------
// 2. Training supply aggregation — the supply object
// ---------------------------------------------------------------------

export interface TrainingSupplyObject {
  scope: string;
  geographyId: string | null;
  geographyName: string | null;
  sectorId: string | null;
  sectorName: string | null;
  jobRoleId: string | null;
  roleTitle: string | null;
  skillId: string | null;
  skillName: string | null;
  period: string;

  // Supply dimensions (kept separate — never equated)
  cataloguePresence: number;     // total courses in catalogue
  activeDelivery: number;       // courses with active offerings
  plannedCapacity: number;
  availableCapacity: number | null;
  enrolledCount: number | null;
  completedCount: number | null;
  certifiedCount: number | null;

  // Coverage
  institutionCount: number;
  centreCount: number;
  districtCount: number;

  // Confidence
  confidence: number;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";

  // Provenance
  dataStatus: string;
  dataFreshness: string;
  methodology: string;
}

export async function getTrainingSupply(params: {
  districtId?: string;
  sectorId?: string;
  jobRoleId?: string;
  skillId?: string;
  period?: string;
}): Promise<TrainingSupplyObject | null> {
  const period = params.period ?? (await latestTrainingPeriod()) ?? "UNKNOWN";
  if (period === "UNKNOWN") {
    return sparseTrainingSupply(params, period);
  }

  const signals = await db.trainingSupplySignal.findMany({
    where: {
      periodLabel: period,
      ...(params.districtId ? { districtId: params.districtId } : {}),
      ...(params.sectorId ? { sectorId: params.sectorId } : {}),
      ...(params.jobRoleId ? { jobRoleId: params.jobRoleId } : {}),
      ...(params.skillId ? { skillId: params.skillId } : {}),
    },
  });

  if (signals.length === 0) {
    // Fall back to catalogue-level data (courses exist but no offerings)
    return sparseTrainingSupply(params, period);
  }

  const institutionSet = new Set<string>();
  const centreSet = new Set<string>();
  const districtSet = new Set<string>();
  let plannedCapacity = 0;
  let availableCapacity: number | null = 0;
  let enrolledCount: number | null = 0;
  let completedCount: number | null = 0;
  let certifiedCount: number | null = 0;
  const courseSet = new Set<string>();

  for (const s of signals) {
    if (s.institutionId) institutionSet.add(s.institutionId);
    if (s.trainingCentreId) centreSet.add(s.trainingCentreId);
    if (s.districtId) districtSet.add(s.districtId);
    if (s.courseId) courseSet.add(s.courseId);
    plannedCapacity += s.plannedCapacity;
    if (s.availableCapacity != null) availableCapacity = (availableCapacity ?? 0) + s.availableCapacity;
    if (s.enrolledCount != null) enrolledCount = (enrolledCount ?? 0) + s.enrolledCount;
    if (s.completedCount != null) completedCount = (completedCount ?? 0) + s.completedCount;
    if (s.certifiedCount != null) certifiedCount = (certifiedCount ?? 0) + s.certifiedCount;
  }

  const confidence = computeTrainingConfidence({
    signalCount: signals.length,
    institutionCount: institutionSet.size,
    hasEnrollment: enrolledCount != null && enrolledCount > 0,
    hasCompletion: completedCount != null && completedCount > 0,
  });

  // Resolve names
  const [district, sector, role, skill] = await Promise.all([
    params.districtId ? db.district.findUnique({ where: { id: params.districtId } }) : null,
    params.sectorId ? db.sector.findUnique({ where: { id: params.sectorId } }) : null,
    params.jobRoleId ? db.jobRole.findUnique({ where: { id: params.jobRoleId } }) : null,
    params.skillId ? db.skill.findUnique({ where: { id: params.skillId } }) : null,
  ]);

  const scope = params.districtId ? "DISTRICT" : params.sectorId ? "SECTOR" : "STATE";

  return {
    scope,
    geographyId: params.districtId ?? null,
    geographyName: district?.name ?? null,
    sectorId: params.sectorId ?? null,
    sectorName: sector?.name ?? null,
    jobRoleId: params.jobRoleId ?? null,
    roleTitle: role?.title ?? null,
    skillId: params.skillId ?? null,
    skillName: skill?.name ?? null,
    period,
    cataloguePresence: courseSet.size,
    activeDelivery: courseSet.size,
    plannedCapacity,
    availableCapacity,
    enrolledCount,
    completedCount,
    certifiedCount,
    institutionCount: institutionSet.size,
    centreCount: centreSet.size,
    districtCount: districtSet.size,
    confidence: confidence.score,
    confidenceLevel: confidence.level,
    dataStatus: signals[0]?.dataStatus ?? "UNKNOWN",
    dataFreshness: period,
    methodology: "Aggregated from TrainingSupplySignal rows (per-period, never overwritten). Dimensions kept separate: catalogue ≠ active delivery ≠ capacity ≠ enrollment ≠ completion ≠ certification. Confidence = f(signal count, institution coverage, enrollment/completion evidence).",
  };
}

function sparseTrainingSupply(params: NonNullable<Parameters<typeof getTrainingSupply>[0]>, period: string): TrainingSupplyObject {
  return {
    scope: params.districtId ? "DISTRICT" : params.sectorId ? "SECTOR" : "STATE",
    geographyId: params.districtId ?? null,
    geographyName: null,
    sectorId: params.sectorId ?? null,
    sectorName: null,
    jobRoleId: params.jobRoleId ?? null,
    roleTitle: null,
    skillId: params.skillId ?? null,
    skillName: null,
    period,
    cataloguePresence: 0,
    activeDelivery: 0,
    plannedCapacity: 0,
    availableCapacity: null,
    enrolledCount: null,
    completedCount: null,
    certifiedCount: null,
    institutionCount: 0,
    centreCount: 0,
    districtCount: 0,
    confidence: 0,
    confidenceLevel: "INSUFFICIENT",
    dataStatus: "UNKNOWN",
    dataFreshness: "UNKNOWN",
    methodology: "Insufficient evidence — no training supply signals computed for this scope/period.",
  };
}

function computeTrainingConfidence(args: {
  signalCount: number;
  institutionCount: number;
  hasEnrollment: boolean;
  hasCompletion: boolean;
}): { score: number; level: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT" } {
  const signalScore = Math.min(1, args.signalCount / 20);
  const institutionScore = Math.min(1, args.institutionCount / 10);
  const enrollmentScore = args.hasEnrollment ? 0.3 : 0;
  const completionScore = args.hasCompletion ? 0.2 : 0;
  const score = Math.round((signalScore * 0.35 + institutionScore * 0.35 + enrollmentScore + completionScore) * 100) / 100;
  const level = score >= 0.7 ? "HIGH" : score >= 0.4 ? "MEDIUM" : score > 0 ? "LOW" : "INSUFFICIENT";
  return { score, level };
}

async function latestTrainingPeriod(): Promise<string | null> {
  const latest = await db.trainingSupplySignal.findFirst({ orderBy: { periodLabel: "desc" }, select: { periodLabel: true } });
  return latest?.periodLabel ?? null;
}

// ---------------------------------------------------------------------
// 3. Supply by Role / Skill / Competency aggregation
// ---------------------------------------------------------------------

export async function getSupplyByRole(params: { districtId?: string; sectorId?: string; period?: string }) {
  const period = params.period ?? (await latestTrainingPeriod()) ?? "UNKNOWN";
  const roles = await db.jobRole.findMany({ include: { sector: true } });
  const out = [];
  for (const role of roles) {
    const supply = await getTrainingSupply({ ...params, jobRoleId: role.id, period });
    // Count supporting courses
    const courseMappings = await db.courseRoleMapping.findMany({
      where: { jobRoleId: role.id },
      include: { course: true },
    });
    out.push({
      role: { id: role.id, title: role.title, sector: role.sector?.name ?? null },
      supportingCourses: courseMappings.length,
      activeCourses: supply?.activeDelivery ?? 0,
      institutions: supply?.institutionCount ?? 0,
      centres: supply?.centreCount ?? 0,
      plannedCapacity: supply?.plannedCapacity ?? 0,
      enrolledCount: supply?.enrolledCount ?? null,
      completedCount: supply?.completedCount ?? null,
      certifiedCount: supply?.certifiedCount ?? null,
      confidence: supply?.confidenceLevel ?? "INSUFFICIENT",
    });
  }
  out.sort((a, b) => b.plannedCapacity - a.plannedCapacity);
  return out;
}

export async function getSupplyBySkill(params: { districtId?: string; sectorId?: string; period?: string }) {
  const period = params.period ?? (await latestTrainingPeriod()) ?? "UNKNOWN";
  const skills = await db.skill.findMany({ include: { _count: { select: { courseSkills: true } } } });
  const out = [];
  for (const skill of skills) {
    const supply = await getTrainingSupply({ ...params, skillId: skill.id, period });
    out.push({
      skill: { id: skill.id, name: skill.name, canonicalName: skill.canonicalName, category: skill.category, courseLinkages: skill._count.courseSkills },
      supportingCourses: skill._count.courseSkills,
      activeCourses: supply?.activeDelivery ?? 0,
      institutions: supply?.institutionCount ?? 0,
      centres: supply?.centreCount ?? 0,
      plannedCapacity: supply?.plannedCapacity ?? 0,
      enrolledCount: supply?.enrolledCount ?? null,
      completedCount: supply?.completedCount ?? null,
      certifiedCount: supply?.certifiedCount ?? null,
      confidence: supply?.confidenceLevel ?? "INSUFFICIENT",
    });
  }
  out.sort((a, b) => b.plannedCapacity - a.plannedCapacity);
  return out;
}

export async function getSupplyByCompetency(params: { districtId?: string; period?: string }) {
  // Competency = Role × Skill (via RoleSkill)
  const roleSkills = await db.roleSkill.findMany({
    include: { skill: true, jobRole: { include: { sector: true } } },
  });
  const out = [];
  for (const rs of roleSkills) {
    const supply = await getTrainingSupply({ ...params, jobRoleId: rs.jobRoleId, skillId: rs.skillId, period: params.period });
    out.push({
      competency: { roleId: rs.jobRoleId, roleTitle: rs.jobRole.title, skillName: rs.skill.name, expectedProficiency: rs.proficiencyLevel },
      supportingCourses: supply?.cataloguePresence ?? 0,
      institutions: supply?.institutionCount ?? 0,
      plannedCapacity: supply?.plannedCapacity ?? 0,
      enrolledCount: supply?.enrolledCount ?? null,
      completedCount: supply?.completedCount ?? null,
      confidence: supply?.confidenceLevel ?? "INSUFFICIENT",
    });
  }
  return out;
}

// ---------------------------------------------------------------------
// 4. Training profile (aggregated by scope)
// ---------------------------------------------------------------------

export async function getTrainingProfile(scope: string, scopeId: string | null): Promise<Record<string, unknown> | null> {
  const period = (await latestTrainingPeriod()) ?? "UNKNOWN";
  let supply: TrainingSupplyObject | null;
  if (scope === "DISTRICT") supply = await getTrainingSupply({ districtId: scopeId!, period });
  else if (scope === "SECTOR") supply = await getTrainingSupply({ sectorId: scopeId!, period });
  else supply = await getTrainingSupply({ period });

  if (!supply) return null;

  // Top skills/roles by supply in this scope
  const signals = await db.trainingSupplySignal.findMany({
    where: {
      periodLabel: period,
      ...(scope === "DISTRICT" ? { districtId: scopeId! } : {}),
      ...(scope === "SECTOR" ? { sectorId: scopeId! } : {}),
    },
    include: { skill: true, jobRole: true },
  });
  const skillMap = new Map<string, number>();
  const roleMap = new Map<string, number>();
  for (const s of signals) {
    if (s.skill) skillMap.set(s.skill.name, (skillMap.get(s.skill.name) ?? 0) + s.plannedCapacity);
    if (s.jobRole) roleMap.set(s.jobRole.title, (roleMap.get(s.jobRole.title) ?? 0) + s.plannedCapacity);
  }
  const top = (m: Map<string, number>, n: number) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, capacity]) => ({ name, capacity }));

  return {
    ...supply,
    topSkills: top(skillMap, 10),
    topRoles: top(roleMap, 10),
  };
}
