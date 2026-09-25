# KAUSHAL DRISHTI — Development Guide

## 1. Prerequisites
- **Bun** (runtime + package manager)
- Node 18+ (Bun manages it)
- SQLite (bundled — no separate server)

## 2. Local Setup
```bash
bun install
cp .env.example .env          # defaults work out of the box
bun run db:push               # create/migrate schema
bun run db:seed               # load synthetic demonstration data
bun run dev                   # http://localhost:3000
```

## 3. Branch Structure (suggested)
- `main` — stable, deployable
- `phase-1/*` — Phase 1 work
- `phase-<n>/<feature>` — future phase feature branches

Phase 1 is intentionally frozen. **Do not start Phase 2+ without explicit instruction.**

## 4. Database Workflow
```bash
bun run db:push      # sync schema → DB (accepts data loss; dev only)
bun run db:generate   # regenerate Prisma Client after schema edits
bun run db:migrate    # create a migration (production-style)
bun run db:reset      # wipe + re-migrate (destructive)
bun run db:seed       # idempotent synthetic seed (wipe + re-insert)
```

Schema lives in `prisma/schema.prisma`. **Never** edit the DB outside Prisma.

### Adding a new entity
1. Add the model to `prisma/schema.prisma`.
2. `bun run db:push` (dev) or `bun run db:migrate -- --name add_<entity>` (migration).
3. Add a Zod schema + route handler under `src/app/api/v1/<entity>/route.ts`.
4. Add the route to `src/components/kaushal/views/<entity>-view.tsx`.
5. Register the view in `src/components/kaushal/app-shell.tsx` `VIEW_REGISTRY`.
6. Add the nav entry in `src/components/kaushal/sidebar.tsx`.
7. Add the meta phase entry in `src/app/api/v1/meta/route.ts`.

## 5. API Conventions
- All routes under `/api/v1/*`.
- Use `src/lib/api.ts` helpers: `ok()`, `paginated()`, `fail()`, `parsePagination()`, `handlePrismaError()`.
- Validate writes with Zod; return `VALIDATION_ERROR` (422) with flatten details.
- Never expose raw Prisma objects — the include-shape is the contract.
- Standard envelope: `{ success, data | error:{code,message,details} }`.

## 6. Linting & Formatting
```bash
bun run lint        # ESLint (Next.js + strict TypeScript)
```
Target: **0 errors, 0 warnings.**

## 7. Authentication
- Demo users live in `users` table (seeded). `password_hash` holds the demo marker directly — **replace** before any non-demo deployment.
- JWT: `src/lib/auth.ts` (signToken/verifyToken/authenticateDemo/requireUser).
- To wire Keycloak/OAuth2: replace `src/lib/auth.ts`; route contracts stay identical.

## 8. State Management
- **Client state**: Zustand (`src/store/app-store.ts`) — auth + navigation, persisted.
- **Server state**: lightweight `useFetch` hook (`src/hooks/use-fetch.ts`).
  Swap for TanStack Query in a later phase without changing call sites much.

## 9. Adding a View
1. Create `src/components/kaushal/views/<name>-view.tsx` (default export function).
2. Register in `app-shell.tsx` `VIEW_REGISTRY`.
3. Add nav item in `sidebar.tsx` with `phase` + `active` flags.
4. Use `PageHeader`, `DataTable`, `EvidencePanel`, `StatusPill`, `useFetch`.

## 10. Data Governance
- **Never** hard-code labour-market figures in app code.
- All values come from registered `data_sources` with a declared `data_status`.
- Phase 1 sources are all `DEMO` / `SYNTHETIC`.

## 11. Testing
- `bun run lint` — static checks.
- Manual end-to-end via **Agent Browser** (see `docs/screenshots/`).
- Phase 1 does not ship a unit-test suite; the acceptance checklist in `docs/phase-1.md` is the gate.

## 12. Logging
- Prisma query logging in dev (`log: ['query']`).
- Never log passwords, JWTs, or secrets.
- API errors carry `code` + `message` + optional `details`.

## 13. Common Commands
| Command | Purpose |
|---------|---------|
| `bun run dev` | Dev server on :3000 |
| `bun run lint` | ESLint |
| `bun run db:push` | Sync schema |
| `bun run db:seed` | Synthetic seed |
| `bun run db:generate` | Regenerate Prisma Client |
| `bun run db:migrate` | Create migration |
| `bun run db:reset` | Destructive reset |
