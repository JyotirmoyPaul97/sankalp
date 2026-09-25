/**
 * KAUSHAL DRISHTI — Standardized API response envelope.
 *
 * Success: { success: true, data: T }
 * Error:   { success: false, error: { code, message, details? } }
 */

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR"
  | "UNAVAILABLE";

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorPayload;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const CODE_TO_STATUS: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  UNAVAILABLE: 503,
};

export function ok<T>(data: T, status: number = 200): Response {
  return Response.json({ success: true, data } satisfies ApiSuccess<T>, { status });
}

export function paginated<T>(payload: Paginated<T>, status: number = 200): Response {
  return Response.json({ success: true, data: payload } satisfies ApiSuccess<Paginated<T>>, {
    status,
  });
}

export function fail(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): Response {
  const status = CODE_TO_STATUS[code];
  return Response.json(
    { success: false, error: { code, message, details } } satisfies ApiFailure,
    { status },
  );
}

/** Parse pagination params from a URLSearchParams / Request URL. */
export function parsePagination(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20", 10) || 20),
  );
  const search = url.searchParams.get("search")?.trim() || undefined;
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, search };
}

/** Prisma known request errors map to 409 (unique constraint) or 422. */
export function handlePrismaError(e: unknown): Response {
  // PrismaClientKnownRequestError code shape: "P2002" (unique), "P2025" (not found)
  const err = e as { code?: string; meta?: { target?: string[] }; message?: string };
  if (err?.code === "P2002") {
    return fail(
      "CONFLICT",
      "Resource already exists",
      { target: err.meta?.target },
    );
  }
  if (err?.code === "P2025") {
    return fail("NOT_FOUND", "Resource not found");
  }
  return fail("INTERNAL_ERROR", "Unexpected database error");
}
