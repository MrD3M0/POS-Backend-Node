"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSkipAndTake = exports.toSqlLimit = exports.toPrismaTake = exports.resolvePageLimit = void 0;
exports.queryFilters = queryFilters;
function queryFilters(req) {
    const source = (req.query ?? req.body ?? {});
    const { limit, page, search } = source;
    return { limit, page, search };
}
/**
 * Resolve a list limit. `-1` is the opt-out value: it means "all rows", so it
 * is preserved instead of being clamped to the default. Positive limits may be
 * capped (e.g. 200 for audit logs); `0`, `undefined` and junk fall back.
 */
const resolvePageLimit = (value, fallback = 10, max) => {
    const parsed = Number(value);
    if (parsed === -1)
        return -1;
    if (!Number.isFinite(parsed) || parsed <= 0)
        return fallback;
    return max ? Math.min(parsed, max) : parsed;
};
exports.resolvePageLimit = resolvePageLimit;
/** Prisma's `take` equivalent: `undefined` (no limit) when limit is -1. */
const toPrismaTake = (limit) => limit === -1 ? undefined : limit;
exports.toPrismaTake = toPrismaTake;
/** SQL equivalent: `LIMIT ALL` when limit is -1. */
const toSqlLimit = (limit) => limit === -1 ? "ALL" : String(limit);
exports.toSqlLimit = toSqlLimit;
// Calculate skip and take
const calculateSkipAndTake = (page, limit) => {
    // "-1" means everything, so there is nothing to skip.
    const skip = limit === -1 ? 0 : (page - 1) * limit;
    const take = (0, exports.toPrismaTake)(limit);
    return { skip, take };
};
exports.calculateSkipAndTake = calculateSkipAndTake;
