/**
 * KAUSHAL DRISHTI — Shared domain types (frontend).
 * Mirrors the Prisma models exposed via /api/v1.
 */

export type DataStatus = "REAL" | "SYNTHETIC" | "MODELLED" | "DEMO" | "UNKNOWN";

export type CourseStatus = "DRAFT" | "ACTIVE" | "UNDER_REVIEW" | "DEPRECATED";

export type Role =
  | "STATE_ADMIN"
  | "DISTRICT_PLANNER"
  | "TRAINING_PROVIDER"
  | "EMPLOYER"
  | "INSTITUTION"
  | "TRAINER"
  | "CANDIDATE"
  | "AUDITOR";

export interface District {
  id: string;
  name: string;
  code: string;
  stateCode: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: { employers: number; institutions: number };
}

export interface DistrictDetail extends District {
  employers: (Employer & { industrySector: Sector | null })[];
  institutions: Institution[];
}

export interface Sector {
  id: string;
  name: string;
  code: string;
  description: string | null;
  _count?: { employers: number; jobRoles: number; courses: number };
}

export interface Skill {
  id: string;
  name: string;
  canonicalName: string;
  description: string | null;
  category: string | null;
  _count?: { roleSkills: number; courseSkills: number };
}

export interface JobRole {
  id: string;
  title: string;
  canonicalTitle: string;
  description: string | null;
  sectorId: string | null;
  sector?: Sector | null;
  roleSkills?: (RoleSkill & { skill: Skill })[];
  _count?: { employerRoles: number };
}

export interface RoleSkill {
  id: string;
  jobRoleId: string;
  skillId: string;
  importance: number;
}

export interface Qualification {
  id: string;
  name: string;
  code: string;
  description: string | null;
  qualificationLevel: string;
  _count?: { courses: number };
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  sectorId: string | null;
  qualificationId: string | null;
  durationHours: number;
  status: CourseStatus;
  sector?: Sector | null;
  qualification?: Qualification | null;
  courseInstitutions?: (CourseInstitution & { institution: Institution })[];
  courseSkills?: (CourseSkill & { skill: Skill })[];
  _count?: { courseInstitutions: number; courseSkills: number };
}

export interface CourseInstitution {
  id: string;
  courseId: string;
  institutionId: string;
  capacity: number;
}

export interface CourseSkill {
  id: string;
  courseId: string;
  skillId: string;
  coverageLevel: "NONE" | "INTRODUCED" | "REINFORCED" | "MASTERED";
}

export interface Institution {
  id: string;
  name: string;
  institutionType: string;
  districtId: string | null;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  district?: District | null;
  _count?: { courseInstitutions: number };
}

export interface Employer {
  id: string;
  name: string;
  industrySectorId: string | null;
  districtId: string | null;
  description: string | null;
  website: string | null;
  sizeCategory: string;
  isVerified: boolean;
  industrySector?: Sector | null;
  district?: District | null;
  _count?: { employerRoles: number };
}

export interface DataSource {
  id: string;
  name: string;
  sourceType: string;
  description: string | null;
  sourceUrl: string | null;
  dataStatus: DataStatus;
  lastUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MetaPhase {
  id: string;
  label: string;
  phase: number;
  active: boolean;
}

export interface MetaRole {
  id: string;
  label: string;
}

export interface PlatformMeta {
  service: string;
  tagline: string;
  phase: string;
  environment: string;
  dataDisclaimer: string;
  phases: MetaPhase[];
  roles: MetaRole[];
  dataStatusVocab: DataStatus[];
  counts: Record<string, number>;
  dataHealth?: DataHealth;
  knowledgeHealth?: KnowledgeHealth;
  marketHealth?: MarketHealth;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =====================================================================
// PHASE 2 — Data & Evidence Ingestion types
// =====================================================================

export interface DataSourceV2 extends DataSource {
  providerName: string | null;
  sourceReference: string | null;
  geographyLevel: string | null;
  updateFrequency: string | null;
  isActive: boolean;
  _count?: { batches: number };
}

export interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  storageKey: string;
  sizeBytes: number;
  checksum: string;
  uploadedBy: string | null;
  uploadedAt: string;
}

export interface IngestionBatch {
  id: string;
  batchCode: string;
  dataSourceId: string;
  uploadedFileId: string | null;
  fileName: string | null;
  fileType: string;
  importMode: string;
  recordsReceived: number;
  recordsAccepted: number;
  recordsRejected: number;
  recordsDuplicate: number;
  recordsWarning: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
  errorSummary: string | null;
  qualityScore: number | null;
  createdBy: string | null;
  createdAt: string;
  dataSource?: { id: string; name: string; dataStatus: string };
  uploadedFile?: { fileName: string; fileType: string; checksum: string } | null;
  _count?: { records: number; errors: number };
}

export interface IngestionError {
  id: string;
  batchId: string;
  rowNumber: number;
  field: string | null;
  problem: string;
  severity: string;
  suggestedAction: string | null;
  recordPreview: string | null;
}

export interface IngestionRecord {
  id: string;
  sourceId: string;
  batchId: string;
  sourceRecordId: string | null;
  sourceTimestamp: string | null;
  ingestedAt: string;
  dataStatus: string;
  entityType: string;
  normalizedId: string | null;
  qualityStatus: string;
  fingerprint: string | null;
  rawJson: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  resource: string | null;
  status: string;
  details: string | null;
  timestamp: string;
}

export interface UploadPreview {
  batchCode: string;
  batchId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  checksum: string;
  isDuplicateUpload: boolean;
  entityType: string;
  dataSource: { id: string; name: string; dataStatus: string };
  summary: {
    recordsReceived: number;
    recordsAccepted: number;
    recordsRejected: number;
    recordsDuplicate: number;
    recordsWarning: number;
    qualityScore: { total: number; completeness: number; validity: number; uniqueness: number; consistency: number; overall: number };
  };
  sampleErrors: Array<{ rowNumber: number; accepted: boolean; qualityStatus: string; issues: Array<{ field: string; problem: string; severity: string }>; preview: string }>;
}

export interface ConfirmResult {
  batchId: string;
  status: string;
  accepted: number;
}

export interface DataHealth {
  activeSources: number;
  recentImports: number;
  jobPostings: number;
  employerSurveys: number;
  industryConsultations: number;
  sectorGrowth: number;
  placementOutcomes: number;
  technologyTrends: number;
  totalIngested: number;
  avgQuality: number;
  totalBatches: number;
}

// =====================================================================
// PHASE 3 — Knowledge + Competency Intelligence types
// =====================================================================

export type ProficiencyLevel = "AWARENESS" | "WORKING" | "PROFICIENT" | "EXPERT";
export type CoverageLevel = "NONE" | "INTRODUCED" | "REINFORCED" | "MASTERED";
export type AliasType = "ACRONYM" | "VARIANT" | "COMMON_NAME" | "LEGACY";
export type RelationType = "PREREQUISITE" | "RELATED_TO" | "BROADER_THAN" | "NARROWER_THAN" | "PART_OF";

export interface SkillAlias {
  id: string;
  skillId: string;
  alias: string;
  aliasType: string;
  isCaseSensitive: boolean;
  createdAt: string;
}

export interface SkillRelation {
  id: string;
  fromSkillId: string;
  toSkillId: string;
  relationType: string;
  weight: number;
  createdAt: string;
}

export interface SkillCluster {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  memberCount?: number;
  skills?: { skillId: string; skillName: string; canonicalName: string; category: string | null; membershipType: string }[];
}

export interface NormalizeResult {
  resolved: boolean;
  skillId?: string;
  canonicalName?: string;
  matchedVia: "canonical" | "name" | "alias" | "token" | "none";
  aliasType?: string;
  confidence: number;
  rawInput: string;
  normalisedInput: string;
}

export interface SkillNeighbourhood {
  center: { id: string; name: string; canonicalName: string; category: string | null };
  clusters: { id: string; name: string; membershipType: string }[];
  outgoing: { id: string; from: { id: string; name: string; canonicalName: string; category: string | null }; to: { id: string; name: string; canonicalName: string; category: string | null }; relationType: string; weight: number }[];
  incoming: { id: string; from: { id: string; name: string; canonicalName: string; category: string | null }; to: { id: string; name: string; canonicalName: string; category: string | null }; relationType: string; weight: number }[];
  aliases: { id: string; alias: string; aliasType: string }[];
}

export interface RoleCompetencyProfile {
  roleId: string;
  roleTitle: string;
  sectorName: string | null;
  totalSkills: number;
  byProficiency: Record<ProficiencyLevel, number>;
  competencies: { skillId: string; skillName: string; canonicalName: string; category: string | null; importance: number; proficiencyExpected: ProficiencyLevel }[];
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
  competencies: { skillId: string; skillName: string; canonicalName: string; category: string | null; coverage: CoverageLevel; proficiencyConfers: ProficiencyLevel }[];
}

export interface CompetencyAlignment {
  skillId: string;
  skillName: string;
  expected: ProficiencyLevel;
  conferred: ProficiencyLevel | null;
  gap: "COVERED" | "EXCEEDS" | "SHORTFALL" | "NOT_TAUGHT";
  gapRank: number;
}

export interface KnowledgeHealth {
  skillAliases: number;
  skillRelations: number;
  skillClusters: number;
  roleCompetencies: number;
  courseCompetencies: number;
}

// =====================================================================
// PHASE 4 — Labour-Market Intelligence types
// =====================================================================

export interface MarketIntelligenceObject {
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
  signalStrength: number;
  signalLabel: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  trendDirection: string;
  evidenceCount: number;
  sourceDiversity: number;
  sampleSize: number;
  uniqueEmployers: number;
  uniquePostings: number;
  proficiencyDistribution: Record<string, number> | null;
  confidence: number;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
  convergence: "CONVERGING" | "MIXED" | "LIMITED_EVIDENCE" | "INSUFFICIENT_DATA";
  sourceBreakdown: { sourceType: string; signalValue: number; direction: string; employers: number }[];
  dataStatus: string;
  dataFreshness: string;
  lastRefreshed: string;
  methodology: string;
  topRoles?: { name: string; signal: number }[];
  topSkills?: { name: string; signal: number }[];
  topSectors?: { name: string; signal: number }[];
}

export interface MarketDemandRole {
  role: { id: string; title: string; sector: string | null; competencyCount: number };
  demandSignal: string;
  signalStrength: number;
  trend: string;
  confidence: string;
  evidenceCount: number;
  sourceDiversity: number;
  uniqueEmployers: number;
  uniquePostings: number;
  geographicCoverage: string;
}

export interface MarketDemandSkill {
  skill: { id: string; name: string; canonicalName: string; category: string | null; roleLinkages: number; courseLinkages: number };
  demandSignal: string;
  signalStrength: number;
  trend: string;
  requiredProficiency: Record<string, number> | null;
  confidence: string;
  evidenceCount: number;
  sourceDiversity: number;
  uniqueEmployers: number;
  districtCount: number;
  clusterCount: number;
  sectorCount: number;
}

export interface EmergingSkillEntry {
  skillId: string;
  skillName: string;
  emergenceStatus: "EARLY_SIGNAL" | "EMERGING" | "ACCELERATING" | "INSUFFICIENT_EVIDENCE";
  signalStrength: number;
  recentActivity: number;
  trendVelocity: number;
  persistence: number;
  sourceDiversity: number;
  technologyLink: string | null;
  firstObserved: string | null;
  confidence: number;
  evidenceCount: number;
}

export interface ConvergenceReport {
  jobPosting: { signal: number; direction: string };
  employerSurvey: { signal: number; direction: string };
  industryConsultation: { signal: number; direction: string };
  sectorGrowth: { signal: number; direction: string };
  technologyTrend: { signal: number; direction: string };
  placementOutcome: { signal: number; direction: string };
  overall: string;
  sourceDiversity: number;
  evidenceCount: number;
  uniqueEmployers: number;
  confidence: number;
}

export interface TrendPoint {
  period: string;
  signalValue: number;
  evidenceCount: number;
  direction: string;
}

export interface MarketHealth {
  divisions: number;
  economicClusters: number;
  marketSignals: number;
  demandSnapshots: number;
  emergingSignals: number;
  skillSectorPresence: number;
  sectorGrowthProfiles: number;
}

// =====================================================================
// PHASE 5 PART 2 — Demand-Supply Gap Intelligence types
// =====================================================================

export interface GapSignal {
  id: string;
  districtId: string | null;
  clusterId: string | null;
  sectorId: string | null;
  jobRoleId: string | null;
  skillId: string | null;
  period: string;
  marketDemandSignal: string;
  marketDemandStrength: number;
  trainingSupplySignal: string;
  trainingSupplyStrength: number;
  demandIndex: number | null;
  supplyIndex: number | null;
  coverageStatus: string;
  proficiencyStatus: string;
  capacityStatus: string;
  geographicStatus: string;
  gapSignal: string;
  gapType: string | null;
  gapScore: number;
  confidence: number;
  confidenceLevel: string;
  marketEvidenceCount: number;
  trainingEvidenceCount: number;
  sourceDiversity: number;
  uniqueEmployers: number;
  trendDirection: string;
  requiredProficiency: string | null;
  trainingProficiency: string | null;
  plannedCapacity: number;
  enrolledCount: number | null;
  completedCount: number | null;
  certifiedCount: number | null;
  courseCount: number;
  institutionCount: number;
  centreCount: number;
  dataStatus: string;
  skill?: { id: string; name: string; canonicalName: string } | null;
  jobRole?: { id: string; title: string } | null;
  district?: { id: string; name: string } | null;
  sector?: { id: string; name: string } | null;
}

export interface DistrictGapSummary {
  district: { id: string; name: string };
  totalGaps: number;
  highGapCount: number;
  proficiencyMismatchCount: number;
  geographicGapCount: number;
  noSupplyCount: number;
  coveredCount: number;
  topGaps: { id: string; skill: string; gapSignal: string; gapScore: number; confidence: string; marketDemand: string; trainingSupply: string }[];
}

export interface ClusterGapSummary {
  cluster: { id: string; name: string; district: string | null; sector: string | null };
  totalGaps: number;
  highGapCount: number;
  topGapSkills: { id: string; skill: string; gapSignal: string; gapScore: number; confidence: string }[];
  topGapRoles: { id: string; role: string; gapSignal: string; gapScore: number; confidence: string }[];
}

export interface GapExplanation {
  gap: GapSignal;
  reasons: string[];
  methodology: string;
}

export interface GapMatrixRow {
  role: string;
  demand: string;
  supply: string;
  coverage: string;
  proficiency: string;
  gapSignal: string;
  gapScore: number;
  confidence: string;
}
