# KAUSHAL DRISHTI — Architecture

> Maharashtra Skill Intelligence & Policy Decision Platform — Phase 1 Foundation

## 1. High-Level Architecture

KAUSHAL DRISHTI Phase 1 is a single Next.js 16 application that hosts both the
frontend shell and the backend API. The eventual intelligence flow is:

```
LABOUR-MARKET SIGNALS
        ↓
EVIDENCE LAYER
        ↓
SKILL + ROLE INTELLIGENCE
        ↓
DEMAND INTELLIGENCE
        ↓
TRAINING SUPPLY
        ↓
DEMAND–SUPPLY GAP
        ↓
COURSE / CURRICULUM ANALYSIS
        ↓
TRAINER / EQUIPMENT / CAPACITY ANALYSIS
        ↓
EMPLOYER VALIDATION
        ↓
DISTRICT SKILL INTELLIGENCE
        ↓
POLICY SIMULATION
        ↓
DISTRICT ACTION PLAN
        ↓
IMPLEMENTATION
        ↓
OUTCOMES
        ↓
FEEDBACK
```

**Phase 1 implements only the foundation layers** (entities, taxonomy,
provenance, RBAC, dashboard shell). Analytical layers activate in later phases.

## 2. Runtime Topology

```
┌──────────────────────────────────────────────────────────────┐
│                       Browser (user)                          │
│  Login → AppShell (Sidebar + Topbar) → Client-side views      │
└────────────────────────────┬─────────────────────────────────┘
                             │  HTTPS (same-origin / Caddy gateway :81)
┌────────────────────────────▼─────────────────────────────────┐
│                Next.js 16 (App Router, Turbopack)              │
│                                                                │
│  ┌───────────────┐   ┌──────────────────────────────────────┐ │
│  │  React UI     │   │  Route Handlers  /api/v1/*            │ │
│  │  (src/app/    │   │  health · meta · auth · districts ·   │ │
│  │   page.tsx)   │   │  sectors · employers · institutions · │ │
│  │               │   │  skills · job-roles · courses ·       │ │
│  │  Zustand      │◄──┤  qualifications · data-sources      │ │
│  │  (auth+nav)   │   │                                        │ │
│  │  useFetch     │   │  src/lib/{api,auth,crud,db}.ts         │ │
│  └───────────────┘   └──────────────────┬───────────────────┘ │
└──────────────────────────────────────────┬─────────────────────┘
                                           │ Prisma Client
                          ┌────────────────▼────────────────┐
                          │  Prisma ORM  →  SQLite (custom.db)│
                          │  (portable to PostgreSQL/PostGIS) │
                          └─────────────────────────────────┘
```

### External gateway
A Caddy gateway listens on `:81` and reverse-proxies to the Next.js app on
`:3000`. Cross-service requests use the `?XTransformPort=<port>` convention.

## 3. Layered Backend (inside Next.js)

```
Route Handler (/api/v1/<entity>/route.ts)
        │  Zod validation
        ▼
Shared helpers (src/lib/api.ts, crud.ts)  — response envelope, pagination, errors
        │
        ▼
Prisma Client (src/lib/db.ts)
        │
        ▼
SQLite (db/custom.db) — schema in prisma/schema.prisma
```

### Future-ready service layer
Phase 1 reserves extension points (documented) for later phases:
```
backend/app/services/
    labour_market_service.py        →  src/lib/services (planned)
    skill_intelligence_service.py
    training_supply_service.py
    gap_analysis_service.py
    recommendation_service.py
    policy_simulation_service.py
    district_plan_service.py
    outcome_service.py
```
Phase 1 contains **no** implementations of these — only the schema, provenance,
and placeholder UI states that name the phase in which each activates.

## 4. Data Provider Abstraction

Phase 1 ships a `SyntheticDataProvider` (the seed). The provenance model
(`DataSource.dataStatus`: REAL · SYNTHETIC · MODELLED · DEMO · UNKNOWN) is
already in place so future providers plug in without rewrites:
```
OfficialGovernmentProvider  ·  APIProvider  ·  CSVProvider  ·  PartnerProvider
```

## 5. Authentication Architecture

```
LoginScreen ──POST /api/v1/auth/login──► authenticateDemo() ──► signToken()
                                                          │
                    ◄── { token, user } ──────────────────┘
        │
        ▼  localStorage(kd_token, kd_user)  +  Zustand persist
AppShell
  ├─ Topbar (user, role badge, environment badge)
  ├─ Sidebar (role-aware navigation)
  └─ Views (useFetch w/ Authorization: Bearer <token>)
```

`src/lib/auth.ts` is the **only** module that knows about JWT. Replacing it
with Keycloak/OAuth2 leaves route contracts and UI untouched.

## 6. Future Modules (informational — NOT in Phase 1)

| Module | Phase | Activates |
|--------|------:|-----------|
| Labour-Market Intelligence | 4 | Demand signals by role/skill/location/proficiency |
| Skill Intelligence | 5 | Canonical skills + semantic matching |
| Demand/Supply & Gap Analysis | 6 | Course relevance, oversupply/obsolete flags |
| Employer Validation | 7 | Structured demand-validation workflows |
| District Action Plans | 9 | Prioritised district interventions |
| Policy Simulation | 11 | Option A vs Option B modelling |
| Outcome Feedback | 12 | Placement, satisfaction, effectiveness loop |

## 7. Cross-Cutting Concerns

- **Error handling** — `src/lib/api.ts` standardises `{ success, error:{code,message,details} }`
  with `ApiErrorCode` → HTTP status mapping.
- **Logging** — Prisma query logging in dev; never logs passwords/JWTs/secrets.
- **Health** — `/health` and `/api/v1/health` expose app + DB + Redis-placeholder status.
- **Accessibility** — semantic HTML, ARIA labels, sr-only, keyboard nav, focus states.
- **Responsiveness** — desktop-first; sidebar collapses to a Sheet on mobile; tables scroll.
- **Security** — JWT secret via env; demo users clearly labelled; protected routes require Bearer token.
