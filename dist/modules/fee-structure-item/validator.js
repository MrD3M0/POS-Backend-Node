"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeeStructureItemCreate = exports.feeStructureItemCreateInputSchema = void 0;
const zod_1 = require("zod");
const money_1 = require("@/lib/money");
exports.feeStructureItemCreateInputSchema = zod_1.z.object({
    feeStructureId: zod_1.z.string().uuid("Invalid Fee Structure ID format"),
    feeHeadId: zod_1.z.string().uuid("Invalid Fee Head ID format"),
    // null = one-time fee (e.g. admission); a number = per-term fee.
    termNumber: zod_1.z.number().int().min(1).optional().nullable(),
    amount: money_1.positiveMoneySchema,
});
const validateFeeStructureItemCreate = (data) => {
    return exports.feeStructureItemCreateInputSchema.parse(data);
};
exports.validateFeeStructureItemCreate = validateFeeStructureItemCreate;
