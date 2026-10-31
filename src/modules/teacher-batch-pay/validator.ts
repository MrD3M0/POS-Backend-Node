import { z } from "zod";

const decimalSchema = z
  .number()
  .positive("Rate must be positive")
  .max(99999999.99, "Amount is too large");

export const teacherBatchPayCreateInputSchema = z.object({
  teachingAssignmentId: z.string().uuid("Invalid Teaching Assignment ID format"),
  ratePerCreditHour: decimalSchema.optional().nullable(),
  fixedMonthlyAmount: decimalSchema.optional().nullable(),
  effectiveFromBs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  effectiveToBs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
});

export const teacherBatchPayUpdateInputSchema = teacherBatchPayCreateInputSchema.partial();

export type TeacherBatchPayCreateInput = z.infer<typeof teacherBatchPayCreateInputSchema>;
export type TeacherBatchPayUpdateInput = z.infer<typeof teacherBatchPayUpdateInputSchema>;

export const validateTeacherBatchPayCreate = (data: unknown) => {
  return teacherBatchPayCreateInputSchema.parse(data);
};

export const validateTeacherBatchPayUpdate = (data: unknown) => {
  return teacherBatchPayUpdateInputSchema.parse(data);
};