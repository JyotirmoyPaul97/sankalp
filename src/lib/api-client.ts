/**
 * KAUSHAL DRISHTI — Thin API client for the Phase 1 frontend.
 * Talks to /api/v1/* using relative URLs through the gateway.
 * Handles the { success, data | error } envelope.
 */
import type { Paginated } from "@/types/domain";

const TOKEN_KEY = "kd_token";
const USER_KEY = "kd_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  code: string;
  details?: unknown;
  status: number;
  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

interface ApiSuccess<T> { success: true; data: T }
interface ApiFailure { success: false; error: { code: string; message: string; details?: unknown } }

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(path, { ...options, headers });
  } catch {
    throw new ApiError(
      "UNAVAILABLE",
      "Unable to reach the server. Please check your connection.",
      503,
    );
  }

  let json: ApiSuccess<T> | ApiFailure | null = null;
  try {
    json = (await res.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    throw new ApiError("INTERNAL_ERROR", "Unexpected server response.", res.status);
  }

  if (!json.success) {
    throw new ApiError(json.error.code, json.error.message, res.status, json.error.details);
  }
  return json.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};

export async function list<T>(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(path, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  return api.get<Paginated<T>>(url.pathname + url.search);
}
