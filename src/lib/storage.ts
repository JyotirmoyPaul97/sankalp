/**
 * KAUSHAL DRISHTI — Phase 2 File Storage Abstraction
 * ---------------------------------------------------------------------
 * Stores uploaded ingestion files under storage/ with:
 *  - safe filenames (sanitized, no path traversal)
 *  - SHA-256 checksums (duplicate-upload detection)
 *  - file-type allow-list (.csv, .json only in Phase 2)
 *  - size limits
 *
 * Metadata is persisted in the `uploaded_files` table; the physical
 * file lives on disk. Swap for S3/MinIO later by replacing this module.
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const STORAGE_ROOT = path.resolve(process.cwd(), "storage");
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_EXTENSIONS = [".csv", ".json"] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

// Reject any file whose extension hints at executable content.
const BLOCKED_EXTENSIONS = [
  ".exe", ".sh", ".py", ".js", ".php", ".bat", ".cmd", ".jar",
  ".bin", ".msi", ".dll", ".so", ".dylib", ".rb", ".pl",
];

export interface StoredFile {
  fileName: string;
  fileType: string; // extension without dot, e.g. "csv"
  storageKey: string; // relative path under storage/
  sizeBytes: number;
  checksum: string; // sha-256 hex
  absolutePath: string;
}

export class StorageError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/** Sanitize a client filename: strip path separators, drop dangerous chars. */
export function sanitizeFileName(name: string): string {
  // Take only the basename (defends against ../ and absolute paths)
  const base = path.basename(name || "upload");
  // Replace anything that isn't a-z A-Z 0-9 . _ -
  const clean = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  // Collapse multiple underscores / dots
  const collapsed = clean.replace(/_{2,}/g, "_").replace(/\.{2,}/g, ".");
  return collapsed.slice(0, 180) || "upload";
}

/** Validate file type by extension. Do NOT trust client MIME alone. */
export function validateFileType(fileName: string): AllowedExtension {
  const lower = fileName.toLowerCase();
  if (BLOCKED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    throw new StorageError("FILE_TYPE_BLOCKED", `File type not allowed: ${fileName}`);
  }
  for (const ext of ALLOWED_EXTENSIONS) {
    if (lower.endsWith(ext)) return ext;
  }
  throw new StorageError(
    "FILE_TYPE_NOT_ALLOWED",
    `Only .csv and .json files are accepted in Phase 2 (got ${fileName})`,
  );
}

export function validateFileSize(bytes: number): void {
  if (bytes <= 0) throw new StorageError("FILE_EMPTY", "File is empty");
  if (bytes > MAX_FILE_BYTES) {
    throw new StorageError(
      "FILE_TOO_LARGE",
      `File exceeds the 25 MB upload limit (${(bytes / 1024 / 1024).toFixed(1)} MB)`,
    );
  }
}

/** Compute SHA-256 of a buffer. */
export function sha256(buf: Buffer | string): string {
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * Persist an uploaded file to disk under storage/ingestion/<YYYY>/<MM>/<cuid>.<ext>
 * Returns metadata for DB storage. Callers persist the metadata row.
 */
export async function storeUpload(
  fileName: string,
  content: Buffer,
): Promise<StoredFile> {
  const ext = validateFileType(fileName);
  validateFileSize(content.byteLength);
  const safeName = sanitizeFileName(fileName);

  const now = new Date();
  const yyyy = now.getUTCFullYear().toString();
  const mm = (now.getUTCMonth() + 1).toString().padStart(2, "0");
  const dir = path.join("ingestion", yyyy, mm);
  const absDir = path.join(STORAGE_ROOT, dir);
  await fs.mkdir(absDir, { recursive: true });

  const checksum = sha256(content);
  // Use checksum prefix as filename to dedupe identical files on disk
  // (metadata row still distinct per upload).
  const uniqueName = `${checksum.slice(0, 16)}.${ext}`;
  const storageKey = path.join(dir, uniqueName);
  const absPath = path.join(STORAGE_ROOT, storageKey);

  // Write only if not already present (idempotent on disk)
  try {
    await fs.access(absPath);
  } catch {
    await fs.writeFile(absPath, content, { mode: 0o640 });
  }

  return {
    fileName: safeName,
    fileType: ext,
    storageKey,
    sizeBytes: content.byteLength,
    checksum,
    absolutePath: absPath,
  };
}

/** Read a stored file back as a UTF-8 string. */
export async function readStoredFile(storageKey: string): Promise<string> {
  const abs = path.resolve(STORAGE_ROOT, storageKey);
  // Guard against path traversal: ensure resolved path stays under root
  if (!abs.startsWith(STORAGE_ROOT + path.sep) && abs !== STORAGE_ROOT) {
    throw new StorageError("PATH_TRAVERSAL", "Illegal storage path");
  }
  return fs.readFile(abs, "utf8");
}
