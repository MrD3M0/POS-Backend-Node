"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePayslipUpdate = exports.validatePayslipCreate = exports.payslipUpdateInputSchema = exports.payslipCreateInputSchema = void 0;
const zod_1 = require("zod");
const decimalLike = zod_1.z
    .union([zod_1.z.string().min(1), zod_1.z.number()])
    .transform((v) => String(v));
exports.payslipCreateInputSchema = zod_1.z.object({
    payslipNo: zod_1.z.string().min(1, "Payslip number is required"),
    payrollId: zod_1.z.string().uuid("Invalid Payroll ID format"),
    employeeId: zod_1.z.string().uuid("Invalid Employee ID format"),
    paymentMethodId: zod_1.z.string().uuid("Invalid Payment Method ID format").optional().nullable(),
    presentDays: decimalLike,
    halfDays: zod_1.z.coerce.number().int().min(0),
    paidLeaveDays: zod_1.z.coerce.number().int().min(0),
    unpaidLeaveDays: zod_1.z.coerce.number().int().min(0),
    absentDays: zod_1.z.coerce.number().int().min(0),
    basicSalary: decimalLike,
    attendanceDeduction: decimalLike.optional().default("0"),
    totalAllowance: decimalLike.optional().default("0"),
    teachingPay: decimalLike.optional().default("0"),
    grossPay: decimalLike,
    totalDeduction: decimalLike,
    taxAmount: decimalLike.optional().default("0"),
    netPay: decimalLike,
    paidDateBs: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Paid date must be YYYY-MM-DD (BS)")
        .optional()
        .nullable(),
});
exports.payslipUpdateInputSchema = exports.payslipCreateInputSchema.partial();
const validatePayslipCreate = (data) => exports.payslipCreateInputSchema.parse(data);
exports.validatePayslipCreate = validatePayslipCreate;
const validatePayslipUpdate = (data) => exports.payslipUpdateInputSchema.parse(data);
exports.validatePayslipUpdate = validatePayslipUpdate;
