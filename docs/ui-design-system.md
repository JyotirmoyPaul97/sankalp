# KAUSHAL DRISHTI — UI Design System

> Government-grade, analytical, trustworthy, modern, calm, evidence-driven.
> **Not** a generic admin template.

## 1. Design Principles
- **Restraint over flourish** — no excessive gradients, neon colours, glassmorphism everywhere, giant animated heroes, gaming UI, or social-media cards.
- **Evidence over decoration** — every metric carries provenance and a clear label.
- **Density over whitespace** — compact tables, tight metric cards, scannable lists.
- **Status as signal** — colour encodes meaning (green/amber/red/blue), never decoration.
- **Desktop-first** — government planners are the primary users; mobile is a graceful collapse.

## 2. Typography
- **Font**: Inter (system-safe fallback). Mono: Geist Mono.
- **Base size**: 14px / line-height 1.55 / letter-spacing −0.006em.
- **Hierarchy**:

| Token | Size | Weight | Use |
|-------|-----:|-------:|-----|
| Display / H1 | 24px (text-2xl) | 600 | Page titles |
| H2 | 20px | 600 | Section titles |
| H3 | 18px (text-lg) | 600 | Card titles |
| H4 | 14px | 600 | Panel titles |
| Body | 14px | 400 | Default text |
| Small | 12–13px | 400 | Hints, meta |
| Caption | 11px | 400 | Timestamps, codes |
| Label | 11px uppercase tracking-wider | 500/600 | Metric labels, column headers |
| Mono | 11–12px | 400 | Codes, IDs, technical values |

## 3. Colour System
Restrained government/analytics palette (defined as OKLCH CSS variables in `globals.css`).

### Surfaces
| Token | Light | Use |
|-------|-------|-----|
| `--background` | near-white | Page background |
| `--card` | white | Cards, tables |
| `--muted` | light gray | Muted surfaces, table headers |
| `--sidebar` | deep navy | Sidebar surface |

### Primary
Deep institutional navy (`oklch(0.32 0.06 258)`) for primary actions and the sidebar.
A muted teal accent (`--accent`) for subtle interactive emphasis.

### Status semantics (controlled, not neon)
| Tone | Variable | Use |
|------|----------|-----|
| Positive / Green | `--status-positive` | Validated, healthy, active |
| Attention / Amber | `--status-attention` | Review, demo data, pending |
| Critical / Red | `--status-critical` | Errors, deprecated, critical |
| Info / Blue | `--status-info` | Normal interaction, foundation |

Soft tinted surfaces (`surface-positive`, `surface-attention`, `surface-critical`,
`surface-info`, `surface-neutral`) pair a 14–18% tint background with the
semantic foreground for StatusPills and badges.

### Data-status mapping
| `data_status` | Tone |
|---------------|------|
| REAL | positive (green) |
| SYNTHETIC · MODELLED | info (blue) |
| DEMO | attention (amber) |
| UNKNOWN | neutral |

### Course-status mapping
| `status` | Tone |
|----------|------|
| ACTIVE | positive |
| UNDER_REVIEW | attention |
| DEPRECATED | critical |
| DRAFT | neutral |

## 4. Spacing & Layout
- **Radius**: `--radius: 0.5rem` (lg/md/sm derived). Cards use `rounded-lg`; pills use `rounded-full`.
- **Card padding**: `p-5` (metric cards), `p-4` (panels).
- **Section gap**: `space-y-6` / `gap-4` / `gap-6`.
- **Max content width**: `max-w-7xl` centered.
- **Sidebar**: fixed `w-64` on desktop; collapses to a `Sheet` (w-72) on `<lg`.

## 5. Components (src/components/kaushal)
| Component | Purpose |
|-----------|---------|
| `AppShell` | Sidebar + Topbar + view router + sticky footer |
| `Sidebar` | Grouped navigation (Intelligence / Training / Decision Support / Collaboration / Outcomes / System) |
| `Topbar` | View title, environment badge, theme toggle, notifications, profile menu |
| `LoginScreen` | Brand panel + sign-in form + demo-account cards |
| `PageHeader` | Title + description + badge + actions |
| `MetricCard` | KPI card with tone accent + hint + optional loading skeleton |
| `StatusPill` | Tinted pill with optional dot; maps status → tone |
| `EvidencePanel` | WHY / EVIDENCE / SOURCE / LAST UPDATED / CONFIDENCE scaffold |
| `PhasePlaceholder` | Intelligent empty-state for future modules (names the activating phase) |
| `DataTable` | Compact table with skeletons, empty state, row click, scroll |
| `SourceBadge` / `ProvenanceLine` | Data-source status + provenance line |
| `ArchitectureFlow` | Conceptual vertical flow of the intelligence pipeline |
| `ErrorState` / `LoadingState` | Consistent async states |

All built on shadcn/ui primitives (`Card`, `Table`, `Badge`, `Sheet`, `DropdownMenu`, `Tabs`, `Select`, `Input`, `Button`, …).

## 6. Status Conventions
- **StatusPill** with `dot` for boolean-ish states (Active, Verified, DEMO).
- **StatusPill** without dot for categorical states (ACTIVE, UNDER_REVIEW).
- Every metric card may carry a `tone` accent bar on the left edge.
- Evidence panels always show `source` + optional `lastUpdated` + optional `confidence`.

## 7. Navigation Model
Sidebar groups (in order):
1. **Intelligence** — Overview · Labour Market · Skills
2. **Training** — Training Ecosystem · Courses
3. **Decision Support** — District Intelligence · Policy Sandbox · District Plans
4. **Collaboration** — Employer Validation
5. **Outcomes** — Outcomes
6. **System** — Data Sources · Administration

Inactive (future-phase) items show a `P<n>` marker instead of an active-state chevron.

Topbar: environment badge `DEMO / SYNTHETIC DATA` (amber), theme toggle, notifications (placeholder, disabled), profile menu (name + role + sign-out).

## 8. Accessibility
- Semantic HTML (`main`, `header`, `nav`, `footer`).
- ARIA labels on icon-only buttons (`aria-label="Open navigation"`, `"Toggle theme"`, `"Notifications"`).
- `sr-only` titles/descriptions on the mobile Sheet for screen readers.
- Keyboard-navigable: focus rings (`outline-ring/50`), 44px touch targets on mobile.
- Colour is never the sole signal — pills carry a dot + text label.
- Tables scroll horizontally on narrow screens; cards stack.

## 9. Responsiveness
- Desktop ≥ `lg` (1024px): full sidebar + multi-column grids (`xl:grid-cols-6` KPI row).
- Tablet `md`–`lg`: sidebar hidden, 2–3 column metric rows.
- Mobile `< md`: hamburger Sheet, stacked cards, scrollable tables, single-column.

## 10. Empty & Loading States
- **Loading**: skeleton rows in DataTable; spinner in `LoadingState`.
- **Error**: `ErrorState` with title + message + "Try again" (calls `refetch`).
- **Future module**: `PhasePlaceholder` — never "Coming Soon"; always states
  the capability and the activating phase, with a capabilities grid.
- **Empty list**: contextual message ("No demonstration districts match your search.").

## 11. Motion
Subtle only. `hover:-translate-y-0.5` on metric cards, `transition-colors` on
buttons/rows. No full-page transitions, no parallax, no autoplay carousels.
