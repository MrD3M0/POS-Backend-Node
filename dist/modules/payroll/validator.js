"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePayrollPay = exports.validatePayrollUpdate = exports.validatePayrollCreate = exports.payrollPayInputSchema = exports.payrollUpdateInputSchema = exports.payrollCreateInputSchema = void 0;
const zod_1 = require("zod");
const bs_date_1 = require("@/utils/bs-date");
exports.payrollCreateInputSchema = zod_1.z.object({
    fiscalYearId: zod_1.z.string().uuid("Invalid Fiscal Year ID format"),
    yearBs: zod_1.z.coerce.number().int().min(2000).max(2099),
    monthBs: zod_1.z.coerce.number().int().min(1, "Month must be 1-12").max(12, "Month must be 1-12"),
    // Accepted for backwards compatibility but ALWAYS recomputed server-side
    // from src/utils/bs-date.ts so payrolls never silently use a wrong month length.
    totalDays: zod_1.z.coerce.number().int().min(1).max(62).optional(),
    remarks: zod_1.z.string().max(1000).optional().nullable(),
});
exports.payrollUpdateInputSchema = exports.payrollCreateInputSchema.partial();
exports.payrollPayInputSchema = zod_1.z.object({
    paidDateBs: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD (BS)")
        .refine((v) => {
        try {
            (0, bs_date_1.assertBsDateString)(v, "paidDateBs");
            return true;
        }
        catch {
            return false;
        }
    }, "paidDateBs must be a valid BS date"),
});
const validatePayrollCreate = (data) => exports.payrollCreateInputSchema.parse(data);
exports.validatePayrollCreate = validatePayrollCreate;
const validatePayrollUpdate = (data) => exports.payrollUpdateInputSchema.parse(data);
exports.validatePayrollUpdate = validatePayrollUpdate;
const validatePayrollPay = (data) => exports.payrollPayInputSchema.parse(data);
exports.validatePayrollPay = validatePayrollPay;
