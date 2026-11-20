"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeePaymentCancel = exports.validateFeePaymentCreate = exports.feePaymentCancelInputSchema = exports.feePaymentCreateInputSchema = void 0;
const zod_1 = require("zod");
const money_1 = require("@/lib/money");
const methodLineSchema = zod_1.z.object({
    paymentMethodId: zod_1.z.string().uuid("Invalid Payment Method ID format"),
    amount: money_1.positiveMoneySchema,
    referenceNo: zod_1.z.string().max(255).optional(),
    bankName: zod_1.z.string().max(255).optional(),
});
const allocationSchema = zod_1.z.object({
    studentFeeItemId: zod_1.z.string().uuid("Invalid Student Fee Item ID format"),
    feeInstallmentId: zod_1.z.string().uuid("Invalid Fee Installment ID format").optional().nullable(),
    amount: money_1.positiveMoneySchema,
});
exports.feePaymentCreateInputSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid Student ID format"),
    fiscalYearId: zod_1.z.string().uuid("Invalid Fiscal Year ID format").optional(),
    paymentDateBs: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "paymentDateBs must be a BS date YYYY-MM-DD"),
    totalAmount: money_1.positiveMoneySchema,
    remarks: zod_1.z.string().max(1000).optional(),
    // receiptNo is generated server-side as RC-<fiscalYear>-<6-digit seq>.
    methodLines: zod_1.z
        .array(methodLineSchema)
        .min(1, "At least one payment method line is required"),
    allocations: zod_1.z
        .array(allocationSchema)
        .min(1, "At least one allocation is required"),
});
exports.feePaymentCancelInputSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(1, "Reason is required").optional(),
    cancelReason: zod_1.z.string().trim().min(1, "Reason is required").optional(),
}).superRefine((data, ctx) => {
    if (!data.reason && !data.cancelReason) {
        ctx.addIssue({ code: "custom", message: "Reason is required" });
    }
});
const validateFeePaymentCreate = (data) => {
    return exports.feePaymentCreateInputSchema.parse(data);
};
exports.validateFeePaymentCreate = validateFeePaymentCreate;
const validateFeePaymentCancel = (data) => {
    return exports.feePaymentCancelInputSchema.parse(data);
};
exports.validateFeePaymentCancel = validateFeePaymentCancel;
