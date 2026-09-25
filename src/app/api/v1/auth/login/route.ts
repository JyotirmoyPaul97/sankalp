import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { authenticateDemo, signToken } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

/**
 * POST /api/v1/auth/login
 * Phase 1 demo login. Returns a signed token + user profile.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("BAD_REQUEST", "Invalid JSON body");
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Email and password are required", parsed.error.flatten());
  }

  const { email, password } = parsed.data;
  const result = await authenticateDemo(email, password);
  if (!result) {
    return fail("UNAUTHORIZED", "Invalid credentials");
  }

  const token = await signToken({
    sub: result.user.id,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role,
  });

  // optional refresh: record nothing extra in Phase 1.
  void db;

  return ok({
    token,
    user: result.user,
    phase: "phase-1",
    environment: process.env.APP_ENV || "development",
  });
}
