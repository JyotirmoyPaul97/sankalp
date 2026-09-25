/**
 * KAUSHAL DRISHTI — Phase 2 Normalization
 * ---------------------------------------------------------------------
 * Basic, deterministic normalization. NO semantic/ML normalization
 * (that is Phase 3). Operations:
 *  - whitespace trim + collapse
 *  - title-case where appropriate (employer/role/district names)
 *  - date normalization (accepts ISO + a few common variants → ISO)
 *  - numeric coercion
 *  - canonical enum values (uppercase controlled vocab)
 */
import { DATA_STATUS } from "./vocab";

export function normalizeWhitespace(s: unknown): string {
  if (s == null) return "";
  return String(s).replace(/\s+/g, " ").trim();
}

export function normalizeEnum(s: unknown): string {
  return normalizeWhitespace(s).toUpperCase().replace(/[-\s]/g, "_");
}

/** Title-case the first letter of each word; preserve known acronyms. */
const ACRONYMS = new Set([
  "PLC", "SCADA", "IOT", "IIOT", "EV", "IT", "SQL", "API", "BMS",
  "ERP", "MES", "CAD", "CAM", "CNC", "HR", "QA", "QC", "R&D",
]);

export function normalizeTitle(s: unknown): string {
  const clean = normalizeWhitespace(s);
  if (!clean) return "";
  return clean
    .split(" ")
    .map((word) => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      // Preserve all-caps multi-char tokens that look like codes (e.g. CRS-AUTO-01)
      if (/^[A-Z0-9-]+$/.test(word) && word.length > 1) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/** Normalize common period strings: " 2025-q3 " → "2025-Q3" */
export function normalizePeriod(s: unknown): string {
  return normalizeWhitespace(s).toUpperCase();
}

/**
 * Normalize a date string to ISO `YYYY-MM-DD`.
 * Accepts: YYYY-MM-DD, YYYY/MM/DD, DD-MM-YYYY, DD/MM/YYYY.
 * Returns null if the date is invalid (caller reports a validation error).
 */
export function normalizeDate(input: unknown): string | null {
  const raw = normalizeWhitespace(input);
  if (!raw) return null;

  // YYYY-MM-DD or YYYY/MM/DD
  let m = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return toISO(Number(y), Number(mo), Number(d));
  }
  // DD-MM-YYYY or DD/MM/YYYY
  m = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return toISO(Number(y), Number(mo), Number(d));
  }
  return null;
}

function toISO(y: number, mo: number, d: number): string | null {
  if (mo < 1 || mo > 12) return null;
  if (d < 1 || d > 31) return null;
  // Validate against an actual Date to catch 2026-02-30 etc.
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Normalize + validate a data_status value. Returns null if invalid. */
export function normalizeDataStatus(s: unknown): string | null {
  const v = normalizeEnum(s);
  return (DATA_STATUS as readonly string[]).includes(v) ? v : null;
}

/** Coerce to a non-negative integer, or null if invalid. */
export function normalizeInt(s: unknown): number | null {
  if (s == null || s === "") return null;
  const n = typeof s === "number" ? s : Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

export function normalizeFloat(s: unknown): number | null {
  if (s == null || s === "") return null;
  const n = typeof s === "number" ? s : Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}
