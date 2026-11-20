"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeeStructureUpdate = exports.validateFeeStructureCreate = exports.feeStructureUpdateInputSchema = exports.feeStructureCreateInputSchema = void 0;
const zod_1 = require("zod");
const money_1 = require("@/lib/money");
const feeStructureItemInputSchema = zod_1.z.object({
    feeHeadId: zod_1.z.string().uuid("Invalid Fee Head ID format"),
    // null termNumber = one-time fee (e.g. admission); present = per-term fee.
    termNumber: zod_1.z.number().int().min(1).optional().nullable(),
    amount: money_1.positiveMoneySchema,
});
exports.feeStructureCreateInputSchema = zod_1.z.object({
    courseId: zod_1.z.string().uuid("Invalid Course ID format"),
    // null/absent = default structure for the course; set = batch override.
    batchId: zod_1.z.string().uuid("Invalid Batch ID format").optional().nullable(),
    name: zod_1.z.string().trim().min(1, "Name is required"),
    isActive: zod_1.z.boolean().optional(),
    items: zod_1.z.array(feeStructureItemInputSchema).optional(),
});
exports.feeStructureUpdateInputSchema = exports.feeStructureCreateInputSchema.partial();
const validateFeeStructureCreate = (data) => {
    return exports.feeStructureCreateInputSchema.parse(data);
};
exports.validateFeeStructureCreate = validateFeeStructureCreate;
const validateFeeStructureUpdate = (data) => {
    return exports.feeStructureUpdateInputSchema.parse(data);
};
exports.validateFeeStructureUpdate = validateFeeStructureUpdate;
