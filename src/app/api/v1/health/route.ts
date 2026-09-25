import { db } from "@/lib/db";
import { ok } from "@/lib/api";

/**
 * Versioned health check.
 * GET /api/v1/health
 */
export async function GET() {
  let database: "connected" | "disconnected" = "disconnected";
  try {
    await db.$queryRaw`SELECT 1`;
    database = "connected";
  } catch {
    database = "disconnected";
  }

  return ok({
    status: database === "connected" ? "healthy" : "degraded",
    environment: process.env.APP_ENV || "development",
    database,
    redis: "not-configured",
    service: "kaushal-drishti",
    version: "v1",
    phase: "phase-1",
    timestamp: new Date().toISOString(),
  });
}
