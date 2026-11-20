import type { Request } from "express";

type Query = {
  limit?: string | number;
  page?: string | number;
  search?: string;
};

export function queryFilters(req: Request) {
  const source = (req.query ?? req.body ?? {}) as Query;
  const { limit, page, search } = source;
  return { limit, page, search };
}

/**
 * Resolve a list limit. `-1` is the opt-out value: it means "all rows", so it
 * is preserved instead of being clamped to the default. Positive limits may be
 * capped (e.g. 200 for audit logs); `0`, `undefined` and junk fall back.
 */
export const resolvePageLimit = (
  value: unknown,
  fallback = 10,
  max?: number,
): number => {
  const parsed = Number(value);
  if (parsed === -1) return -1;
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return max ? Math.min(parsed, max) : parsed;
};

/** Prisma's `take` equivalent: `undefined` (no limit) when limit is -1. */
export const toPrismaTake = (limit: number): number | undefined =>
  limit === -1 ? undefined : limit;

/** SQL equivalent: `LIMIT ALL` when limit is -1. */
export const toSqlLimit = (limit: number): string =>
  limit === -1 ? "ALL" : String(limit);

// Calculate skip and take
export const calculateSkipAndTake = (
  page: number,
  limit: number,
): { skip: number; take: number | undefined } => {
  // "-1" means everything, so there is nothing to skip.
  const skip = limit === -1 ? 0 : (page - 1) * limit;
  const take = toPrismaTake(limit);

  return { skip, take };
};
