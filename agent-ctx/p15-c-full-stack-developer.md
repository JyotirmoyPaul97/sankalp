# Task p15-c — Final UX Transformation (Industry/Employer + Training + Candidate)

**Agent**: full-stack-developer
**Date**: 2026-09-25
**Scope**: Simplify Industry/Employer, Training Ecosystem, and Candidate workspace overviews. Remove phase/demo/technical language. Replace tables with visualizations.

## Files Modified

### Views (src/components/kaushal/views/)
- **employer-validation-view.tsx** — Full rewrite as 3-action visual layout
  - 3 major action cards: WHAT INDUSTRY NEEDS / WHAT EMPLOYERS ARE HIRING FOR / VALIDATE DEMAND
  - Sector Demand + Cluster Requirements evidence panels with VisualBar
  - "How Demand Validation Closes the Loop" section using PrioritySignal
  - MaharashtraIntelligenceBackground variant="industry" (opacity 0.06)
  - StatusBadge replaces "Live Intelligence" pill
- **training-view.tsx** — Simplified
  - Removed "All data is synthetic demonstration data." text
  - Added 4-card insight strip + Training Supply Chain visual
  - MaharashtraIntelligenceBackground variant="training" (opacity 0.05)
- **delivery-capability-view.tsx** — New headline-driven layout
  - DeliveryGapVisual for PLC Technician (demand HIGH / course PARTIAL / trainer MEDIUM / equipment LOW / capacity INSUFFICIENT / result "DELIVERY GAP")
  - 4 navigation cards: VIEW CURRICULUM / VIEW TRAINER / VIEW EQUIPMENT / VIEW CAPACITY
  - Kept CourseRelevanceSection, CentreReadinessSection, DeliveryGapsSection as drilldown
- **courses-view.tsx** — Renamed to "Curriculum & Course Coverage"
  - Added compact relevance/coverage visual per row (VisualBar + M/R/I/N chip legend)
  - Added coverage legend strip below filters
- **gap-intelligence-view.tsx** — Added compact GapMatrix visual summary at top (6 skill rows). Kept existing GapTable + structure.

### Candidate workspace (src/components/kaushal/candidate/)
- **candidate-sidebar.tsx** — Removed "Environment: Prototype" + "Synthetic demonstration data only." Kept "Evidence, not claims."
- **candidate-shell.tsx** — Footer text simplified to "Synthetic demonstration data · Evidence-based readiness, not employment guarantees." Added MaharashtraIntelligenceBackground variant="candidate" (opacity 0.06) as fixed subtle background.
- **candidate-topbar.tsx** — Removed "SYNTHETIC" Badge.
- **views/candidate-home.tsx** — Removed "Synthetic Demonstration" StatusPill from hero.
- **views/profile-view.tsx** — Removed "Synthetic Demonstration" StatusPill from Identity card.

### Navigation (src/components/kaushal/)
- **sidebar.tsx** — Removed `phase: number` field from NavItem interface + ALL usages. Removed "Prototype" label from footer. Renamed "System" → "System Administration" group (State Admin). Renamed "Data Governance" → "Data Stewardship".
- **topbar.tsx** — VIEW_TITLES: "Data Governance Centre" → "Data Stewardship", "Courses" → "Curriculum & Course Coverage", "Employer Validation" → "Industry Demand & Employer Validation". Removed duplicate `outcomes` entry. Topbar badge "DEMO / SYNTHETIC DATA" → "SYNTHETIC DATA".

## Lint Result
- `bun run lint` → 0 errors, 0 warnings. (Run twice during development.)

## Pre-existing Dev Log Errors (NOT caused by this task)
- `ReferenceError: Cannot access 'gap' before initialization` in `/api/v1/candidate/one-skill/[skillId]` route — pre-existing backend bug owned by previous agent (Phase 12.5 worklog notes a fix was attempted but dev.log shows it still occurs).
- `PrismaClientValidationError` in `/api/v1/scenarios` GET — pre-existing (Phase 13 worklog notes a fix was attempted but dev.log shows intermittent recurrence).

These are out of scope for p15-c. None of the view files I modified produce any errors in the dev log.

## Files NOT Touched (per task scope)
- landing-screen.tsx (owned by other agent)
- overview-view.tsx (owned by other agent)
- district views (owned by other agent)
- candidate-intelligence-view.tsx (government-side view of candidate intelligence; not in candidate workspace scope)
- visual-components.tsx (already has DeliveryGapVisual, PrioritySignal, GapMatrix, SkillDecisionLoop from previous agent)
- maharashtra-background.tsx (already created by previous agent — I just consumed it)
