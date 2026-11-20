"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeeInstallmentBulk = exports.validateFeeInstallmentCreate = exports.feeInstallmentBulkInputSchema = exports.feeInstallmentCreateInputSchema = void 0;
const zod_1 = require("zod");
const money_1 = require("@/lib/money");
const installmentInputSchema = zod_1.z.object({
    installmentNo: zod_1.z.coerce.number().int().min(1, "Installment number is required"),
    dueDateBs: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDateBs must be a BS date YYYY-MM-DD"),
    amount: money_1.positiveMoneySchema,
});
exports.feeInstallmentCreateInputSchema = zod_1.z.object({
    studentFeeItemId: zod_1.z.string().uuid("Invalid Student Fee Item ID format"),
    installmentNo: zod_1.z.coerce.number().int().min(1, "Installment number is required"),
    dueDateBs: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be a BS date YYYY-MM-DD"),
    amount: money_1.positiveMoneySchema,
});
exports.feeInstallmentBulkInputSchema = zod_1.z.object({
    studentFeeItemId: zod_1.z.string().uuid("Invalid Student Fee Item ID format"),
    installments: zod_1.z
        .array(installmentInputSchema)
        .min(1, "At least one installment is required"),
});
const validateFeeInstallmentCreate = (data) => {
    return exports.feeInstallmentCreateInputSchema.parse(data);
};
exports.validateFeeInstallmentCreate = validateFeeInstallmentCreate;
const validateFeeInstallmentBulk = (data) => {
    return exports.feeInstallmentBulkInputSchema.parse(data);
};
exports.validateFeeInstallmentBulk = validateFeeInstallmentBulk;
