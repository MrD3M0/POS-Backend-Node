"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePaymentMethodUpdate = exports.validatePaymentMethodCreate = exports.paymentMethodUpdateInputSchema = exports.paymentMethodCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.paymentMethodCreateInputSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, "Name is required").max(255),
    code: zod_1.z.string().trim().min(1, "Code is required").max(255),
    accountId: zod_1.z.string().uuid("Invalid Account ID format").optional().nullable(),
    isActive: zod_1.z.boolean().optional(),
});
exports.paymentMethodUpdateInputSchema = exports.paymentMethodCreateInputSchema.partial();
const validatePaymentMethodCreate = (data) => exports.paymentMethodCreateInputSchema.parse(data);
exports.validatePaymentMethodCreate = validatePaymentMethodCreate;
const validatePaymentMethodUpdate = (data) => exports.paymentMethodUpdateInputSchema.parse(data);
exports.validatePaymentMethodUpdate = validatePaymentMethodUpdate;
