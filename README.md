# KAUSHAL DRISHTI

### Maharashtra Skill Intelligence & Policy Decision Platform

> **From Labour-Market Evidence to Better Skill Decisions.**

KAUSHAL DRISHTI is a government decision-support platform that connects labour-market evidence with Maharashtra's skill-development ecosystem. The eventual system will translate industry demand into course design, capacity planning, trainer development and candidate guidance — but **this repository implements Phase 1 only: the technical and UX foundation.**

> **⚠️ Demo Environment — Synthetic Data.** All data in this build is synthetic demonstration data. It is **not** actual Maharashtra Government data and must never be represented as such.

---

## Table of Contents
1. [What Phase 1 Delivers](#what-phase-1-delivers)
2. [Technology Stack](#technology-stack)
3. [Repository Structure](#repository-structure)
4. [Environment Adaptation Note](#environment-adaptation-note)
5. [Quick Start](#quick-start)
6. [Environment Variables](#environment-variables)
7. [Seed Data](#seed-data)
8. [Demo Accounts](#demo-accounts)
9. [API Overview](#api-overview)
10. [Frontend Routes](#frontend-routes)
11. [Testing](#testing)
12. [Documentation](#documentation)
13. [Phase 1 Limitations](#phase-1-limitations)
14. [What Comes Next](#what-comes-next)

---

## What Phase 1 Delivers

Phase 1 establishes the production-quality foundation on which every future module is built — **without** any advanced intelligence, AI/ML, forecasting, gap analysis, policy simulation, or outcome feedback (those belong to later phases).

- **Repository & engineering architecture** — monorepo-style layout under a single Next.js app, with clear separation of API, services, repositories, schemas, UI components, types, and store.
- **Database foundation** — normalized Prisma schema with 9 core entities + 4 relationship tables + RBAC users, indexes, unique constraints, foreign keys, soft-delete-ready fields, and geospatial-ready `latitude`/`longitude`.
- **API foundation** — standardized `{ success, data | error:{code,message,details} }` envelope, pagination, search, Zod validation, consistent HTTP status codes, and `/health` + `/api/v1/health` monitoring.
- **CRUD endpoints** for districts, sectors, employers, institutions, skills, job-roles, courses, qualifications, data-sources.
- **Authentication foundation** — JWT (HMAC-SHA256) abstraction with demo users and role-aware navigation. Designed as an extension point for Keycloak/OAuth2.
- **Design system** — government-grade palette (deep institutional navy, restrained status semantics), Inter typography, reusable components (MetricCard, StatusPill, EvidencePanel, PhasePlaceholder, DataTable, SourceBadge).
- **Government dashboard shell** — sidebar grouped by Intelligence / Training / Decision Support / Collaboration / Outcomes / System; topbar with user, role badge, `DEMO / SYNTHETIC DATA` environment badge, theme toggle, profile menu.
- **Core entity seed data** — clearly-labelled synthetic demonstration data for 3 districts, 3 sectors, 5 job roles, 10 skills, 5 courses, 3 institutions, 5 employers, 5 data sources.
- **Future-module placeholders** — intelligent empty states that explain what each future capability will do and in which phase it activates (no fake "Coming Soon" labels).
- **Documentation** — architecture, data model, API contract, UI design system, development guide, Phase 1 scope.
- **Health monitoring** — `/health` exposes app + DB + Redis-placeholder status.

---

## Technology Stack

| Layer | Technology |
|------|-----------|
| Framework | **Next.js 16** (App Router, Turbopack) |
| Language | **TypeScript 5** (strict) |
| Styling | **Tailwind CSS 4** + **shadcn/ui** (New York) |
| Icons | **Lucide React** |
| Charts | **Recharts** (available; Phase 1 keeps visualisation structural) |
| Database | **Prisma ORM** with **SQLite** (schema is geospatial-ready and portable to PostgreSQL/PostGIS) |
| Validation | **Zod** (Pydantic-equivalent) |
| Auth | JWT (HMAC-SHA256) foundation — extension point for Keycloak/OAuth2 |
| State | **Zustand** (client) + lightweight `useFetch` hook (server) |
| Runtime | **Bun** |

> See [Environment Adaptation Note](#environment-adaptation-note) for how the original FastAPI/PostgreSQL/Docker spec was adapted to this sandbox while preserving the full product vision.

---

## Repository Structure

```
kaushal-drishti/
├── prisma/
│   ├── schema.prisma          # Phase 1 entity model
│   └── seed.ts                # Synthetic demonstration seed
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (Inter font, ThemeProvider)
│   │   ├── page.tsx           # Auth gate → LoginScreen | AppShell
│   │   ├── globals.css        # Government design system
│   │   ├── health/route.ts    # /health
│   │   └── api/
│   │       ├── route.ts
│   │       └── v1/
│   │           ├── health/route.ts
│   │           ├── meta/route.ts
│   │           ├── auth/login/route.ts
│   │           ├── districts/
│   │           ├── sectors/
│   │           ├── employers/
│   │           ├── institutions/
│   │           ├── skills/
│   │           ├── job-roles/
│   │           ├── courses/
│   │           ├── qualifications/
│   │           └── data-sources/
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives
│   │   ├── kaushal/           # Platform components
│   │   │   ├── app-shell.tsx  · sidebar.tsx · topbar.tsx · login-screen.tsx
│   │   │   ├── metric-card.tsx · status-pill.tsx · evidence-panel.tsx
│   │   │   ├── phase-placeholder.tsx · data-table.tsx · source-badge.tsx
│   │   │   ├── architecture-flow.tsx · page-header.tsx · states.tsx
│   │   │   └── views/         # One component per "page"
│   │   └── theme-provider.tsx
│   ├── hooks/
│   │   ├── use-fetch.ts       # Lightweight server-state hook
│   │   ├── use-toast.ts
│   │   └── use-mobile.ts
│   ├── lib/
│   │   ├── api.ts             # Response envelope + error helpers
│   │   ├── api-client.ts      # Frontend API client
│   │   ├── auth.ts            # JWT foundation (replace with Keycloak)
│   │   ├── crud.ts            # Shared CRUD handlers
│   │   ├── db.ts              # Prisma client
│   │   └── utils.ts
│   ├── store/
│   │   └── app-store.ts       # Zustand auth + navigation
│   └── types/
│       └── domain.ts          # Shared domain types
├── docs/                      # architecture, data-model, api-contract, ui-design-system, development, phase-1
├── .env.example
├── package.json
└── README.md
```

---

## Environment Adaptation Note

The original Phase 1 specification called for a Python/FastAPI backend, PostgreSQL+PostGIS, Redis, and Docker Compose. This sandbox is a single **Next.js 16** project with **Prisma (SQLite)**. To preserve the full product vision while respecting the environment, KAUSHAL DRISHTI is implemented as:

- **Frontend + Backend**: Next.js 16 (App Router) Route Handlers under `/api/v1/*`, with Zod playing the Pydantic role.
- **Database**: Prisma ORM with SQLite. The schema uses `String` for UUIDs (cuid), `Float` for geo, and `String` + app-level vocabularies instead of native enums — so the logical model migrates to PostgreSQL/PostGIS without entity changes.
- **API**: Next.js Route Handlers with a standardized response envelope, pagination, Zod validation, and consistent error codes.
- **Auth**: JWT-style foundation (HMAC-SHA256) with demo users and role-aware navigation — shaped so Keycloak/OAuth2 replaces `src/lib/auth.ts` without touching route contracts or UI.
- **Cache / Redis**: documented as a future-ready extension point (`status: not-configured` in `/health`). The abstraction exists; a live Redis is wired in a later phase.
- **Single user-visible route `/`** hosts the full application shell with client-side view switching (login ↔ dashboard ↔ district profile ↔ all modules).

All data is **SYNTHETIC DEMONSTRATION DATA** — clearly labelled in the UI, API, and seed.

---

## Quick Start

```bash
# 1. Install dependencies (already done in this environment)
bun install

# 2. Configure environment
cp .env.example .env
# Edit .env if needed (defaults work out of the box)

# 3. Push schema to the database + generate Prisma client
bun run db:push

# 4. Seed synthetic demonstration data
bun run db:seed

# 5. Start the dev server (port 3000)
bun run dev

# 6. Open the Preview Panel (right side of the IDE) or visit via the gateway.
```

The application runs at `http://localhost:3000` (exposed externally through the Caddy gateway on port 81).

---

## Environment Variables

See [`.env.example`](.env.example):

```env
DATABASE_URL=file:/home/z/my-project/db/custom.db
JWT_SECRET=kaushal-drishti-dev-secret-change-me
APP_ENV=development
NEXT_PUBLIC_API_URL=
```

> Never commit real secrets. `JWT_SECRET` must be rotated before any non-demo deployment.

---

## Seed Data

Run `bun run db:seed`. The seed is **idempotent** (wipes + re-inserts) and produces:

| Entity | Count | Examples |
|--------|------:|---------|
| Districts | 3 | Pune, Nashik, Nagpur |
| Sectors | 3 | Advanced Manufacturing, Automotive, IT |
| Job Roles | 5 | Automation Engineer, PLC Technician, Robotics Technician, Software Developer, EV Technician |
| Skills | 10 | PLC Programming, SCADA, Industrial Robotics, Industrial IoT, Python, SQL, BMS, Electric Motor Drives, Embedded Systems, Workplace Safety |
| Courses | 5 | Industrial Automation, Robotics Technician, EV Technology, Software Development, Industrial IoT Fundamentals |
| Institutions | 3 | Demo Skill Centre Pune, Demo Technical Institute Nashik, Demo Training Hub Nagpur |
| Employers | 5 | Demo Automation Works, Demo Motors EV Assembly, Demo Software Solutions, Demo Robotics Integrators, Demo Battery Systems |
| Qualifications | 3 | Skill Certificate, Technical Diploma, Advanced Diploma |
| Data Sources | 5 | Synthetic Job/Employer/Course/Placement/Sector feeds — all `DEMO` |
| Demo Users | 4 | State Admin, District Planner, Employer, Training Provider |

All relationships (role_skills, course_skills, course_institutions, employer_roles) are populated.

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| State Administrator | `admin@kaushal-drishti.demo` | `demo-admin` |
| District Planner | `planner@kaushal-drishti.demo` | `demo-planner` |
| Employer | `employer@kaushal-drishti.demo` | `demo-employer` |
| Training Provider | `provider@kaushal-drishti.demo` | `demo-provider` |

> **Demo Accounts** — synthetic identities, not actual government users. On the login screen, click a demo account card to auto-fill credentials.

---

## API Overview

Base: `/api/v1`

| Method | Path | Purpose |
|-------|------|---------|
| GET | `/health` | Root health (app + DB + Redis placeholder) |
| GET | `/api/v1/health` | Versioned health |
| GET | `/api/v1/meta` | Platform metadata, phase roadmap, roles, counts |
| POST | `/api/v1/auth/login` | Demo login → `{ token, user }` |
| GET/POST | `/api/v1/districts` | List (paginated, searchable) / create |
| GET/PUT | `/api/v1/districts/[id]` | Detail (with employers+institutions) / update |
| GET/POST | `/api/v1/sectors` | |
| GET/POST | `/api/v1/employers` | Filterable by `districtId`, `sectorId` |
| GET/POST | `/api/v1/institutions` | Filterable by `districtId` |
| GET/POST | `/api/v1/skills` | Filterable by `category` |
| GET/POST | `/api/v1/job-roles` | Filterable by `sectorId`; includes `roleSkills` |
| GET/POST | `/api/v1/courses` | Filterable by `sectorId`, `status`; includes skills+institutions |
| GET/POST | `/api/v1/qualifications` | |
| GET/POST | `/api/v1/data-sources` | Filterable by `status` |

All collection endpoints support `?page=1&pageSize=20&search=…` and return:

```json
{ "success": true, "data": { "items": [], "total": 0, "page": 1, "pageSize": 20, "totalPages": 1 } }
```

Errors:

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "District not found" } }
```

See [docs/api-contract.md](docs/api-contract.md) for full details.

---

## Frontend Routes

The application is a single-page shell at `/`. Client-side views:

| View | Status | Description |
|------|--------|-------------|
| Overview | ✅ Phase 1 | Foundation KPIs from seed data + architecture preview + provenance |
| District Intelligence | ✅ Phase 1 | District table + district profile (employers, institutions) |
| Labour Market | 🔜 Phase 4 | Demand signals by role/skill/location/proficiency |
| Skills | ✅ Phase 1 | Searchable skill catalogue |
| Training Ecosystem | ✅ Phase 1 | Institutions + Qualifications tabs |
| Courses | ✅ Phase 1 | Course catalogue with status pills |
| Employer Validation | 🔜 Phase 7 | Demand-validation workflows |
| Policy Sandbox | 🔜 Phase 11 | Policy simulation engine |
| District Plans | 🔜 Phase 9 | District action-plan generation |
| Outcomes | 🔜 Phase 12 | Outcome feedback engine |
| Data Sources | ✅ Phase 1 | Provenance register |
| Administration | ✅ Phase 1 | System health, RBAC, auth, registered sources |

---

## Testing

```bash
bun run lint        # ESLint (0 errors expected)
bun run db:push     # Schema sync
bun run db:seed     # Idempotent synthetic seed
```

Manual end-to-end verification is performed with **Agent Browser** (see `docs/screenshots/`).

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — system architecture & future modules
- [`docs/data-model.md`](docs/data-model.md) — every Phase 1 entity & relationship
- [`docs/api-contract.md`](docs/api-contract.md) — full API contract
- [`docs/ui-design-system.md`](docs/ui-design-system.md) — typography, color, components, status conventions
- [`docs/development.md`](docs/development.md) — setup, migrations, seed, lint, conventions
- [`docs/phase-1.md`](docs/phase-1.md) — Phase 1 scope, acceptance checklist, limitations

---

## Phase 1 Limitations

Intentionally **not** implemented in Phase 1 (reserved for later phases):

- Labour-market intelligence (Phase 4)
- Skill-gap calculation / demand-supply analysis
- Course relevance scoring / recommendations
- AI, ML, LLM, embeddings, vector search, forecasting
- Employer validation workflows (Phase 7)
- District action-plan generation (Phase 9)
- Policy simulation engine (Phase 11)
- Outcome feedback engine (Phase 12)
- Real government / partner data-provider integrations
- Live Redis wiring (abstraction exists)
- Keycloak/OAuth2 SSO (JWT abstraction exists)

---

## What Comes Next

The human project lead will review Phase 1 before any further phase is started. **Phase 2+ is not auto-started.**

> KAUSHAL DRISHTI should help Maharashtra move from static skill-programme administration toward evidence-driven, continuously improving skill-development decisions.
