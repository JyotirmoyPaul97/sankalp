import { db } from "@/lib/db";
import { ok, paginated, fail, parsePagination } from "@/lib/api";
import type { EntityType } from "@/lib/ingestion/vocab";

/**
 * GET /api/v1/records/[entity]?page=1&pageSize=20&search=…
 * Generic data-explorer across ingested evidence tables.
 * entity ∈ { job_posting, employer_survey, industry_consultation,
 *            sector_growth, placement_outcome, technology_trend }
 */
const ENTITY_TABLES: Record<string, { model: keyof typeof db; searchFields: string[] }> = {
  job_posting: { model: "jobPosting", searchFields: ["employerName", "roleTitle", "districtName"] },
  employer_survey: { model: "employerSurvey", searchFields: ["employerName", "roleTitle"] },
  industry_consultation: { model: "industryConsultation", searchFields: ["organization", "sectorName", "keyFindings"] },
  sector_growth: { model: "sectorGrowth", searchFields: ["sectorName", "geography", "period"] },
  placement_outcome: { model: "placementOutcome", searchFields: ["courseName", "institutionName", "period"] },
  technology_trend: { model: "technologyTrend", searchFields: ["technology", "sectorName"] },
};

export async function GET(req: Request, ctx: { params: Promise<{ entity: string }> }) {
  const { entity } = await ctx.params;
  const cfg = ENTITY_TABLES[entity];
  if (!cfg) return fail("BAD_REQUEST", `Unknown entity '${entity}'. Valid: ${Object.keys(ENTITY_TABLES).join(", ")}`);

  const { page, pageSize, skip, search } = parsePagination(req);
  const url = new URL(req.url);
  const dataStatus = url.searchParams.get("dataStatus") || undefined;
  const batchId = url.searchParams.get("batchId") || undefined;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = cfg.searchFields.map((f) => ({ [f]: { contains: search } }));
  }
  if (dataStatus) where.dataStatus = dataStatus;
  if (batchId) where.batchId = batchId;

  const model = db[cfg.model] as {
    findMany: (a: unknown) => Promise<unknown[]>;
    count: (a: unknown) => Promise<number>;
  };

  const [items, total] = await Promise.all([
    model.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    model.count({ where }),
  ]);

  return paginated({
    items: items as Record<string, unknown>[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export type { EntityType };
