#!/usr/bin/env python3
"""
KAUSHAL DRISHTI Phase 2 — Synthetic test dataset generator (task p2-2).

Generates 7 CSV datasets (A-G) for testing the JOB_POSTINGS ingestion
pipeline. ALL DATA IS SYNTHETIC DEMONSTRATION DATA — clearly labelled
with the "Demo <Name>" employer-prefix convention.

CSV column schema (header EXACTLY):
    source_record_id,employer,role,district,sector,posted_at,data_status
"""
from __future__ import annotations

import csv
import os
from datetime import date, timedelta

OUTPUT_DIR = "/home/z/my-project/data/synthetic"
os.makedirs(OUTPUT_DIR, exist_ok=True)

HEADER = [
    "source_record_id",
    "employer",
    "role",
    "district",
    "sector",
    "posted_at",
    "data_status",
]

# ---------------------------------------------------------------------------
# Reference value sets (the "valid" universe the ingestion pipeline accepts)
# ---------------------------------------------------------------------------
VALID_DISTRICTS = ["Pune", "Nashik", "Nagpur"]
UNKNOWN_DISTRICTS = ["Mumbai", "Aurangabad", "Thane"]
VALID_SECTORS = [
    "Advanced Manufacturing",
    "Automotive",
    "Information Technology",
]
VALID_STATUSES = ["REAL", "SYNTHETIC", "MODELLED", "DEMO", "UNKNOWN"]
INVALID_STATUSES = ["FAKE", "PRODUCTION", "LIVE", "TEST"]

# (employer_name, sector) — clearly synthetic ("Demo " prefix)
EMPLOYERS = [
    ("Demo Automation Works", "Advanced Manufacturing"),
    ("Demo Robotics Industries", "Advanced Manufacturing"),
    ("Demo Precision Manufacturing", "Advanced Manufacturing"),
    ("Demo Motors EV", "Automotive"),
    ("Demo Auto Components", "Automotive"),
    ("Demo EV Drive Systems", "Automotive"),
    ("Demo Software Solutions", "Information Technology"),
    ("Demo Digital Services", "Information Technology"),
    ("Demo Cloud Systems", "Information Technology"),
]

ROLES = [
    "Automation Engineer",
    "PLC Technician",
    "Robotics Technician",
    "Software Developer",
    "EV Technician",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def date_in_2026(i: int, total: int) -> str:
    """Spread `total` dates across 2026-01-15 .. 2026-09-20 inclusive."""
    start = date(2026, 1, 15)
    end = date(2026, 9, 20)
    span = (end - start).days  # 248
    offset = 0 if total <= 1 else int(span * (i / (total - 1)))
    return (start + timedelta(days=offset)).isoformat()


def rec(rid, employer, role, district, sector, posted_at, data_status):
    return [rid, employer, role, district, sector, posted_at, data_status]


def write_csv(filename: str, rows: list[list[str]]) -> tuple[str, int]:
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
        w.writerow(HEADER)
        for r in rows:
            w.writerow(r)
    return path, len(rows)


def pick(i: int, arr):
    return arr[i % len(arr)]


# ---------------------------------------------------------------------------
# Dataset A — 50 records, 100% valid (happy path)
# ---------------------------------------------------------------------------
def gen_dataset_a():
    rows = []
    n = 50
    for i in range(n):
        rid = f"JOB-A-{i+1:04d}"
        emp, sector = pick(i, EMPLOYERS)
        role = pick(i, ROLES)
        district = pick(i, VALID_DISTRICTS)
        posted = date_in_2026(i, n)
        rows.append(rec(rid, emp, role, district, sector, posted, "SYNTHETIC"))
    return rows


# ---------------------------------------------------------------------------
# Dataset B — 30 records, missing required fields
#   - rows 0..9  : missing `role`
#   - rows 10..14: missing `district`
#   - rows 15..19: missing `posted_at`
#   - rows 20..29: fully valid
# ---------------------------------------------------------------------------
def gen_dataset_b():
    rows = []
    n = 30
    for i in range(n):
        rid = f"JOB-B-{i+1:04d}"
        emp, sector = pick(i, EMPLOYERS)
        role = pick(i, ROLES)
        district = pick(i, VALID_DISTRICTS)
        posted = date_in_2026(i, n)
        rows.append(rec(rid, emp, role, district, sector, posted, "SYNTHETIC"))

    for i in range(10):          # blank `role`  -> 10 records
        rows[i][2] = ""
    for i in range(10, 15):       # blank `district` -> 5 records
        rows[i][3] = ""
    for i in range(15, 20):       # blank `posted_at` -> 5 records
        rows[i][5] = ""
    # rows 20..29 remain fully valid (10 records)
    return rows


# ---------------------------------------------------------------------------
# Dataset C — 40 records, duplicates
#   - 20 fully unique valid records
#   - 5 EXACT-duplicate pairs  (same source_record_id, identical data) -> 10 rows
#   - 5 COMPOUND-duplicate pairs (different source_record_id, identical
#     employer+role+district+posted_at fingerprint) -> 10 rows
# ---------------------------------------------------------------------------
def gen_dataset_c():
    rows = []
    counter = 0

    # 20 unique valid
    for i in range(20):
        counter += 1
        rid = f"JOB-C-{counter:04d}"
        emp, sector = pick(i, EMPLOYERS)
        role = pick(i, ROLES)
        district = pick(i, VALID_DISTRICTS)
        posted = date_in_2026(i, 30)
        rows.append(rec(rid, emp, role, district, sector, posted, "SYNTHETIC"))

    # 5 exact-duplicate pairs (5 unique IDs, each appears twice identically)
    for i in range(5):
        counter += 1
        rid = f"JOB-C-{counter:04d}"
        emp, sector = pick(i, EMPLOYERS)
        role = pick(i, ROLES)
        district = pick(i, VALID_DISTRICTS)
        posted = date_in_2026(20 + i, 30)
        row = rec(rid, emp, role, district, sector, posted, "SYNTHETIC")
        rows.append(row)
        rows.append(row.copy())  # EXACT duplicate

    # 5 compound-duplicate pairs (different IDs, identical fingerprint)
    for i in range(5):
        counter += 1
        rid1 = f"JOB-C-{counter:04d}"
        counter += 1
        rid2 = f"JOB-C-{counter:04d}"
        emp, sector = pick(i, EMPLOYERS)
        role = pick(i, ROLES)
        district = pick(i, VALID_DISTRICTS)
        posted = date_in_2026(25 + i, 30)
        rows.append(rec(rid1, emp, role, district, sector, posted, "SYNTHETIC"))
        rows.append(rec(rid2, emp, role, district, sector, posted, "SYNTHETIC"))

    return rows


# ---------------------------------------------------------------------------
# Dataset D — 25 records, invalid dates
#   - 8 records with malformed dates (various failure modes)
#   - 17 records valid
# ---------------------------------------------------------------------------
def gen_dataset_d():
    invalid_dates = [
        "2026-13-45",   # invalid month AND day
        "not-a-date",   # garbage string
        "2026/09/20",   # wrong separator (slash, not hyphen)
        "32-01-2026",   # day-first / wrong format
        "2026-02-30",   # Feb 30 does not exist
        "2026-00-15",   # month 0
        "2026-04-31",   # April has only 30 days
        "2026-13-01",   # month 13
    ]
    n_invalid = len(invalid_dates)  # 8
    n = 25
    rows = []
    for i in range(n):
        rid = f"JOB-D-{i+1:04d}"
        emp, sector = pick(i, EMPLOYERS)
        role = pick(i, ROLES)
        district = pick(i, VALID_DISTRICTS)
        if i < n_invalid:
            posted = invalid_dates[i]
        else:
            posted = date_in_2026(i - n_invalid, n - n_invalid)
        rows.append(rec(rid, emp, role, district, sector, posted, "SYNTHETIC"))
    return rows


# ---------------------------------------------------------------------------
# Dataset E — 25 records, unknown district
#   - 8 records use Mumbai / Aurangabad / Thane (NOT in the valid set)
#   - 17 records use valid Pune / Nashik / Nagpur
# ---------------------------------------------------------------------------
def gen_dataset_e():
    unknown = ["Mumbai", "Aurangabad", "Thane",
               "Mumbai", "Aurangabad", "Thane", "Mumbai", "Aurangabad"]
    n_unknown = len(unknown)  # 8
    n = 25
    rows = []
    for i in range(n):
        rid = f"JOB-E-{i+1:04d}"
        emp, sector = pick(i, EMPLOYERS)
        role = pick(i, ROLES)
        if i < n_unknown:
            district = unknown[i]
        else:
            district = pick(i, VALID_DISTRICTS)
        posted = date_in_2026(i, n)
        rows.append(rec(rid, emp, role, district, sector, posted, "SYNTHETIC"))
    return rows


# ---------------------------------------------------------------------------
# Dataset F — 25 records, invalid data_status
#   - 8 records with FAKE / PRODUCTION / LIVE / TEST
#   - 17 records with valid DEMO or SYNTHETIC
# ---------------------------------------------------------------------------
def gen_dataset_f():
    invalid = ["FAKE", "PRODUCTION", "LIVE", "TEST",
               "FAKE", "PRODUCTION", "LIVE", "TEST"]
    n_invalid = len(invalid)  # 8
    n = 25
    rows = []
    for i in range(n):
        rid = f"JOB-F-{i+1:04d}"
        emp, sector = pick(i, EMPLOYERS)
        role = pick(i, ROLES)
        district = pick(i, VALID_DISTRICTS)
        posted = date_in_2026(i, n)
        if i < n_invalid:
            status = invalid[i]
        else:
            status = "DEMO" if (i % 2 == 0) else "SYNTHETIC"
        rows.append(rec(rid, emp, role, district, sector, posted, status))
    return rows


# ---------------------------------------------------------------------------
# Dataset G — 60 records, mixed quality (~45 acceptable, ~15 problems)
#   - 45 fully valid records (3 of them later referenced as dupe sources)
#   - 3  missing `role`
#   - 3  invalid dates
#   - 3  unknown districts
#   - 3  invalid data_status
#   - 3  duplicate rows (2 exact + 1 compound)
# ---------------------------------------------------------------------------
def gen_dataset_g():
    invalid_dates_pool = ["2026-13-45", "not-a-date", "2026/09/20"]
    unknown_districts_pool = ["Mumbai", "Aurangabad", "Thane"]
    invalid_status_pool = ["FAKE", "PRODUCTION", "LIVE"]

    rows = []
    counter = 0
    base_for_dupe = []

    # 45 fully valid
    for i in range(45):
        counter += 1
        rid = f"JOB-G-{counter:04d}"
        emp, sector = pick(i, EMPLOYERS)
        role = pick(i, ROLES)
        district = pick(i, VALID_DISTRICTS)
        posted = date_in_2026(i, 45)
        r = rec(rid, emp, role, district, sector, posted, "SYNTHETIC")
        rows.append(r)
        if i < 3:
            base_for_dupe.append(r)

    # 3 missing `role` (rows 46..48)
    for j in range(3):
        counter += 1
        rid = f"JOB-G-{counter:04d}"
        i = 45 + j
        emp, sector = pick(i, EMPLOYERS)
        district = pick(i, VALID_DISTRICTS)
        posted = date_in_2026(i, 60)
        rows.append(rec(rid, emp, "", district, sector, posted, "SYNTHETIC"))

    # 3 invalid dates (rows 49..51)
    for j in range(3):
        counter += 1
        rid = f"JOB-G-{counter:04d}"
        i = 48 + j
        emp, sector = pick(i, EMPLOYERS)
        role = pick(i, ROLES)
        district = pick(i, VALID_DISTRICTS)
        posted = invalid_dates_pool[j]
        rows.append(rec(rid, emp, role, district, sector, posted, "SYNTHETIC"))

    # 3 unknown districts (rows 52..54)
    for j in range(3):
        counter += 1
        rid = f"JOB-G-{counter:04d}"
        i = 51 + j
        emp, sector = pick(i, EMPLOYERS)
        role = pick(i, ROLES)
        district = unknown_districts_pool[j]
        posted = date_in_2026(i, 60)
        rows.append(rec(rid, emp, role, district, sector, posted, "SYNTHETIC"))

    # 3 invalid data_status (rows 55..57)
    for j in range(3):
        counter += 1
        rid = f"JOB-G-{counter:04d}"
        i = 54 + j
        emp, sector = pick(i, EMPLOYERS)
        role = pick(i, ROLES)
        district = pick(i, VALID_DISTRICTS)
        posted = date_in_2026(i, 60)
        rows.append(rec(rid, emp, role, district, sector, posted, invalid_status_pool[j]))

    # 3 duplicate rows (rows 58..60)
    #   - 2 exact duplicates (same source_record_id, identical data) of base_for_dupe[0..1]
    #   - 1 compound duplicate (different source_record_id, identical fingerprint) of base_for_dupe[2]
    rows.append(base_for_dupe[0].copy())  # exact dupe 1
    rows.append(base_for_dupe[1].copy())  # exact dupe 2
    counter += 1
    rid = f"JOB-G-{counter:04d}"
    base = base_for_dupe[2]
    rows.append(rec(rid, base[1], base[2], base[3], base[4], base[5], base[6]))  # compound dupe

    return rows


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
def main():
    datasets = [
        ("dataset_a_valid.csv",            gen_dataset_a()),
        ("dataset_b_missing_fields.csv",   gen_dataset_b()),
        ("dataset_c_duplicates.csv",       gen_dataset_c()),
        ("dataset_d_invalid_dates.csv",    gen_dataset_d()),
        ("dataset_e_unknown_district.csv", gen_dataset_e()),
        ("dataset_f_invalid_status.csv",   gen_dataset_f()),
        ("dataset_g_mixed.csv",            gen_dataset_g()),
    ]
    print(f"{'file':<38}  {'rows':>4}")
    print("-" * 46)
    for name, rows in datasets:
        path, count = write_csv(name, rows)
        print(f"{name:<38}  {count:>4}")
    print("-" * 46)
    total = sum(len(r) for _, r in datasets)
    print(f"{'TOTAL':<38}  {total:>4}")


if __name__ == "__main__":
    main()
