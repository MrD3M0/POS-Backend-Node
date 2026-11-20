"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeePaymentAllocationCreate = exports.feePaymentAllocationCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.feePaymentAllocationCreateInputSchema = zod_1.z.object({
    feePaymentId: zod_1.z.string().uuid("Invalid Fee Payment ID format"),
    studentFeeItemId: zod_1.z.string().uuid("Invalid Student Fee Item ID format"),
    feeInstallmentId: zod_1.z.string().uuid("Invalid Fee Installment ID format").optional(),
    amount: zod_1.z.string().min(1, "Amount is required"),
});
const validateFeePaymentAllocationCreate = (data) => {
    return exports.feePaymentAllocationCreateInputSchema.parse(data);
};
exports.validateFeePaymentAllocationCreate = validateFeePaymentAllocationCreate;
