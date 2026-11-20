"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStudentFeeItemUpdate = exports.validateStudentFeeItemCreate = exports.studentFeeItemUpdateInputSchema = exports.studentFeeItemCreateInputSchema = void 0;
const zod_1 = require("zod");
const money_1 = require("@/lib/money");
const bsDateSchema = (field) => zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${field} must be a BS date YYYY-MM-DD`);
// netAmount is computed server-side (amount - discountAmount) and is not
// accepted from the client.
const baseItemSchema = zod_1.z.object({
    studentFeeId: zod_1.z.string().uuid("Invalid Student Fee ID format"),
    feeHeadId: zod_1.z.string().uuid("Invalid Fee Head ID format"),
    feeStructureItemId: zod_1.z
        .string()
        .uuid("Invalid Fee Structure Item ID format")
        .optional()
        .nullable(),
    termNumber: zod_1.z.number().int().min(1).optional().nullable(),
    description: zod_1.z.string().max(500).optional(),
    amount: money_1.positiveMoneySchema,
    discountAmount: money_1.nonNegativeMoneySchema.optional(),
    discountReason: zod_1.z.string().trim().max(500).optional(),
    isSkipped: zod_1.z.boolean().optional(),
    skipReason: zod_1.z.string().trim().max(500).optional(),
    dueDateBs: bsDateSchema("dueDateBs").optional(),
});
exports.studentFeeItemCreateInputSchema = baseItemSchema;
exports.studentFeeItemUpdateInputSchema = baseItemSchema
    .omit({
    studentFeeId: true,
    feeHeadId: true,
    feeStructureItemId: true,
    termNumber: true,
})
    .partial();
const validateStudentFeeItemCreate = (data) => {
    return exports.studentFeeItemCreateInputSchema.parse(data);
};
exports.validateStudentFeeItemCreate = validateStudentFeeItemCreate;
const validateStudentFeeItemUpdate = (data) => {
    return exports.studentFeeItemUpdateInputSchema.parse(data);
};
exports.validateStudentFeeItemUpdate = validateStudentFeeItemUpdate;
