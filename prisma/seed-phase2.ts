/**
 * KAUSHAL DRISHTI — Phase 2 Synthetic Demonstration Seed
 * ---------------------------------------------------------------------
 * ALL DATA IS SYNTHETIC DEMONSTRATION DATA. Not actual Maharashtra
 * Government data.
 *
 * Generates an internally-consistent large synthetic dataset and runs it
 * through the ingestion pipeline so that batches, provenance records,
 * and quality scores are populated — giving Phase 3+ enough material to
 * demonstrate intelligence.
 *
 * Run: `bun run db:seed:phase2`
 */
import { PrismaClient } from "@prisma/client";
import { previewAndValidate, confirmAndStoreFromRecords } from "../src/lib/ingestion/pipeline";

const db = new PrismaClient();

// Deterministic pseudo-random for reproducibility
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const intBetween = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

async function main() {
  console.log("Seeding Phase 2 synthetic demonstration data…");

  // Wipe Phase 2 tables (keep Phase 1 entities)
  await db.ingestionError.deleteMany();
  await db.ingestionRecord.deleteMany();
  await db.jobPosting.deleteMany();
  await db.employerSurvey.deleteMany();
  await db.industryConsultation.deleteMany();
  await db.sectorGrowth.deleteMany();
  await db.placementOutcome.deleteMany();
  await db.technologyTrend.deleteMany();
  await db.ingestionBatch.deleteMany();
  await db.uploadedFile.deleteMany();
  await db.auditLog.deleteMany();
  // Reset DataSource to the Phase 2 vocabulary + add new demo sources
  await db.dataSource.deleteMany();

  // ===== Load Phase 1 entities for referential consistency =====
  const districts = await db.district.findMany();
  const sectors = await db.sector.findMany();
  const employers = await db.employer.findMany();
  const jobRoles = await db.jobRole.findMany();
  const courses = await db.course.findMany();
  const institutions = await db.institution.findMany();

  if (districts.length === 0 || sectors.length === 0) {
    throw new Error("Phase 1 seed is missing. Run `bun run db:seed` first (Phase 1).");
  }

  // ===== Extend Phase 1 catalogue so synthetic data has more variety =====
  // Add more employers (target 30+ total)
  const existingEmployerNames = new Set(employers.map((e) => e.name));
  const newEmployerDefs = [
    { name: "Demo Precision Tools Pune", sector: "Advanced Manufacturing", district: "Pune", size: "SMALL" },
    { name: "Demo Smart Factory Solutions", sector: "Advanced Manufacturing", district: "Pune", size: "MEDIUM" },
    { name: "Demo EV Battery Systems", sector: "Automotive", district: "Nashik", size: "MEDIUM" },
    { name: "Demo Autonomous Mobility", sector: "Automotive", district: "Pune", size: "LARGE" },
    { name: "Demo Powertrain Engineering", sector: "Automotive", district: "Nagpur", size: "MEDIUM" },
    { name: "Demo Cloud Services India", sector: "Information Technology", district: "Pune", size: "LARGE" },
    { name: "Demo Data Science Labs", sector: "Information Technology", district: "Pune", size: "SMALL" },
    { name: "Demo Embedded Systems Co", sector: "Information Technology", district: "Nashik", size: "SMALL" },
    { name: "Demo Industrial IoT Works", sector: "Advanced Manufacturing", district: "Nagpur", size: "SMALL" },
    { name: "Demo Robotics Assembly Pune", sector: "Advanced Manufacturing", district: "Pune", size: "MEDIUM" },
    { name: "Demo Mechatronics Hub", sector: "Advanced Manufacturing", district: "Nashik", size: "SMALL" },
    { name: "Demo Motor Controllers Ltd", sector: "Automotive", district: "Pune", size: "MEDIUM" },
    { name: "Demo Software Studios", sector: "Information Technology", district: "Nagpur", size: "SMALL" },
    { name: "Demo Telematics Pvt Ltd", sector: "Information Technology", district: "Pune", size: "SMALL" },
    { name: "Demo Smart Sensors Co", sector: "Advanced Manufacturing", district: "Nashik", size: "MICRO" },
    { name: "Demo Charging Infrastructure", sector: "Automotive", district: "Nagpur", size: "MEDIUM" },
    { name: "Demo PLC Integration Services", sector: "Advanced Manufacturing", district: "Pune", size: "MICRO" },
    { name: "Demo Predictive Analytics", sector: "Information Technology", district: "Pune", size: "SMALL" },
    { name: "Demo Drive Systems Ltd", sector: "Automotive", district: "Nashik", size: "MEDIUM" },
    { name: "Demo Network Solutions", sector: "Information Technology", district: "Nagpur", size: "SMALL" },
    { name: "Demo Manufacturing Tech Hub", sector: "Advanced Manufacturing", district: "Nagpur", size: "MEDIUM" },
    { name: "Demo Cloud Native Apps", sector: "Information Technology", district: "Pune", size: "SMALL" },
    { name: "Demo EV Service Network", sector: "Automotive", district: "Pune", size: "MEDIUM" },
    { name: "Demo Industrial Training Co", sector: "Advanced Manufacturing", district: "Nashik", size: "SMALL" },
    { name: "Demo Quality Assurance Labs", sector: "Advanced Manufacturing", district: "Pune", size: "SMALL" },
  ];
  for (const e of newEmployerDefs) {
    if (existingEmployerNames.has(e.name)) continue;
    const sector = sectors.find((s) => s.name === e.sector);
    const district = districts.find((d) => d.name === e.district);
    await db.employer.create({
      data: {
        name: e.name,
        industrySectorId: sector?.id,
        districtId: district?.id,
        description: `Synthetic demonstration employer — ${e.sector.toLowerCase()}.`,
        website: `https://example.org/${e.name.toLowerCase().replace(/\s+/g, "-")}`,
        sizeCategory: e.size,
        isVerified: rand() > 0.5,
      },
    });
  }
  const allEmployers = await db.employer.findMany();

  // ===== Create Phase 2 Data Sources (one per evidence type) =====
  const sources = {
    jobPostings: await db.dataSource.create({
      data: { name: "Synthetic Job Market Dataset", sourceType: "JOB_POSTINGS", description: "Synthetic job-posting signals for demonstration.", providerName: "SyntheticDataProvider", dataStatus: "SYNTHETIC", geographyLevel: "DISTRICT", updateFrequency: "MONTHLY", lastUpdatedAt: new Date(), isActive: true },
    }),
    employerSurvey: await db.dataSource.create({
      data: { name: "Synthetic Employer Survey Feed", sourceType: "EMPLOYER_SURVEY", description: "Synthetic employer satisfaction + hiring-intent responses.", providerName: "SyntheticDataProvider", dataStatus: "SYNTHETIC", geographyLevel: "EMPLOYER", updateFrequency: "QUARTERLY", lastUpdatedAt: new Date(), isActive: true },
    }),
    industryConsultation: await db.dataSource.create({
      data: { name: "Synthetic Industry Consultation Records", sourceType: "INDUSTRY_CONSULTATION", description: "Synthetic industry-consultation notes.", providerName: "SyntheticDataProvider", dataStatus: "SYNTHETIC", geographyLevel: "STATE", updateFrequency: "QUARTERLY", lastUpdatedAt: new Date(), isActive: true },
    }),
    sectorGrowth: await db.dataSource.create({
      data: { name: "Synthetic Sector Growth Index", sourceType: "SECTOR_GROWTH", description: "Synthetic sector growth indicators.", providerName: "SyntheticDataProvider", dataStatus: "MODELLED", geographyLevel: "STATE", updateFrequency: "QUARTERLY", lastUpdatedAt: new Date(), isActive: true },
    }),
    placementOutcome: await db.dataSource.create({
      data: { name: "Synthetic Placement Outcomes", sourceType: "PLACEMENT_OUTCOME", description: "Synthetic placement-outcome records.", providerName: "SyntheticDataProvider", dataStatus: "SYNTHETIC", geographyLevel: "INSTITUTION", updateFrequency: "ANNUAL", lastUpdatedAt: new Date(), isActive: true },
    }),
    technologyTrend: await db.dataSource.create({
      data: { name: "Synthetic Technology Trend Observations", sourceType: "TECHNOLOGY_TREND", description: "Synthetic emerging-technology trend observations.", providerName: "SyntheticDataProvider", dataStatus: "MODELLED", geographyLevel: "STATE", updateFrequency: "QUARTERLY", lastUpdatedAt: new Date(), isActive: true },
    }),
    demoJobs: await db.dataSource.create({
      data: { name: "Demo Job Market Dataset", sourceType: "JOB_POSTINGS", description: "DEMO-quality synthetic job postings (lower confidence).", providerName: "SyntheticDataProvider", dataStatus: "DEMO", geographyLevel: "DISTRICT", updateFrequency: "ADHOC", lastUpdatedAt: new Date(), isActive: true },
    }),
    realJobs: await db.dataSource.create({
      data: { name: "Maharashtra Employment Exchange (placeholder)", sourceType: "JOB_POSTINGS", description: "Placeholder for future real government feed. Not yet connected.", providerName: "OfficialGovernmentProvider", dataStatus: "UNKNOWN", geographyLevel: "STATE", updateFrequency: "MONTHLY", lastUpdatedAt: null, isActive: false },
    }),
  };

  // ===== Generate + ingest JOB POSTINGS (100+) =====
  const jobPostings: Record<string, unknown>[] = [];
  for (let i = 1; i <= 120; i++) {
    const employer = pick(allEmployers);
    const role = pick(jobRoles);
    const district = districts.find((d) => d.id === employer.districtId) ?? pick(districts);
    const sector = sectors.find((s) => s.id === employer.industrySectorId) ?? pick(sectors);
    jobPostings.push({
      source_record_id: `JOB-${String(i).padStart(4, "0")}`,
      employer: employer.name,
      role: role.title,
      district: district.name,
      sector: sector.name,
      posted_at: `2026-${String(intBetween(1, 9)).padStart(2, "0")}-${String(intBetween(1, 28)).padStart(2, "0")}`,
      data_status: "SYNTHETIC",
    });
  }
  await ingestViaPipeline(sources.jobPostings.id, "synthetic", jobPostings, "SyntheticDataProvider");

  // ===== Generate + ingest EMPLOYER SURVEYS (50+) =====
  const surveys: Record<string, unknown>[] = [];
  for (let i = 1; i <= 55; i++) {
    const employer = pick(allEmployers);
    const role = pick(jobRoles);
    surveys.push({
      source_record_id: `SVY-${String(i).padStart(4, "0")}`,
      employer: employer.name,
      role: role.title,
      response_date: `2026-${String(intBetween(1, 9)).padStart(2, "0")}-${String(intBetween(1, 28)).padStart(2, "0")}`,
      satisfaction_score: intBetween(2, 5),
      data_status: "SYNTHETIC",
    });
  }
  await ingestViaPipeline(sources.employerSurvey.id, "synthetic", surveys, "SyntheticDataProvider");

  // ===== Generate + ingest INDUSTRY CONSULTATIONS (20+) =====
  const consultations: Record<string, unknown>[] = [];
  const consultOrgs = ["Demo Manufacturing Association", "Demo Automotive Forum", "Demo IT Council", "Demo Skills Council", "Demo Industry Chamber"];
  for (let i = 1; i <= 24; i++) {
    const sector = pick(sectors);
    consultations.push({
      source_record_id: `CON-${String(i).padStart(4, "0")}`,
      organization: pick(consultOrgs),
      sector: sector.name,
      consultation_date: `2026-${String(intBetween(1, 9)).padStart(2, "0")}-${String(intBetween(1, 28)).padStart(2, "0")}`,
      key_findings: pick(["Growing demand for automation skills", "EV technician shortage reported", "Industry 4.0 adoption accelerating", "Cloud + data skills gap", "Cybersecurity awareness rising"]),
      data_status: "SYNTHETIC",
    });
  }
  await ingestViaPipeline(sources.industryConsultation.id, "synthetic", consultations, "SyntheticDataProvider");

  // ===== Generate + ingest SECTOR GROWTH (30+) =====
  const growth: Record<string, unknown>[] = [];
  for (let i = 1; i <= 32; i++) {
    const sector = pick(sectors);
    growth.push({
      source_record_id: `SGR-${String(i).padStart(4, "0")}`,
      sector: sector.name,
      geography: pick(["Maharashtra", "Pune Region", "Nashik Region", "Nagpur Region", "Vidarbha"]),
      period: pick(["2025-Q3", "2025-Q4", "2026-Q1", "2026-Q2", "FY2026"]),
      growth_rate_pct: Math.round((rand() * 25 - 5) * 10) / 10,
      data_status: "MODELLED",
    });
  }
  await ingestViaPipeline(sources.sectorGrowth.id, "synthetic", growth, "SyntheticDataProvider");

  // ===== Generate + ingest PLACEMENT OUTCOMES (100+) =====
  // Pre-resolve course → institution mapping once (avoids awaiting inside the loop).
  const courseInstitutionMap = new Map<string, string>();
  for (const course of courses) {
    const ci = await db.courseInstitution.findFirst({ where: { courseId: course.id } });
    if (ci) courseInstitutionMap.set(course.id, ci.institutionId);
  }
  const placements: Record<string, unknown>[] = [];
  for (let i = 1; i <= 110; i++) {
    const course = pick(courses);
    const institutionId = courseInstitutionMap.get(course.id);
    const institution = institutions.find((inst) => inst.id === institutionId) ?? pick(institutions);
    const total = intBetween(20, 80);
    const placed = Math.min(total, intBetween(10, total));
    placements.push({
      source_record_id: `PLT-${String(i).padStart(4, "0")}`,
      course: course.name,
      institution: institution.name,
      period: pick(["2024-25", "2025-26", "2026-Q1", "2026-Q2"]),
      total_candidates: total,
      placed_count: placed,
      data_status: "SYNTHETIC",
    });
  }
  await ingestViaPipeline(sources.placementOutcome.id, "synthetic", placements, "SyntheticDataProvider");

  // ===== Generate + ingest TECHNOLOGY TRENDS (30+) =====
  const trends: Record<string, unknown>[] = [];
  const techs = ["Generative AI", "Edge Computing", "Cobots", "Digital Twins", "5G Industrial", "Computer Vision QC", "Predictive Maintenance", "Battery Analytics", "OTA Updates", "Robotics-as-a-Service"];
  for (let i = 1; i <= 34; i++) {
    const sector = pick(sectors);
    trends.push({
      source_record_id: `TRD-${String(i).padStart(4, "0")}`,
      technology: pick(techs),
      sector: sector.name,
      trend_direction: pick(["RISING", "EMERGING", "STABLE", "RISING", "EMERGING"]),
      impact_level: intBetween(3, 5),
      time_horizon: pick(["0-1 year", "1-2 years", "2-3 years", "3-5 years"]),
      data_status: "MODELLED",
    });
  }
  await ingestViaPipeline(sources.technologyTrend.id, "synthetic", trends, "SyntheticDataProvider");

  // ===== Also ingest the test Dataset A (100% valid CSV) through the pipeline
  // so the Data Explorer shows a real "uploaded file" batch with provenance. =====
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const csvPath = path.resolve(process.cwd(), "data/synthetic/dataset_a_valid.csv");
  try {
    const csvText = await fs.readFile(csvPath, "utf8");
    const { parseUpload } = await import("../src/lib/ingestion/parser");
    const parsed = parseUpload(csvText, "csv");
    await ingestViaPipeline(sources.demoJobs.id, "csv", parsed.records, "CSVDataProvider", "dataset_a_valid.csv");
  } catch (e) {
    console.warn("  (skipped Dataset A CSV ingest:", e instanceof Error ? e.message : e, ")");
  }

  console.log("✓ Phase 2 seed complete. All data is SYNTHETIC DEMONSTRATION DATA.");
  console.log("  Sources: 8 | Employers: total now 30+ | Job postings: 120 | Surveys: 55 | Consultations: 24 | Sector growth: 32 | Placements: 110 | Tech trends: 34");
}

async function ingestViaPipeline(
  sourceId: string,
  fileType: "csv" | "json" | "synthetic" | "manual",
  records: Record<string, unknown>[],
  providerName: string,
  fileName?: string,
) {
  try {
    const preview = await previewAndValidate({
      dataSourceId: sourceId,
      fileType,
      records,
      fileName,
      importMode: "UPSERT",
      createdBy: "seed-phase2",
    });
    await confirmAndStoreFromRecords({
      batchCode: preview.batchCode,
      records,
      createdBy: "seed-phase2",
    });
    console.log(`  ✓ ${providerName} → ${preview.batchCode}: ${preview.recordsAccepted} accepted / ${preview.recordsRejected} rejected / ${preview.recordsDuplicate} dup (quality ${preview.qualityScore.overall})`);
  } catch (e) {
    console.error(`  ✗ ${providerName} ingest failed:`, e instanceof Error ? e.message : e);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
