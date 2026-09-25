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
