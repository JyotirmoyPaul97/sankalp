import { z } from "zod";
import { db } from "@/lib/db";
import { ok, paginated, fail, parsePagination, handlePrismaError } from "@/lib/api";

const EmployerSchema = z.object({
  name: z.string().min(1).max(160),
  industrySectorId: z.string().optional(),
  districtId: z.string().optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal("")),
  sizeCategory: z.enum(["MICRO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]).default("MEDIUM"),
  isVerified: z.boolean().default(false),
});

export async function GET(req: Request) {
  const { page, pageSize, skip, search } = parsePagination(req);
  const url = new URL(req.url);
  const districtId = url.searchParams.get("districtId") || undefined;
  const sectorId = url.searchParams.get("sectorId") || undefined;
  const where = {
    ...(search ? { OR: [{ name: { contains: search } }] } : {}),
    ...(districtId ? { districtId } : {}),
    ...(sectorId ? { industrySectorId: sectorId } : {}),
  };
  try {
    const [items, total] = await Promise.all([
      db.employer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
        include: {
          industrySector: true,
          district: true,
          _count: { select: { employerRoles: true } },
        },
      }),
      db.employer.count({ where }),
    ]);
    return paginated({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (e) { return handlePrismaError(e); }
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return fail("BAD_REQUEST", "Invalid JSON body"); }
  const parsed = EmployerSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
  const { website, ...rest } = parsed.data;
  const data = { ...rest, website: website || null };
  try {
    return ok(await db.employer.create({ data, include: { industrySector: true, district: true } }));
  } catch (e) { return handlePrismaError(e); }
}
