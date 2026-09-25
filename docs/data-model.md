# KAUSHAL DRISHTI — Data Model (Phase 1)

> All data is SYNTHETIC DEMONSTRATION DATA. Schema is geospatial-ready and
> portable to PostgreSQL/PostGIS without logical changes.

## Conventions

- **Primary keys**: `String @id @default(cuid())` (SQLite has no native UUID;
  cuid gives collision-resistant IDs and is portable to `@db.Uuid` on Postgres).
- **Timestamps**: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`.
- **Naming**: `camelCase` fields, `@map("snake_case")` DB columns, `@@map("plural_snake")` tables.
- **Soft-delete readiness**: `is_active` / `status` flags where appropriate.
- **Enums**: stored as `String` with app-level vocabularies (validated by Zod) —
  portable to native Postgres enums later.

## Entities

### users
RBAC foundation. Demo users only.
| Field | Type | Notes |
|------|------|-------|
| id | String (cuid) | PK |
| email | String | unique |
| name | String | |
| password_hash | String | Phase-1 demo marker; replace with hashed creds / OAuth subject |
| role | String | STATE_ADMIN · DISTRICT_PLANNER · TRAINING_PROVIDER · EMPLOYER · INSTITUTION · TRAINER · CANDIDATE · AUDITOR |
| is_active | Boolean | |
| last_login_at | DateTime? | |
| created_at / updated_at | DateTime | |

### districts
Geospatial-ready. Latitude/longitude as Float (→ PostGIS geography on migration).
| Field | Type |
|------|------|
| id | String (cuid) |
| name | String |
| code | String (unique, e.g. MH-PUNE) |
| state_code | String (indexed, e.g. MH) |
| latitude / longitude | Float? |
| created_at / updated_at | DateTime |

### sectors
| Field | Type |
|------|------|
| id | String (cuid) |
| name | String |
| code | String (unique) |
| description | String? |
| created_at / updated_at | DateTime |

### skills
| Field | Type |
|------|------|
| id | String (cuid) |
| name | String |
| canonical_name | String (unique) |
| description | String? |
| category | String? (indexed) — Technical · Digital · Safety · Soft · Process |
| created_at / updated_at | DateTime |

### job_roles
| Field | Type |
|------|------|
| id | String (cuid) |
| title | String |
| canonical_title | String (unique) |
| description | String? |
| sector_id | String? → sectors |
| created_at / updated_at | DateTime |

### qualifications
| Field | Type |
|------|------|
| id | String (cuid) |
| name | String |
| code | String (unique) |
| description | String? |
| qualification_level | String — Certificate · Diploma · Advanced Diploma · Degree |
| created_at / updated_at | DateTime |

### institutions
| Field | Type |
|------|------|
| id | String (cuid) |
| name | String |
| institution_type | String — ITI · Polytechnic · Skill Centre · Private Training Provider |
| district_id | String? → districts (indexed) |
| description | String? |
| address | String? |
| latitude / longitude | Float? |
| is_active | Boolean |
| created_at / updated_at | DateTime |

### courses
| Field | Type |
|------|------|
| id | String (cuid) |
| name | String |
| code | String (unique) |
| description | String? |
| sector_id | String? → sectors (indexed) |
| qualification_id | String? → qualifications (indexed) |
| duration_hours | Int |
| status | String — DRAFT · ACTIVE · UNDER_REVIEW · DEPRECATED |
| created_at / updated_at | DateTime |

### employers
| Field | Type |
|------|------|
| id | String (cuid) |
| name | String |
| industry_sector_id | String? → sectors (indexed) |
| district_id | String? → districts (indexed) |
| description | String? |
| website | String? |
| size_category | String — MICRO · SMALL · MEDIUM · LARGE · ENTERPRISE |
| is_verified | Boolean |
| created_at / updated_at | DateTime |

### data_sources
Provenance register.
| Field | Type |
|------|------|
| id | String (cuid) |
| name | String |
| source_type | String — JOB_POSTING · EMPLOYER_SURVEY · INDUSTRY_CONSULTATION · SECTOR_GROWTH · PLACEMENT_OUTCOME · TECHNOLOGY_TREND · TRAINING_PROVIDER · GOVERNMENT |
| description | String? |
| source_url | String? |
| data_status | String — REAL · SYNTHETIC · MODELLED · DEMO · UNKNOWN |
| last_updated_at | DateTime? |
| created_at / updated_at | DateTime |

## Relationship Tables

### role_skills
Many-to-many between `job_roles` and `skills`.
| Field | Type |
|------|------|
| id | String (cuid) |
| job_role_id | String → job_roles (cascade) |
| skill_id | String → skills (cascade, indexed) |
| importance | Int (1–5) |
| unique(job_role_id, skill_id) | |

### course_skills
Many-to-many between `courses` and `skills`.
| Field | Type |
|------|------|
| id | String (cuid) |
| course_id | String → courses (cascade) |
| skill_id | String → skills (cascade, indexed) |
| coverage_level | String — NONE · INTRODUCED · REINFORCED · MASTERED |
| unique(course_id, skill_id) | |

### course_institutions
Many-to-many between `courses` and `institutions`.
| Field | Type |
|------|------|
| id | String (cuid) |
| course_id | String → courses (cascade) |
| institution_id | String → institutions (cascade, indexed) |
| capacity | Int |
| unique(course_id, institution_id) | |

### employer_roles
Many-to-many between `employers` and `job_roles`.
| Field | Type |
|------|------|
| id | String (cuid) |
| employer_id | String → employers (cascade) |
| job_role_id | String → job_roles (cascade, indexed) |
| unique(employer_id, job_role_id) | |

## Indexes
- `districts.state_code`
- `institutions.district_id`
- `employers.industry_sector_id`, `employers.district_id`
- `courses.sector_id`, `courses.qualification_id`
- `skills.category`
- `role_skills.skill_id`
- `course_skills.skill_id`
- `course_institutions.institution_id`
- `employer_roles.job_role_id`
- `data_sources.data_status`

## Migration Path (Phase ≥ 2)
Switching to PostgreSQL/PostGIS:
1. Change `datasource db` provider to `postgresql`.
2. Replace `String @id @default(cuid())` with `String @id @default(uuid())` or keep cuid.
3. Add `@db.Geography(Point, 4326)` to `latitude`/`longitude` (or migrate to a `geometry` column).
4. Convert `String` vocabularies to native `enum` types.
5. `prisma migrate dev` to generate SQL migrations.

No application/entity-relationship logic changes required.
