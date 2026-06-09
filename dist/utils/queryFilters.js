"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSkipAndTake = void 0;
exports.queryFilters = queryFilters;
function queryFilters(req) {
    const source = (req.query ?? req.body ?? {});
    const { limit, page, search } = source;
    return { limit, page, search };
}
// Calculate skip and take
const calculateSkipAndTake = (page, limit) => {
    // Calculate the skip and take
    const skip = limit === -1 ? 0 : (page - 1) * limit;
    const take = limit !== -1 ? limit : undefined;
    return { skip, take };
};
exports.calculateSkipAndTake = calculateSkipAndTake;
