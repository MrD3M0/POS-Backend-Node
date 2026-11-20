"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePayslipItemCreate = exports.payslipItemCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.payslipItemCreateInputSchema = zod_1.z.object({
    payslipId: zod_1.z.string().uuid("Invalid Payslip ID format"),
    componentId: zod_1.z.string().uuid("Invalid Salary Component ID format").optional().nullable(),
    description: zod_1.z.string().min(1, "Description is required"),
    amount: zod_1.z
        .union([zod_1.z.string().min(1), zod_1.z.number()])
        .transform((v) => String(v)),
    isDeduction: zod_1.z.boolean().optional().default(false),
    isEmployerContribution: zod_1.z.boolean().optional().default(false),
});
const validatePayslipItemCreate = (data) => {
    return exports.payslipItemCreateInputSchema.parse(data);
};
exports.validatePayslipItemCreate = validatePayslipItemCreate;
