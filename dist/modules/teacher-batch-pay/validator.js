"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTeacherBatchPayUpdate = exports.validateTeacherBatchPayCreate = exports.teacherBatchPayUpdateInputSchema = exports.teacherBatchPayCreateInputSchema = void 0;
const zod_1 = require("zod");
const bs_date_1 = require("@/utils/bs-date");
const decimalSchema = zod_1.z
    .union([zod_1.z.string().min(1), zod_1.z.number()])
    .transform((v) => String(v))
    .refine((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 && n <= 99999999.99;
}, "Rate must be a positive number <= 99999999.99");
const bsDateString = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD (BS)")
    .refine((v) => {
    try {
        (0, bs_date_1.assertBsDateString)(v);
        return true;
    }
    catch {
        return false;
    }
}, "Must be a valid BS date");
const teacherBatchPayShape = {
    teachingAssignmentId: zod_1.z.string().uuid("Invalid Teaching Assignment ID format"),
    ratePerCreditHour: decimalSchema.optional().nullable(),
    fixedMonthlyAmount: decimalSchema.optional().nullable(),
    effectiveFromBs: bsDateString,
    effectiveToBs: bsDateString.optional().nullable(),
};
exports.teacherBatchPayCreateInputSchema = zod_1.z.object(teacherBatchPayShape).superRefine((data, ctx) => {
    // Exactly one of ratePerCreditHour / fixedMonthlyAmount.
    const hasFixed = data.fixedMonthlyAmount !== undefined && data.fixedMonthlyAmount !== null;
    const hasHourly = data.ratePerCreditHour !== undefined && data.ratePerCreditHour !== null;
    if (hasFixed && hasHourly) {
        ctx.addIssue({
            code: "custom",
            path: ["fixedMonthlyAmount"],
            message: "Provide exactly one of ratePerCreditHour or fixedMonthlyAmount, not both",
        });
    }
    else if (!hasFixed && !hasHourly) {
        ctx.addIssue({
            code: "custom",
            path: ["fixedMonthlyAmount"],
            message: "Provide exactly one of ratePerCreditHour or fixedMonthlyAmount",
        });
    }
    if (data.effectiveToBs && data.effectiveToBs < data.effectiveFromBs) {
        ctx.addIssue({
            code: "custom",
            path: ["effectiveToBs"],
            message: "effectiveToBs must be on or after effectiveFromBs",
        });
    }
});
// NOTE: .partial() cannot be applied to a schema with object refinements
// (zod throws at import time), so the update schema reuses the base shape.
// The exactly-one rule is re-checked against merged values in the service.
exports.teacherBatchPayUpdateInputSchema = zod_1.z.object(teacherBatchPayShape).partial();
const validateTeacherBatchPayCreate = (data) => {
    return exports.teacherBatchPayCreateInputSchema.parse(data);
};
exports.validateTeacherBatchPayCreate = validateTeacherBatchPayCreate;
const validateTeacherBatchPayUpdate = (data) => {
    return exports.teacherBatchPayUpdateInputSchema.parse(data);
};
exports.validateTeacherBatchPayUpdate = validateTeacherBatchPayUpdate;
