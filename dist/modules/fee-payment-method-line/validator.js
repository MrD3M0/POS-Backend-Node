"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeePaymentMethodLineCreate = exports.feePaymentMethodLineCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.feePaymentMethodLineCreateInputSchema = zod_1.z.object({
    feePaymentId: zod_1.z.string().uuid("Invalid Fee Payment ID format"),
    paymentMethodId: zod_1.z.string().uuid("Invalid Payment Method ID format"),
    amount: zod_1.z.string().min(1, "Amount is required"),
    referenceNo: zod_1.z.string().optional(),
    bankName: zod_1.z.string().optional(),
});
const validateFeePaymentMethodLineCreate = (data) => {
    return exports.feePaymentMethodLineCreateInputSchema.parse(data);
};
exports.validateFeePaymentMethodLineCreate = validateFeePaymentMethodLineCreate;
