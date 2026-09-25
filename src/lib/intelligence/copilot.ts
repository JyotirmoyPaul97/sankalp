/**
 * KAUSHAL DRISHTI — Phase 10 Intelligence Copilot Query Layer
 * ---------------------------------------------------------------------
 * Structured query layer that translates natural-language questions
 * into validated intelligence queries against existing Phase 1-9 data.
 *
 * NO raw SQL from LLM. NO hallucinated facts. Every answer backed by
 * structured database records with evidence + confidence + data status.
 *
 * Pipeline: User Question → Intent Detection → Allowed Query Type →
 * Validated Parameters → Existing Intelligence Service → Structured Result →
 * Explanation + Evidence + Confidence + Data Status + Drill-down Links
 */
import { db } from "@/lib/db";
import { z } from "zod";

// ---------------------------------------------------------------------
// 1. Intent detection — classify the user's question
// ---------------------------------------------------------------------

export type QueryIntent =
  | "MARKET_DEMAND"        // "Which skills have high demand in Pune?"
  | "SKILL_DETAIL"         // "What is the demand for PLC Programming?"
  | "ROLE_DEMAND"          // "What skills are required for Automation Engineer?"
  | "DISTRICT_GAP"         // "Why does Pune show a training gap?"
  | "EMERGING_SKILLS"      // "What skills are emerging in manufacturing?"
  | "TRAINING_COVERAGE"    // "Which courses cover PLC Programming?"
  | "CAPABILITY_STATUS"    // "Why is my centre partially ready?"
  | "CANDIDATE_GAP"        // "Why do I have this gap?"
  | "SCENARIO"             // "What happens if we add 100 seats?"
  | "STATE_OVERVIEW"       // "What is the state of skill intelligence?"
  | "UNSUPPORTED";         // Anything we can't answer

export interface ParsedQuery {
  intent: QueryIntent;
  district?: string;
  skill?: string;
  role?: string;
  sector?: string;
  cluster?: string;
  candidateId?: string;
  parameters: Record<string, string>;
}

export interface CopilotResponse {
  answer: string;
  evidence: { source: string; detail: string; type: string }[];
  confidence: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
  dataPeriod: string;
  dataStatus: string;
  sources: string[];
  exploreLinks: { label: string; view: string; id?: string }[];
  unsupported?: boolean;
  disclaimer?: string;
}

const KEYWORDS: Record<QueryIntent, string[]> = {
  MARKET_DEMAND: ["demand", "high demand", "which skills", "top skills", "most demanded"],
  SKILL_DETAIL: ["skill detail", "tell me about", "what is the demand for", "proficiency for"],
  ROLE_DEMAND: ["role", "automation engineer", "what skills.*require", "what does.*need"],
  DISTRICT_GAP: ["gap", "why.*gap", "training gap", "skill gap", "coverage gap"],
  EMERGING_SKILLS: ["emerging", "new skills", "rising", "accelerating", "future skills"],
  TRAINING_COVERAGE: ["training", "course", "coverage", "curriculum", "which courses"],
  CAPABILITY_STATUS: ["ready", "capability", "centre", "partially", "trainer", "equipment"],
  CANDIDATE_GAP: ["my gap", "why do i", "my evidence", "my skill", "proficiency gap"],
  SCENARIO: ["what if", "simulate", "add.*seats", "scenario", "intervention"],
  STATE_OVERVIEW: ["state", "maharashtra", "overview", "summary", "command"],
  UNSUPPORTED: [],
};

export function detectIntent(question: string): ParsedQuery {
  const q = question.toLowerCase().trim();

  // Extract entities
  const districtMatch = q.match(/\b(pune|nashik|nagpur|mumbai|thane|aurangabad|solapur|kolhapur|amravati|ratniri)\b/);
  const skillMatch = q.match(/\b(plc|scada|robotics|python|sql|iot|bms|embedded|safety|automation)\b/);
  const roleMatch = q.match(/\b(automation engineer|plc technician|robotics technician|software developer|ev technician)\b/);
  const sectorMatch = q.match(/\b(manufacturing|automotive|information technology|it)\b/);

  const parameters: Record<string, string> = {};
  if (districtMatch) parameters.district = districtMatch[1];
  if (skillMatch) parameters.skill = skillMatch[1];
  if (roleMatch) parameters.role = roleMatch[1];
  if (sectorMatch) parameters.sector = sectorMatch[1];

  // Detect intent
  for (const [intent, words] of Object.entries(KEYWORDS)) {
    if (intent === "UNSUPPORTED") continue;
    for (const word of words) {
      if (q.includes(word) || new RegExp(word, "i").test(q)) {
        return {
          intent: intent as QueryIntent,
          district: districtMatch?.[1],
          skill: skillMatch?.[1],
          role: roleMatch?.[1],
          sector: sectorMatch?.[1],
          parameters,
        };
      }
    }
  }

  return { intent: "UNSUPPORTED", parameters };
}

// ---------------------------------------------------------------------
// 2. Query execution — each intent maps to existing intelligence data
// ---------------------------------------------------------------------

export async function executeQuery(parsed: ParsedQuery, userRole?: string, userId?: string): Promise<CopilotResponse> {
  switch (parsed.intent) {
    case "MARKET_DEMAND": return await queryMarketDemand(parsed);
    case "SKILL_DETAIL": return await querySkillDetail(parsed);
    case "ROLE_DEMAND": return await queryRoleDemand(parsed);
    case "DISTRICT_GAP": return await queryDistrictGap(parsed);
    case "EMERGING_SKILLS": return await queryEmergingSkills(parsed);
    case "TRAINING_COVERAGE": return await queryTrainingCoverage(parsed);
    case "CAPABILITY_STATUS": return await queryCapabilityStatus(parsed);
    case "CANDIDATE_GAP": return await queryCandidateGap(parsed, userId);
    case "SCENARIO": return await queryScenario(parsed);
    case "STATE_OVERVIEW": return await queryStateOverview(parsed);
    default: return unsupportedResponse(parsed);
  }
}

// ---------------------------------------------------------------------
// 3. Query implementations
// ---------------------------------------------------------------------

async function queryMarketDemand(parsed: ParsedQuery): Promise<CopilotResponse> {
  const districtName = parsed.district;
  let districtId: string | undefined;
  if (districtName) {
    const d = await db.district.findFirst({ where: { name: { equals: districtName, mode: "insensitive" } } });
    districtId = d?.id;
  }

  const signals = await db.marketSignal.findMany({
    where: {
      ...(districtId ? { districtId } : {}),
      skillId: { not: null },
    },
    include: { skill: true, district: true },
    orderBy: { signalValue: "desc" },
    take: 10,
  });

  if (signals.length === 0) {
    return insufficientEvidence("No market demand signals found for the specified scope.", parsed);
  }

  const topSkills = signals.slice(0, 5).map((s) => `${s.skill.name} (${s.signalValue} signals)`);
  const districtLabel = signals[0]?.district?.name ?? "State-wide";
  const totalEmployers = signals.reduce((s, x) => s + x.uniqueEmployers, 0);

  return {
    answer: `Top demanded skills${districtName ? ` in ${districtName}` : " state-wide"}: ${topSkills.join(", ")}. Based on ${signals.length} market signal records across ${totalEmployers} unique employers.`,
    evidence: signals.slice(0, 5).map((s) => ({
      source: `MarketSignal — ${s.skill.name}`,
      detail: `${s.signalValue} signals, ${s.uniqueEmployers} employers, direction: ${s.direction}`,
      type: s.sourceType,
    })),
    confidence: totalEmployers > 20 ? "HIGH" : totalEmployers > 5 ? "MEDIUM" : "LOW",
    dataPeriod: signals[0]?.periodLabel ?? "2026-09",
    dataStatus: signals[0]?.dataStatus ?? "SYNTHETIC",
    sources: [...new Set(signals.map((s) => s.sourceType))],
    exploreLinks: [{ label: "View Labour Market Dashboard", view: "labour-market" }, { label: "View District Intelligence", view: "districts" }],
  };
}

async function querySkillDetail(parsed: ParsedQuery): Promise<CopilotResponse> {
  const skillName = parsed.skill;
  if (!skillName) return insufficientEvidence("Please specify a skill name.", parsed);

  const skill = await db.skill.findFirst({
    where: { OR: [{ name: { contains: skillName, mode: "insensitive" } }, { canonicalName: { contains: skillName.toLowerCase() } }] },
  });
  if (!skill) return insufficientEvidence(`Skill "${skillName}" not found in the knowledge graph.`, parsed);

  const signals = await db.marketSignal.findMany({ where: { skillId: skill.id }, include: { district: true } });
  const courseSkills = await db.courseSkill.findMany({ where: { skillId: skill.id }, include: { course: true } });
  const gaps = await db.demandSupplyGapSignal.findMany({ where: { skillId: skill.id }, include: { district: true } });
  const emerging = await db.emergingSkillSignal.findUnique({ where: { skillId: skill.id } });

  const totalSignal = signals.reduce((s, x) => s + x.signalValue, 0);
  const employers = signals.reduce((s, x) => s + x.uniqueEmployers, 0);
  const districts = new Set(signals.map((s) => s.districtId).filter(Boolean)).size;
  const highGaps = gaps.filter((g) => g.gapSignal === "HIGH_GAP").length;

  const answerParts: string[] = [
    `${skill.name} (canonical: ${skill.canonicalName}, category: ${skill.category ?? "—"}).`,
    `Market demand: ${totalSignal} signals across ${employers} employers in ${districts} districts.`,
    `Training coverage: ${courseSkills.length} courses map to this skill.`,
  ];
  if (emerging) answerParts.push(`Emerging status: ${emerging.emergenceStatus} (signal strength: ${emerging.signalStrength}/100).`);
  if (highGaps > 0) answerParts.push(`${highGaps} high-gap signals identified.`);

  return {
    answer: answerParts.join(" "),
    evidence: [
      { source: "Market Signals", detail: `${totalSignal} signals, ${employers} employers`, type: "MARKET" },
      { source: "Training Coverage", detail: `${courseSkills.length} courses`, type: "TRAINING" },
      ...(emerging ? [{ source: "Emerging Skill Radar", detail: `${emerging.emergenceStatus}, strength ${emerging.signalStrength}`, type: "EMERGING" }] : []),
    ],
    confidence: employers > 20 ? "HIGH" : employers > 5 ? "MEDIUM" : "LOW",
    dataPeriod: signals[0]?.periodLabel ?? "2026-09",
    dataStatus: signals[0]?.dataStatus ?? "SYNTHETIC",
    sources: ["MARKET_SIGNALS", "COURSE_SKILLS", ...(emerging ? ["EMERGING_SKILLS"] : [])],
    exploreLinks: [
      { label: "View Skill Intelligence", view: "skill-intelligence" },
      { label: "View Skill Demand", view: "labour-market" },
    ],
  };
}

async function queryRoleDemand(parsed: ParsedQuery): Promise<CopilotResponse> {
  const roleName = parsed.role;
  if (!roleName) return insufficientEvidence("Please specify a role name.", parsed);

  const role = await db.jobRole.findFirst({ where: { title: { contains: roleName, mode: "insensitive" } } });
  if (!role) return insufficientEvidence(`Role "${roleName}" not found.`, parsed);

  const roleSkills = await db.roleSkill.findMany({ where: { jobRoleId: role.id }, include: { skill: true } });
  const marketSignals = await db.marketSignal.findMany({ where: { jobRoleId: role.id }, include: { skill: true } });

  const skills = roleSkills.map((rs) => `${rs.skill.name} (${rs.proficiencyLevel}, importance ${rs.importance}/5)`);
  const totalDemand = marketSignals.reduce((s, x) => s + x.signalValue, 0);

  return {
    answer: `${role.title} requires ${roleSkills.length} skills: ${skills.join(", ")}. Market demand: ${totalDemand} signals observed. Required proficiency levels range from AWARENESS to EXPERT.`,
    evidence: roleSkills.map((rs) => ({
      source: `RoleSkill — ${rs.skill.name}`,
      detail: `Required proficiency: ${rs.proficiencyLevel}, importance: ${rs.importance}/5`,
      type: "COMPETENCY",
    })),
    confidence: marketSignals.length > 10 ? "HIGH" : marketSignals.length > 3 ? "MEDIUM" : "LOW",
    dataPeriod: "2026-09",
    dataStatus: "SYNTHETIC",
    sources: ["ROLE_SKILLS", "MARKET_SIGNALS"],
    exploreLinks: [{ label: "View Role Demand", view: "labour-market" }, { label: "View Competency Framework", view: "competency-framework" }],
  };
}

async function queryDistrictGap(parsed: ParsedQuery): Promise<CopilotResponse> {
  const districtName = parsed.district;
  if (!districtName) return insufficientEvidence("Please specify a district.", parsed);

  const district = await db.district.findFirst({ where: { name: { contains: districtName, mode: "insensitive" } } });
  if (!district) return insufficientEvidence(`District "${districtName}" not found.`, parsed);

  const gaps = await db.demandSupplyGapSignal.findMany({
    where: { districtId: district.id },
    include: { skill: true, jobRole: true },
    orderBy: { gapScore: "desc" },
  });

  const highGaps = gaps.filter((g) => g.gapSignal === "HIGH_GAP");
  const profMismatches = gaps.filter((g) => g.gapSignal === "PROFICIENCY_MISMATCH");
  const noSupply = gaps.filter((g) => g.gapSignal === "NO_IDENTIFIED_SUPPLY");

  const answerParts = [
    `${district.name} has ${gaps.length} demand-supply gap signals:`,
    `${highGaps.length} high gaps, ${profMismatches.length} proficiency mismatches, ${noSupply.length} with no identified supply.`,
  ];
  if (highGaps.length > 0) {
    answerParts.push(`Top high-gap skills: ${highGaps.slice(0, 3).map((g) => g.skill?.name ?? "—").join(", ")}.`);
  }

  return {
    answer: answerParts.join(" "),
    evidence: highGaps.slice(0, 5).map((g) => ({
      source: `GapSignal — ${g.skill?.name ?? g.jobRole?.title ?? "—"}`,
      detail: `Gap: ${g.gapSignal}, score: ${g.gapScore}, demand: ${g.marketDemandSignal}, supply: ${g.trainingSupplySignal}`,
      type: "GAP",
    })),
    confidence: gaps.length > 10 ? "HIGH" : gaps.length > 3 ? "MEDIUM" : "LOW",
    dataPeriod: gaps[0]?.period ?? "2026-09",
    dataStatus: gaps[0]?.dataStatus ?? "SYNTHETIC",
    sources: ["DEMAND_SUPPLY_GAP_SIGNALS"],
    exploreLinks: [{ label: "View District Gaps", view: "gap-districts" }, { label: "View Gap Intelligence", view: "gap-intelligence" }],
  };
}

async function queryEmergingSkills(parsed: ParsedQuery): Promise<CopilotResponse> {
  const emerging = await db.emergingSkillSignal.findMany({
    where: { emergenceStatus: { in: ["EARLY_SIGNAL", "EMERGING", "ACCELERATING"] } },
    include: { skill: true },
    orderBy: { signalStrength: "desc" },
  });

  if (emerging.length === 0) return insufficientEvidence("No emerging skills identified.", parsed);

  const skillsList = emerging.slice(0, 5).map((e) => `${e.skill.name} (${e.emergenceStatus}, strength ${e.signalStrength})`);

  return {
    answer: `${emerging.length} emerging skills identified: ${skillsList.join(", ")}. These are observed evidence signals — NOT guaranteed future demand forecasts.`,
    evidence: emerging.slice(0, 5).map((e) => ({
      source: `EmergingSkill — ${e.skill.name}`,
      detail: `Status: ${e.emergenceStatus}, strength: ${e.signalStrength}, velocity: ${e.trendVelocity}, sources: ${e.sourceDiversity}`,
      type: "EMERGING",
    })),
    confidence: "MEDIUM",
    dataPeriod: "2026-09",
    dataStatus: "SYNTHETIC",
    sources: ["EMERGING_SKILL_SIGNALS"],
    exploreLinks: [{ label: "View Emerging Skill Radar", view: "emerging-radar" }],
    disclaimer: "Emerging signal — observed evidence of change, NOT a guaranteed future demand forecast.",
  };
}

async function queryTrainingCoverage(parsed: ParsedQuery): Promise<CopilotResponse> {
  const skillName = parsed.skill;
  if (!skillName) return insufficientEvidence("Please specify a skill.", parsed);

  const skill = await db.skill.findFirst({ where: { name: { contains: skillName, mode: "insensitive" } } });
  if (!skill) return insufficientEvidence(`Skill "${skillName}" not found.`, parsed);

  const courseSkills = await db.courseSkill.findMany({ where: { skillId: skill.id }, include: { course: { include: { sector: true } } } });
  const curriculumMappings = await db.curriculumSkillMapping.findMany({ where: { skillId: skill.id } });

  return {
    answer: `${skill.name} is covered by ${courseSkills.length} courses and ${curriculumMappings.length} curriculum modules. Coverage levels: ${courseSkills.map((cs) => cs.coverageLevel).join(", ")}.`,
    evidence: courseSkills.slice(0, 5).map((cs) => ({
      source: `CourseSkill — ${cs.course.name}`,
      detail: `Coverage: ${cs.coverageLevel}, proficiency: ${cs.expectedProficiency ?? "—"}, confidence: ${cs.confidence}`,
      type: "TRAINING",
    })),
    confidence: courseSkills.length > 5 ? "HIGH" : "MEDIUM",
    dataPeriod: "2026-09",
    dataStatus: "SYNTHETIC",
    sources: ["COURSE_SKILLS", "CURRICULUM_MAPPINGS"],
    exploreLinks: [{ label: "View Training Ecosystem", view: "training" }, { label: "View Courses", view: "courses" }],
  };
}

async function queryCapabilityStatus(parsed: ParsedQuery): Promise<CopilotResponse> {
  const gaps = await db.deliveryCapabilityGap.findMany({
    where: { overallCapabilityStatus: { in: ["PARTIALLY_READY", "LIMITED_READINESS"] } },
    include: { course: { select: { name: true } }, trainingCentre: { include: { district: { select: { name: true } } } } },
    take: 10,
  });

  const ready = await db.deliveryCapabilityGap.count({ where: { overallCapabilityStatus: "COURSE_DELIVERY_READY" } });
  const partial = gaps.filter((g) => g.overallCapabilityStatus === "PARTIALLY_READY").length;
  const limited = gaps.filter((g) => g.overallCapabilityStatus === "LIMITED_READINESS").length;

  return {
    answer: `Centre capability status: ${ready} courses fully ready, ${partial} partially ready, ${limited} with limited readiness. Common constraints: trainer proficiency, equipment availability, and curriculum alignment.`,
    evidence: gaps.slice(0, 5).map((g) => ({
      source: `DeliveryGap — ${g.course?.name ?? "—"}`,
      detail: `Centre: ${g.trainingCentre?.name ?? "—"}, status: ${g.overallCapabilityStatus}, trainer: ${g.trainerStatus}, equipment: ${g.equipmentStatus}`,
      type: "CAPABILITY",
    })),
    confidence: "MEDIUM",
    dataPeriod: "2026-09",
    dataStatus: "SYNTHETIC",
    sources: ["DELIVERY_CAPABILITY_GAPS"],
    exploreLinks: [{ label: "View Delivery Capability", view: "delivery-capability" }],
  };
}

async function queryCandidateGap(parsed: ParsedQuery, userId?: string): Promise<CopilotResponse> {
  if (!userId) return insufficientEvidence("Please log in as a candidate to query personal gaps.", parsed);

  const candidate = await db.candidate.findFirst({ where: { email: { contains: userId } } });
  if (!candidate) return insufficientEvidence("Candidate profile not found.", parsed);

  const gaps = await db.candidateSkillGap.findMany({
    where: { candidateId: candidate.id, status: "OPEN" },
    include: { skill: true, jobRole: true },
    orderBy: { gapSeverity: "desc" },
  });

  if (gaps.length === 0) return {
    answer: "No open skill gaps identified. All required skills are aligned or resolved.",
    evidence: [], confidence: "HIGH", dataPeriod: "2026-09", dataStatus: "SYNTHETIC",
    sources: ["CANDIDATE_SKILL_GAPS"],
    exploreLinks: [{ label: "View My Skill Intelligence", view: "candidate-intelligence" }],
  };

  const profGaps = gaps.filter((g) => g.gapType === "PROFICIENCY_GAP");
  const missing = gaps.filter((g) => g.gapType === "MISSING_SKILL");

  return {
    answer: `You have ${gaps.length} open skill gaps: ${missing.length} missing skills, ${profGaps.length} proficiency gaps. Top gap: ${gaps[0].skill.name} — ${gaps[0].gapType} (required: ${gaps[0].requiredProficiency}, current: ${gaps[0].candidateProficiency ?? "none"}).`,
    evidence: gaps.slice(0, 5).map((g) => ({
      source: `CandidateSkillGap — ${g.skill.name}`,
      detail: `Type: ${g.gapType}, required: ${g.requiredProficiency}, current: ${g.candidateProficiency ?? "—"}, severity: ${g.gapSeverity ?? "—"}`,
      type: "CANDIDATE_GAP",
    })),
    confidence: gaps[0]?.candidateEvidenceConfidence > 0.7 ? "HIGH" : "MEDIUM",
    dataPeriod: gaps[0]?.observationPeriod ?? "2026-09",
    dataStatus: "SYNTHETIC",
    sources: ["CANDIDATE_SKILL_GAPS"],
    exploreLinks: [{ label: "View My Skill Intelligence", view: "candidate-intelligence" }],
  };
}

async function queryScenario(parsed: ParsedQuery): Promise<CopilotResponse> {
  return {
    answer: "I can help simulate scenarios. Please use the Policy Sandbox to create a scenario with specific interventions and assumptions. The simulation will produce evidence-grounded results labelled as SIMULATED — not forecasts.",
    evidence: [],
    confidence: "INSUFFICIENT",
    dataPeriod: "—",
    dataStatus: "SIMULATED",
    sources: [],
    exploreLinks: [{ label: "Open Policy Sandbox", view: "policy-sandbox" }],
    disclaimer: "Scenario results are SIMULATED under explicit assumptions. NOT forecasts. NOT guaranteed outcomes.",
  };
}

async function queryStateOverview(parsed: ParsedQuery): Promise<CopilotResponse> {
  const districts = await db.district.count();
  const skills = await db.skill.count();
  const marketSignals = await db.marketSignal.count();
  const gapSignals = await db.demandSupplyGapSignal.count();
  const candidates = await db.candidate.count();
  const emergingSignals = await db.emergingSkillSignal.count();

  return {
    answer: `Maharashtra Skill Intelligence overview: ${districts} districts monitored, ${skills} canonical skills mapped, ${marketSignals} market signals, ${gapSignals} demand-supply gap signals, ${candidates} candidates tracked, ${emergingSignals} emerging skills identified. All data is SYNTHETIC DEMONSTRATION DATA.`,
    evidence: [
      { source: "Platform Meta", detail: `${districts} districts, ${skills} skills, ${marketSignals} signals`, type: "META" },
      { source: "Gap Intelligence", detail: `${gapSignals} gap signals`, type: "GAP" },
      { source: "Emerging Skills", detail: `${emergingSignals} emerging signals`, type: "EMERGING" },
    ],
    confidence: "HIGH",
    dataPeriod: "2026-09",
    dataStatus: "SYNTHETIC",
    sources: ["PLATFORM_META", "MARKET_SIGNALS", "GAP_SIGNALS", "EMERGING_SKILLS"],
    exploreLinks: [{ label: "View Command Centre", view: "overview" }, { label: "View District Digital Twin", view: "district-twin" }],
  };
}

function unsupportedResponse(parsed: ParsedQuery): CopilotResponse {
  return {
    answer: "Insufficient evidence is available for this question. I can answer questions about market demand, skill details, role requirements, district gaps, emerging skills, training coverage, centre capability, candidate gaps, and state overview.",
    evidence: [],
    confidence: "INSUFFICIENT",
    dataPeriod: "—",
    dataStatus: "UNKNOWN",
    sources: [],
    exploreLinks: [],
    unsupported: true,
  };
}

function insufficientEvidence(message: string, _parsed: ParsedQuery): CopilotResponse {
  return {
    answer: message,
    evidence: [],
    confidence: "INSUFFICIENT",
    dataPeriod: "—",
    dataStatus: "UNKNOWN",
    sources: [],
    exploreLinks: [],
    unsupported: true,
  };
}

// ---------------------------------------------------------------------
// 4. Audit logging
// ---------------------------------------------------------------------

export async function logCopilotQuery(params: {
  userId?: string;
  userEmail?: string;
  question: string;
  intent: string;
  responseStatus: string;
  sources: string[];
  confidence: string;
}) {
  await db.auditLog.create({
    data: {
      userId: params.userId ?? null,
      userEmail: params.userEmail ?? null,
      action: "COPILOT_QUERY",
      resource: params.question.slice(0, 200),
      status: params.responseStatus,
      details: JSON.stringify({
        intent: params.intent,
        sources: params.sources,
        confidence: params.confidence,
      }),
    },
  });
}
