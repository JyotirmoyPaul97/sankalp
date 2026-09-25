# KAUSHAL DRISHTI Phase 2 — Synthetic Test Datasets

> ⚠️ **ALL DATA IN THIS DIRECTORY IS SYNTHETIC DEMONSTRATION DATA.**
> It is NOT real Maharashtra government data. It is NOT real labour-market data.
> Every employer name uses the clearly-synthetic `Demo <Name>` prefix so no record
> can be confused with a real organisation. These CSVs exist solely to exercise the
> Phase 2 ingestion pipeline (validation → dedup → quality → storage → audit).

This directory holds 7 hand-shaped CSV datasets (A through G) used to test the
JOB_POSTINGS ingestion pipeline. Each dataset is designed to probe exactly one
ingestion scenario, with dataset G combining all of them into a realistic mix.

A re-runnable Python generator (`_generate_datasets.py`) is included; running
`python3 _generate_datasets.py` regenerates all CSVs deterministically.

---

## CSV column schema (header row — EXACTLY this order, EXACTLY this spelling)

```
source_record_id,employer,role,district,sector,posted_at,data_status
```

| #  | column             | type   | required | example              | notes |
|----|--------------------|--------|----------|----------------------|-------|
| 1  | `source_record_id` | string | yes      | `JOB-A-0001`         | Unique per dataset. Pattern `JOB-<set>-<seq>` |
| 2  | `employer`         | string | yes      | `Demo Motors EV`     | Always prefixed with `Demo ` to flag synthetic origin |
| 3  | `role`             | string | yes      | `Automation Engineer`| One of the 5 Phase-1 job roles (see below) |
| 4  | `district`         | string | yes      | `Pune`               | One of the valid districts (see below) |
| 5  | `sector`           | string | yes      | `Automotive`         | One of the valid sectors (see below) |
| 6  | `posted_at`        | date   | yes      | `2026-01-15`         | ISO `YYYY-MM-DD` (zero-padded) |
| 7  | `data_status`      | enum   | yes      | `SYNTHETIC`          | One of the valid provenance values (see below) |

---

## Valid value universe (what the ingestion pipeline accepts)

### Valid districts (Phase 1 seeded set)
- `Pune`
- `Nashik`
- `Nagpur`

Any other district value (e.g. `Mumbai`, `Aurangabad`, `Thane`) is treated as
**unknown / rejected** by the pipeline. These appear in datasets E and G as
intentional negative-test cases.

### Valid sectors
- `Advanced Manufacturing`
- `Automotive`
- `Information Technology`

### Valid job roles (carried over from Phase 1 `job_roles` table)
- `Automation Engineer`
- `PLC Technician`
- `Robotics Technician`
- `Software Developer`
- `EV Technician`

### Valid `data_status` (provenance vocabulary)
- `REAL`
- `SYNTHETIC`
- `MODELLED`
- `DEMO`
- `UNKNOWN`

Any other value (e.g. `FAKE`, `PRODUCTION`, `LIVE`, `TEST`) is treated as
**invalid / rejected**. These appear in datasets F and G as negative-test cases.

### Date format
- `posted_at` MUST be ISO 8601 `YYYY-MM-DD` with zero-padded month/day
  (e.g. `2026-01-15`, NOT `2026-1-5`, `2026/01/15`, or `15-01-2026`).
- All test dates fall inside calendar year **2026**, spread across
  `2026-01-15` through `2026-09-20`.

---

## The 7 datasets

| File                              | Records | Tests | Expected pipeline outcome |
|-----------------------------------|--------:|-------|---------------------------|
| `dataset_a_valid.csv`             |  50 | 100% clean records (happy path)                       | All 50 accepted |
| `dataset_b_missing_fields.csv`    |  30 | Missing required fields (role/district/posted_at)     | 10 accepted, 20 rejected (10 missing role + 5 missing district + 5 missing posted_at) |
| `dataset_c_duplicates.csv`        |  40 | Exact + compound duplicates                            | 30 accepted, 10 rejected (5 exact-dupe rows + 5 compound-dupe rows) |
| `dataset_d_invalid_dates.csv`     |  25 | Malformed / out-of-range `posted_at`                  | 17 accepted, 8 rejected |
| `dataset_e_unknown_district.csv`   |  25 | District not in the valid set                         | 17 accepted, 8 rejected |
| `dataset_f_invalid_status.csv`    |  25 | `data_status` not in the valid vocabulary             | 17 accepted, 8 rejected |
| `dataset_g_mixed.csv`             |  60 | Realistic mix of every problem above                  | ~45 accepted, ~15 rejected |
| **TOTAL**                         | **255** | | |

### Dataset A — `dataset_a_valid.csv` — happy path
50 records, all valid. Every `district` ∈ {Pune, Nashik, Nagpur}, every
`data_status` = `SYNTHETIC`, every `posted_at` is a valid ISO date in 2026,
every `source_record_id` is unique. Used to confirm the pipeline ingests a
fully-clean file end-to-end without any rejections.

### Dataset B — `dataset_b_missing_fields.csv` — missing required fields
30 records. The first 10 have an empty `role` cell, the next 5 have an empty
`district`, the next 5 have an empty `posted_at`, and the final 10 are fully
valid. Exercises the pipeline's per-field required-ness / nullability checks.

### Dataset C — `dataset_c_duplicates.csv` — duplicates
40 records. Contains:
- **5 EXACT duplicate pairs** — same `source_record_id` appearing twice with
  byte-identical data (`JOB-C-0021`..`JOB-C-0025` each appear twice). These test
  primary-key-style dedup on `source_record_id`.
- **5 COMPOUND duplicate pairs** — *different* `source_record_id` but identical
  fingerprint across `employer + role + district + posted_at`
  (`JOB-C-0026/0027`, `0028/0029`, `0030/0031`, `0032/0033`, `0034/0035`).
  These test fingerprint-based dedup (the pipeline should flag the second of
  each pair as a semantic duplicate).
- 20 unique valid records.

### Dataset D — `dataset_d_invalid_dates.csv` — invalid dates
25 records. The first 8 carry malformed `posted_at` values that exercise the
pipeline's date parser / validator across several distinct failure modes:
- `2026-13-45` — invalid month AND day
- `not-a-date` — non-date garbage string
- `2026/09/20` — wrong separator (slash instead of hyphen)
- `32-01-2026` — day-first / wrong format
- `2026-02-30` — February 30 does not exist
- `2026-00-15` — month 0
- `2026-04-31` — April has only 30 days
- `2026-13-01` — month 13
The remaining 17 records have valid ISO dates.

### Dataset E — `dataset_e_unknown_district.csv` — unknown district
25 records. The first 8 use districts outside the valid Phase-1 set
(`Mumbai`, `Aurangabad`, `Thane` — each appearing multiple times). These should
be rejected by the district reference-integrity check. The remaining 17 use
valid Pune / Nashik / Nagpur.

### Dataset F — `dataset_f_invalid_status.csv` — invalid `data_status`
25 records. The first 8 carry `data_status` values outside the valid
provenance vocabulary (`FAKE`, `PRODUCTION`, `LIVE`, `TEST` — each appearing
twice). These should be rejected by the enum check. The remaining 17 alternate
between valid `DEMO` and `SYNTHETIC`.

### Dataset G — `dataset_g_mixed.csv` — realistic mixed quality
60 records — the closest analogue to a real incoming feed. Composition:
- 45 fully valid records (3 of which are later reused as dupe sources)
- 3 missing `role`
- 3 invalid dates (`2026-13-45`, `not-a-date`, `2026/09/20`)
- 3 unknown districts (`Mumbai`, `Aurangabad`, `Thane`)
- 3 invalid `data_status` (`FAKE`, `PRODUCTION`, `LIVE`)
- 3 duplicate rows (2 exact duplicates of `JOB-G-0001` / `JOB-G-0002`, plus 1
  compound duplicate of `JOB-G-0003` under the new id `JOB-G-0058`)

Roughly 45 acceptable + 15 problematic — a deliberate 25% reject rate that
mirrors typical real-world ingestion feeds.

---

## Notes for pipeline implementers

- The CSVs use Unix line endings (`\n`) and minimal quoting (`QUOTE_MINIMAL`).
  No field in any of these datasets contains a comma, so quotes are absent —
  but the pipeline should still handle quoted fields defensively.
- Each row has exactly 7 columns. A row with the wrong column count is itself
  a (separate) ingestion error not covered by these datasets; if you want to
  test that, add a manually-malformed row.
- `source_record_id` uniqueness is enforced *within* a dataset. The pipeline
  may also enforce uniqueness across the full historical table — Dataset C
  is the canonical test for that.
- The compound-duplicate fingerprint is `employer + role + district + posted_at`
  (i.e. sector and data_status are intentionally excluded). Adjust the
  pipeline's fingerprint rule if a different tuple is desired.
