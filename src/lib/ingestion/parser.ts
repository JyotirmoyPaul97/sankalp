/**
 * KAUSHAL DRISHTI — Phase 2 File Parser
 * Parses CSV and JSON uploads into a uniform array of raw records.
 * No external dependencies — minimal CSV parser handles quoted fields.
 */

export interface ParsedFile {
  records: Record<string, unknown>[];
  fileType: "csv" | "json";
  rowCount: number;
}

export function parseCsv(text: string): Record<string, unknown>[] {
  // Strip BOM if present
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows = parseCsvRows(clean);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  const out: Record<string, unknown>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.length === 1 && cells[0].trim() === "") continue; // skip blank lines
    const obj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      obj[h] = cells[idx] ?? "";
    });
    out.push(obj);
  }
  return out;
}

/** Minimal RFC-4180-ish CSV row parser supporting quoted fields + escaped quotes. */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (ch === "\r") { /* ignore — handle \r\n */ }
      else { field += ch; }
    }
  }
  // last field
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

export function parseJson(text: string): Record<string, unknown>[] {
  const data = JSON.parse(text);
  if (Array.isArray(data)) {
    return data.map((item) => (item && typeof item === "object" ? item as Record<string, unknown> : { value: item }));
  }
  if (data && typeof data === "object") {
    // Accept { records: [...] } or { data: [...] } wrappers
    const wrapped = data as { records?: unknown[]; data?: unknown[] };
    if (Array.isArray(wrapped.records)) return wrapped.records as Record<string, unknown>[];
    if (Array.isArray(wrapped.data)) return wrapped.data as Record<string, unknown>[];
    return [data as Record<string, unknown>];
  }
  throw new Error("JSON must be an array of records or an object with a records array");
}

export function parseUpload(text: string, fileType: "csv" | "json"): ParsedFile {
  if (fileType === "json") {
    const records = parseJson(text);
    return { records, fileType, rowCount: records.length };
  }
  const records = parseCsv(text);
  return { records, fileType, rowCount: records.length };
}
