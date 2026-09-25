/**
 * KAUSHAL DRISHTI — Phase 7 Synthetic Candidate Seed
 * ---------------------------------------------------------------------
 * ALL DATA IS SYNTHETIC DEMONSTRATION DATA.
 * Generates 100+ candidates with skills, competencies, evidence,
 * assessments, aspirations, and 6 gap scenarios (A-F).
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
function mulberry32(seed: number) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = mulberry32(713);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const intBetween = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

async function main() {
  console.log("Seeding Phase 7 candidate intelligence data…");
  await db.candidateGapResolutionEvent.deleteMany();
  await db.developmentPathwayStep.deleteMany();
  await db.candidateDevelopmentPath.deleteMany();
  await db.candidateOpportunityReadiness.deleteMany();
  await db.candidateCourseMatch.deleteMany();
  await db.developmentObjective.deleteMany();
  await db.candidateGapPriority.deleteMany();
  await db.candidateRoleReadiness.deleteMany();
  await db.candidateCompetencyGap.deleteMany();
  await db.candidateSkillGap.deleteMany();
  await db.candidateTargetProfile.deleteMany();
  await db.candidateAssessment.deleteMany();
  await db.candidateEvidence.deleteMany();
  await db.candidateCompetency.deleteMany();
  await db.candidateSkill.deleteMany();
  await db.candidate.deleteMany();

  const skills = await db.skill.findMany();
  const jobRoles = await db.jobRole.findMany();
  const districts = await db.district.findMany();
  const sectors = await db.sector.findMany();
  const clusters = await db.economicCluster.findMany();
  const proficiencies = ["AWARENESS", "WORKING", "PROFICIENT", "EXPERT"];
  const evidenceTypes = ["SELF_DECLARED", "ASSESSED", "CERTIFIED", "PROJECT", "EXPERIENCE", "EMPLOYER_VERIFIED"];
  const verificationStatuses = ["PENDING", "VERIFIED", "REJECTED"];

  let candidateCount = 0;
  for (let i = 0; i < 105; i++) {
    const name = `Demo Candidate ${String(i + 1).padStart(3, "0")}`;
    const email = `candidate${i + 1}@kaushal-drishti.demo`;
    const district = pick(districts);
    const targetRole = pick(jobRoles);
    const targetSector = sectors.find((s) => s.id === targetRole.sectorId) ?? pick(sectors);
    const targetCluster = clusters.filter((c) => c.districtId === district.id && c.sectorId === targetSector.id)[0] ?? pick(clusters);

    const candidate = await db.candidate.create({
      data: {
        name, email,
        educationLevel: pick(["B.Tech", "M.Tech", "Diploma", "ITI", "B.Sc", "B.Com", "12th Pass"]),
        experienceYears: intBetween(0, 15),
        currentDistrictId: district.id,
        status: "ACTIVE",
        dataStatus: "SYNTHETIC",
      },
    });
    candidateCount++;

    // Assign 3-7 skills per candidate
    const numSkills = intBetween(3, 7);
    const selectedSkills: typeof skills = [];
    for (let s = 0; s < numSkills; s++) { const sk = pick(skills); if (!selectedSkills.find((x) => x.id === sk.id)) selectedSkills.push(sk); }

    for (const sk of selectedSkills) {
      const proficiency = pick(proficiencies);
      const numEvidence = intBetween(0, 4);
      const evidenceType = pick(evidenceTypes);
      const verified = rand() > 0.4;
      const evidenceTimestamp = new Date(2024 + (rand() > 0.7 ? 1 : 0), intBetween(0, 11), intBetween(1, 28));

      // Create evidence records
      for (let e = 0; e < numEvidence; e++) {
        const evType = e === 0 ? evidenceType : pick(evidenceTypes);
        await db.candidateEvidence.create({
          data: {
            candidateId: candidate.id, skillId: sk.id,
            evidenceType: evType,
            evidenceSource: pick(["Demo Assessment", "Demo Project", "Demo Certificate", "Demo Employer", "Self"]),
            evidenceTimestamp,
            proficiencyLevel: proficiency,
            verificationStatus: verified ? "VERIFIED" : pick(verificationStatuses),
            confidence: 0.4 + rand() * 0.5,
            description: `Synthetic ${evType.toLowerCase()} evidence for ${sk.name}.`,
          },
        });
      }

      // Create assessment for ~50% of skills
      if (rand() > 0.5) {
        await db.candidateAssessment.create({
          data: {
            candidateId: candidate.id, skillId: sk.id,
            assessmentType: pick(["FORMAL", "PRACTICAL", "ONLINE"]),
            proficiencyLevel: proficiency,
            score: 40 + rand() * 60,
            assessedAt: evidenceTimestamp,
            confidence: 0.6 + rand() * 0.35,
          },
        });
      }
    }

    // Create target profile
    await db.candidateTargetProfile.create({
      data: {
        candidateId: candidate.id,
        targetRoleId: targetRole.id,
        targetSectorId: targetSector.id,
        targetDistrictId: district.id,
        targetClusterId: targetCluster.id,
        marketDemandSignal: pick(["HIGH", "MEDIUM", "HIGH", "MEDIUM"]),
        marketConfidence: 0.5 + rand() * 0.4,
      },
    });
  }
  console.log(`  ✓ ${candidateCount} candidates with skills, evidence, assessments, aspirations`);
  console.log("✓ Phase 7 seed complete. ALL DATA IS SYNTHETIC.");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
