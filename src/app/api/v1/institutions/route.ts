import { z } from "zod";
import { db } from "@/lib/db";
import { ok, paginated, fail, parsePagination, handlePrismaError } from "@/lib/api";

const InstitutionSchema = z.object({
  name: z.string().min(1).max(160),
  institutionType: z.string().min(1).max(80),
  districtId: z.string().optional(),
  description: z.string().max(2000).optional(),
  address: z.string().max(300).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const url = new URL(req.url);
  const districtId = url.searchParams.get("districtId") || undefined;
  const where = {
    ...(search ? { OR: [{ name: { contains: search } }, { institutionType: { contains: search } }] } : {}),
    ...(districtId ? { districtId } : {}),
  };
  try {
    const [items, total] = await Promise.all([
      db.institution.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
        include: { district: true, _count: { select: { courseInstitutions: true } } },
      }),
      db.institution.count({ where }),
    ]);
    return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (e) { return handlePrismaError(e); }
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return fail("BAD_REQUEST", "Invalid JSON body"); }
  const parsed = InstitutionSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
  try {
    return ok(await db.institution.create({ data: parsed.data, include: { district: true } }));
  } catch (e) { return handlePrismaError(e); }
}
