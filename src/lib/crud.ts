/**
 * Lightweight CRUD helpers shared by entity route handlers.
 * Keeps the API contract consistent and the route files tiny.
 */
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, paginated, fail, parsePagination, handlePrismaError } from "@/lib/api";

export type ListArgs = {
  page: number;
  pageSize: number;
  skip: number;
  search?: string;
};

export interface CrudConfig<TWhereInput, TCreateInput, TOrderBy> {
  model: {
    count: (args?: { where?: TWhereInput }) => Promise<number>;
    findMany: (args: {
      where?: TWhereInput;
      skip?: number;
      take?: number;
      orderBy?: TOrderBy;
      include?: Record<string, unknown>;
    }) => Promise<unknown[]>;
    findUnique: (args: { where: { id: string }; include?: Record<string, unknown> }) => Promise<unknown>;
    findFirst: (args: { where?: TWhereInput }) => Promise<unknown>;
    create: (args: { data: TCreateInput; include?: Record<string, unknown> }) => Promise<unknown>;
    update: (args: { where: { id: string }; data: Partial<TCreateInput>; include?: Record<string, unknown> }) => Promise<unknown>;
  };
  /** Build a Prisma `where` clause from a search term. */
  search?: (term: string) => TWhereInput;
  /** Default ordering for list queries. */
  orderBy?: TOrderBy;
  /** Optional relations to include in every read. */
  include?: Record<string, unknown>;
}

/** Shared list handler with pagination + search. */
export function makeListHandler<TWhereInput, TCreateInput, TOrderBy>(
  cfg: CrudConfig<TWhereInput, TCreateInput, TOrderBy>,
) {
  return async (req: Request) => {
    const { page, pageSize, skip, search } = parsePagination(req);
    const where = search && cfg.search ? cfg.search(search) : ({} as TWhereInput);
    try {
      const [items, total] = await Promise.all([
        cfg.model.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: cfg.orderBy,
          include: cfg.include,
        }) as Promise<unknown[]>,
        cfg.model.count({ where }),
      ]);
      return paginated({
        items,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      });
    } catch (e) {
      return handlePrismaError(e);
    }
  };
}

/** Shared get-by-id handler. */
export function makeGetHandler<TWhereInput, TCreateInput, TOrderBy>(
  cfg: CrudConfig<TWhereInput, TCreateInput, TOrderBy>,
) {
  return async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    try {
      const item = await cfg.model.findUnique({ where: { id }, include: cfg.include });
      if (!item) return fail("NOT_FOUND", "Resource not found");
      return ok(item);
    } catch (e) {
      return handlePrismaError(e);
    }
  };
}

/** Shared create handler. Validates with a Zod schema. */
export function makeCreateHandler<TWhereInput, TCreateInput, TOrderBy, S>(
  cfg: CrudConfig<TWhereInput, TCreateInput, TOrderBy>,
  schema: { safeParse: (x: unknown) => { success: true; data: S } | { success: false; error: { flatten: () => unknown } } },
  toData: (input: S) => TCreateInput,
) {
  return async (req: Request) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail("BAD_REQUEST", "Invalid JSON body");
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
    }
    try {
      const created = await cfg.model.create({
        data: toData(parsed.data as S),
        include: cfg.include,
      });
      return ok(created);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        return handlePrismaError(e);
      }
      return handlePrismaError(e);
    }
  };
}

/** Shared update (PUT) handler. */
export function makeUpdateHandler<TWhereInput, TCreateInput, TOrderBy, S>(
  cfg: CrudConfig<TWhereInput, TCreateInput, TOrderBy>,
  schema: { safeParse: (x: unknown) => { success: true; data: S } | { success: false; error: { flatten: () => unknown } } },
  toData: (input: S) => Partial<TCreateInput>,
) {
  return async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail("BAD_REQUEST", "Invalid JSON body");
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten());
    }
    try {
      const updated = await cfg.model.update({
        where: { id },
        data: toData(parsed.data as S),
        include: cfg.include,
      });
      return ok(updated);
    } catch (e) {
      return handlePrismaError(e);
    }
  };
}
