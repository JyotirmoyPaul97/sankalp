/**
 * KAUSHAL DRISHTI — Phase 1 authentication foundation.
 *
 * This is a deliberately lightweight JWT-style foundation. It is NOT
 * enterprise SSO. The architecture is shaped so Keycloak / OAuth2 can
 * replace this module later without touching the API routes or UI.
 *
 * Phase 1 behaviour:
 *  - Demo users live in the `users` table (seeded).
 *  - On login we issue a signed token (HMAC SHA-256 using JWT_SECRET).
 *  - The frontend stores the token and the user profile in localStorage.
 *  - Protected routes check `Authorization: Bearer <token>`.
 *
 * Replace this module wholesale when wiring Keycloak/OAuth2.
 */

import { db } from "@/lib/db";

export const PHASE1_ROLES = [
  "STATE_ADMIN",
  "DISTRICT_PLANNER",
  "TRAINING_PROVIDER",
  "EMPLOYER",
  "INSTITUTION",
  "TRAINER",
  "CANDIDATE",
  "AUDITOR",
] as const;
export type Phase1Role = (typeof PHASE1_ROLES)[number];

const ENC = new TextEncoder();

function base64Url(input: Uint8Array | string): string {
  const buf = typeof input === "string" ? ENC.encode(input) : input;
  let str = "";
  buf.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    ENC.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, ENC.encode(message));
  return new Uint8Array(sig);
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  name: string;
  role: Phase1Role;
  iat: number;
  exp: number;
}

const DEFAULT_TTL_SECONDS = 60 * 60 * 12; // 12h

export async function signToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): Promise<string> {
  const secret = process.env.JWT_SECRET || "kaushal-drishti-dev-secret";
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const full: JwtPayload = { ...payload, iat: now, exp: now + ttlSeconds };
  const body = base64Url(JSON.stringify(full));
  const signingInput = `${header}.${body}`;
  const sig = await hmacSha256(secret, signingInput);
  return `${signingInput}.${base64Url(sig)}`;
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  const secret = process.env.JWT_SECRET || "kaushal-drishti-dev-secret";
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expectedSig = await hmacSha256(secret, `${header}.${body}`);
  const providedSig = base64UrlDecode(sig);
  if (expectedSig.length !== providedSig.length) return null;
  let valid = true;
  for (let i = 0; i < expectedSig.length; i++) {
    if (expectedSig[i] !== providedSig[i]) valid = false;
  }
  if (!valid) return null;
  let payload: JwtPayload;
  try {
    const json = new TextDecoder().decode(base64UrlDecode(body));
    payload = JSON.parse(json);
  } catch {
    return null;
  }
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
  return payload;
}

/** Authenticate a demo user. Returns null if credentials don't match. */
export async function authenticateDemo(
  email: string,
  password: string,
): Promise<{ user: { id: string; email: string; name: string; role: Phase1Role } } | null> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.isActive) return null;
  // Phase 1 demo: passwordHash holds the demo password marker directly.
  if (user.passwordHash !== password) return null;
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Phase1Role,
    },
  };
}

/** Extract & verify a Bearer token from a request. */
export async function requireUser(req: Request): Promise<JwtPayload | null> {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  return verifyToken(m[1]);
}
