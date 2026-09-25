import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "kaushal-drishti",
    phase: "phase-1",
    message: "KAUSHAL DRISHTI API. See /api/v1/health and /api/v1/meta.",
    docs: "/api/v1 (OpenAPI in later phase)",
  });
}
