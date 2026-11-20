import { z } from "zod";
import { assertBsDateString } from "@/utils/bs-date";

const decimalSchema = z
  .union([z.string().min(1), z.number()])
  .transform((v) => String(v))
  .refine((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 && n <= 99999999.99;
  }, "Rate must be a positive number <= 99999999.99");

const bsDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD (BS)")
  .refine((v) => {
    try {
      assertBsDateString(v);
      return true;
    } catch {
      return false;
    }
  }, "Must be a valid BS date");

const teacherBatchPayShape = {
  teachingAssignmentId: z.string().uuid("Invalid Teaching Assignment ID format"),
  ratePerCreditHour: decimalSchema.optional().nullable(),
  fixedMonthlyAmount: decimalSchema.optional().nullable(),
  effectiveFromBs: bsDateString,
  effectiveToBs: bsDateString.optional().nullable(),
};

export const teacherBatchPayCreateInputSchema = z.object(teacherBatchPayShape).superRefine((data, ctx) => {
  // Exactly one of ratePerCreditHour / fixedMonthlyAmount.
  const hasFixed = data.fixedMonthlyAmount !== undefined && data.fixedMonthlyAmount !== null;
  const hasHourly = data.ratePerCreditHour !== undefined && data.ratePerCreditHour !== null;
  if (hasFixed && hasHourly) {
    ctx.addIssue({
      code: "custom",
      path: ["fixedMonthlyAmount"],
      message: "Provide exactly one of ratePerCreditHour or fixedMonthlyAmount, not both",
    });
  } else if (!hasFixed && !hasHourly) {
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
export const teacherBatchPayUpdateInputSchema = z.object(teacherBatchPayShape).partial();

export type TeacherBatchPayCreateInput = z.infer<typeof teacherBatchPayCreateInputSchema>;
export type TeacherBatchPayUpdateInput = z.infer<typeof teacherBatchPayUpdateInputSchema>;

export const validateTeacherBatchPayCreate = (data: unknown) => {
  return teacherBatchPayCreateInputSchema.parse(data);
};

export const validateTeacherBatchPayUpdate = (data: unknown) => {
  return teacherBatchPayUpdateInputSchema.parse(data);
};
