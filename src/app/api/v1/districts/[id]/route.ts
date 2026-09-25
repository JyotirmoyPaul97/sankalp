import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handlePrismaError } from "@/lib/api";

const DistrictUpdateSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(64),
  stateCode: z.string().min(1).max(16),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const district = await db.district.findUnique({
      where: { id },
      include: {
        employers: { include: { industrySector: true } },
        institutions: true,
        _count: { select: { employers: true, institutions: true } },
      },
    });
    if (!district) return fail("NOT_FOUND", "District not found");
    return ok(district);
  } catch (e) {
    return handlePrismaError(e);
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("BAD_REQUEST", "Invalid JSON body");
  }
  const parsed = DistrictUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
  }
  try {
    const updated = await db.district.update({ where: { id }, data: parsed.data });
    return ok(updated);
  } catch (e) {
    return handlePrismaError(e);
  }
}
