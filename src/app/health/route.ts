import { db } from "@/lib/db";

/**
 * Root health — application + DB + (Redis placeholder) status.
 * GET /health
 */
export async function GET() {
  let database: "connected" | "disconnected" = "disconnected";
  try {
    await db.$queryRaw`SELECT 1`;
    database = "connected";
  } catch {
    database = "disconnected";
  }

  return Response.json({
    status: database === "connected" ? "healthy" : "degraded",
    environment: process.env.APP_ENV || "development",
    database,
    // Redis abstraction is established as an extension point in Phase 1;
    // not wired to a live Redis instance in this build.
    redis: "not-configured",
    service: "kaushal-drishti",
    phase: "phase-1",
    timestamp: new Date().toISOString(),
  });
}
