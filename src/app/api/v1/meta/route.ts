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
    };
  } catch {
    counts = {};
  }

  return ok({
    service: "kaushal-drishti",
    tagline: "From Labour-Market Evidence to Better Skill Decisions.",
    phase: "phase-1",
    environment: process.env.APP_ENV || "development",
    dataDisclaimer: "Demo Environment — Synthetic Data",
    phases,
    roles: roleList,
    dataStatusVocab,
    counts,
  });
}
