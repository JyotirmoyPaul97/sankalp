# KAUSHAL DRISHTI — Phase 2: Data & Evidence Ingestion Layer

> **DATA FIRST. INTELLIGENCE LATER.** Phase 2 builds the trusted data &
> evidence ingestion layer: Source → Provenance → Validation → Quality →
> Storage → Audit, BEFORE any intelligence (Phase 3+).

## 1. What Phase 2 Adds

On top of the Phase 1 foundation, Phase 2 delivers:

- **Data-source abstraction** — `SyntheticDataProvider`, `CSVDataProvider`, `JSONDataProvider`, `ManualEntryProvider` with an extension point for future `OfficialGovernmentProvider` / `APIProvider` / `PartnerProvider`.
- **Ingestion framework** — two-phase pipeline: `previewAndValidate()` (dry run + draft batch) → `confirmAndStoreFromRecords()` (transactional commit).
- **CSV + JSON ingestion** — minimal RFC-4180 CSV parser + JSON parser, no external deps.
- **Validation** — Zod-equivalent validators per entity: completeness, validity, referential integrity.
- **Normalization** — whitespace, title-case, date, enum, numeric. **No semantic/ML normalization** (that is Phase 3).
- **Deduplication** — exact `(sourceId, sourceRecordId)` + compound fingerprint (employer+role+district+date for jobs). Possible duplicates are flagged, never silently merged.
- **Data-quality framework** — deterministic score = 0.35·completeness + 0.30·validity + 0.20·uniqueness + 0.15·consistency. NO ML.
- **Provenance** — every record traces Source → Batch → Raw Record → Normalized Record.
- **Ingestion history + errors** — `IngestionBatch` + `IngestionError` tables.
- **Audit logging** — `AuditLog` for uploads, validates, confirms, source CRUD, login/logout.
- **File storage** — `storage/` abstraction with SHA-256 checksums, safe filenames, path-traversal protection, file-type allow-list.
- **Admin ingestion UI** — 6 new views under a "Data Operations" nav group.
- **Synthetic datasets** — 425 internally-consistent records across 6 evidence types + 7 test CSVs (A–G).
- **API security** — all ingestion + source-mutation routes require `STATE_ADMIN` or `AUDITOR` JWT.

## 2. What Phase 2 Does NOT Do

No NLP, no embeddings, no semantic search, no forecasting, no demand prediction, no skill-gap calculation, no course scoring, no recommendations, no policy simulation, no digital-twin analytics, no AI/ML models. Those belong to Phase 3+.

## 3. Architecture

```
DATA SOURCES (CSV / JSON / Synthetic / Manual)
        │
        ▼
INGESTION SERVICE (src/lib/ingestion/)
        │
        ├─ parse      (parser.ts)
        ├─ validate    (validate.ts + Zod-equivalent schemas)
        ├─ normalize   (normalize.ts)
        ├─ dedupe      (dedupe.ts — exact + fingerprint)
        ├─ quality     (quality.ts — deterministic score)
        │
        ▼
DATABASE STORAGE (entity tables + IngestionRecord provenance)
        │
        ▼
INGESTION AUDIT (AuditLog)
```

Every stage is traceable: each ingested record carries `sourceId`, `batchId`, `sourceRecordId`, `fingerprint`, `rawJson`, and `normalizedId`.

## 4. New Database Tables

| Table | Purpose |
|-------|---------|
| `uploaded_files` | File metadata + SHA-256 checksum (physical file in `storage/`) |
| `ingestion_batches` | Per-import summary: counts, status, quality score, batch code `ING-YYYY-NNNN` |
| `ingestion_records` | Raw record tracking + provenance + fingerprint |
| `ingestion_errors` | Per-record validation issues (row + field + problem + severity + suggested action) |
| `audit_logs` | Ingestion + admin action trail |
| `job_postings` | Normalized job-posting evidence |
| `employer_surveys` | Normalized employer-survey evidence |
| `industry_consultations` | Normalized consultation evidence |
| `sector_growth` | Normalized sector-growth observations |
| `placement_outcomes` | Normalized placement-outcome records |
| `technology_trends` | Normalized technology-trend observations |

`DataSource` was extended with `providerName`, `sourceReference`, `geographyLevel`, `updateFrequency`, `isActive`.

## 5. New API Endpoints

| Method | Path | Auth | Purpose |
|-------|------|------|---------|
| POST | `/api/v1/ingestion/upload` | admin | Multipart upload + parse + validate → preview + draft batch |
| POST | `/api/v1/ingestion/confirm` | admin | Commit a draft batch to entity tables (transactional) |
| GET | `/api/v1/ingestion/batches` | — | List batches (paginated, searchable, filterable by status) |
| GET | `/api/v1/ingestion/batches/[id]` | — | Batch detail: errors + provenance sample |
| GET | `/api/v1/data-quality/[batchId]` | — | Quality report: 4 dimensions + top problem fields |
| GET | `/api/v1/records/[entity]` | — | Generic explorer across 6 evidence tables |
| GET | `/api/v1/audit-logs` | — | Audit trail (filterable by action) |
| POST | `/api/v1/data-sources` | admin | Create source (extended fields) |
| GET/PUT | `/api/v1/data-sources/[id]` | PUT admin | Get/update source |

`/api/v1/meta` now also returns a `dataHealth` block (activeSources, recentImports, totalIngested, avgQuality, per-entity counts).

## 6. New UI Routes (Data Operations)

| View | Purpose |
|------|---------|
| Upload Dataset | 5-step stepper: Select Source → Upload → Preview → Confirm → Result |
| Import Batches | History table + batch-detail drill-down (provenance + errors) |
| Data Quality | Per-batch dashboard: 4 quality dimensions + top problem fields |
| Records Explorer | Generic searchable/filterable explorer across 6 evidence tables |
| Provenance | Source → Batch → Record chain visualization |
| Audit Logs | Ingestion + admin action trail |

The Overview page gained a **Data Health** section (sources, recent imports, records ingested, avg quality, evidence breakdown bars — all derived from the DB).

## 7. Data-Quality Methodology

```
Quality Score = 0.35 × completeness
              + 0.30 × validity
              + 0.20 × uniqueness
              + 0.15 × consistency
```

- **Completeness** — fraction of records with no missing-required-field errors
- **Validity** — fraction of records with no invalid-value errors
- **Uniqueness** — 1 − (duplicates / received)
- **Consistency** — fraction of records with no unknown-reference warnings

Labelled **"Data Quality Score"** (not a labour-market score). Deterministic — no ML.

## 8. Security

- All ingestion + source-mutation routes require `STATE_ADMIN` or `AUDITOR` JWT (`requireAdmin()`).
- File-type allow-list: `.csv`, `.json` only. Blocked: `.exe`, `.sh`, `.py`, `.js`, `.php`, `.bat`, …
- 25 MB upload limit.
- Safe filenames (basename only, sanitised chars).
- Path-traversal protection on read.
- SHA-256 checksums detect duplicate uploads.
- Audit logs never store passwords, tokens, or secrets.

## 9. Synthetic Datasets

| Dataset | File | Records | Scenario |
|---------|------|--------:|----------|
| A | `dataset_a_valid.csv` | 50 | 100% valid (happy path) |
| B | `dataset_b_missing_fields.csv` | 30 | Missing required fields |
| C | `dataset_c_duplicates.csv` | 40 | Exact + compound duplicates |
| D | `dataset_d_invalid_dates.csv` | 25 | Malformed dates |
| E | `dataset_e_unknown_district.csv` | 25 | Unknown districts |
| F | `dataset_f_invalid_status.csv` | 25 | Invalid data_status |
| G | `dataset_g_mixed.csv` | 60 | Mixed quality (~25% reject) |

The Phase 2 seed additionally generates 425 internally-consistent records (120 job postings, 55 surveys, 24 consultations, 32 sector growth, 110 placements, 34 tech trends) and ingests Dataset A through the pipeline.

## 10. How to Run

```bash
bun run db:push          # sync schema (Phase 1 + Phase 2 tables)
bun run db:seed          # Phase 1 synthetic seed (entities)
bun run db:seed:phase2   # Phase 2 synthetic seed (ingestion + provenance)
bun run dev              # http://localhost:3000
```

Log in as `admin@kaushal-drishti.demo` / `demo-admin`, then open **Data Operations → Upload Dataset** to run the full ingestion flow.

## 11. Acceptance Checklist

### DATA
- [x] multiple source types supported (12 vocab values)
- [x] source metadata stored (provider, geography, frequency, status)
- [x] source provenance stored
- [x] ingestion batches tracked
- [x] record status tracked
- [x] real/synthetic/modelled/demo distinction exists

### INGESTION
- [x] CSV upload works
- [x] JSON upload works
- [x] validation works (completeness + validity + referential integrity)
- [x] normalization works (whitespace, title-case, date, enum, numeric)
- [x] deduplication works (exact + fingerprint — verified by re-uploading Dataset A)
- [x] safe upsert works (default mode; never silently deletes)
- [x] import history works
- [x] failure handling works (Dataset B/D/E/F rejected correctly)

### DATA QUALITY
- [x] completeness checks
- [x] validity checks
- [x] uniqueness checks
- [x] consistency checks
- [x] quality score (deterministic, weighted)
- [x] errors/warnings (ERROR/WARNING/INFO severity)
- [x] quality report (per-batch dashboard)

### SECURITY
- [x] protected ingestion endpoints (requireAdmin)
- [x] file validation (extension allow-list)
- [x] size limits (25 MB)
- [x] safe storage (sanitized names, path-traversal guard)
- [x] audit logs
- [x] no secrets exposed

### FRONTEND
- [x] Data Sources functional (list + create + edit)
- [x] Dataset Upload functional (5-step stepper)
- [x] Import Preview functional (quality score + sample issues)
- [x] Validation results functional (errors table)
- [x] Import History functional (batch list + detail)
- [x] Data Quality functional (per-dimension dashboard)
- [x] Data Explorer functional (6 evidence tables)
- [x] Audit log view functional

### BACKEND
- [x] APIs documented (docs/api-contract.md + this file)
- [x] pagination works
- [x] validation works (Zod-equivalent)
- [x] authorization works (requireAdmin)
- [x] database transactions work ($transaction on confirm)
- [x] batch processing works (createMany in chunks of 200)

### TESTING (Agent Browser E2E)
- [x] valid dataset test passes (Dataset A → all accepted or deduped)
- [x] invalid dataset test passes (Dataset B → missing fields rejected)
- [x] duplicate test passes (re-upload of Dataset A → exact duplicates detected)
- [x] security test passes (admin JWT required on upload)
- [x] integration flow passes (Upload → Preview → Confirm → Batch → Quality → Explorer → Audit)

## 12. STOP CONDITION

Phase 2 is complete. **Phase 3 is NOT auto-started.** The project lead will
review Phase 2 before continuing.
