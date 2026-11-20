"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTaxSlabUpdate = exports.validateTaxSlabCreate = exports.taxSlabUpdateInputSchema = exports.taxSlabCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.taxSlabCreateInputSchema = zod_1.z.object({
    fiscalYearId: zod_1.z.string().uuid("Invalid Fiscal Year ID format"),
    isCouple: zod_1.z.boolean().default(false),
    fromAmount: zod_1.z.number().min(0, "From amount must be >= 0"),
    toAmount: zod_1.z.number().min(0, "To amount must be >= 0").optional().nullable(),
    ratePercent: zod_1.z.number().min(0, "Rate must be >= 0").max(100, "Rate must be <= 100"),
});
exports.taxSlabUpdateInputSchema = exports.taxSlabCreateInputSchema.partial();
const validateTaxSlabCreate = (data) => {
    return exports.taxSlabCreateInputSchema.parse(data);
};
exports.validateTaxSlabCreate = validateTaxSlabCreate;
const validateTaxSlabUpdate = (data) => {
    return exports.taxSlabUpdateInputSchema.parse(data);
};
exports.validateTaxSlabUpdate = validateTaxSlabUpdate;
