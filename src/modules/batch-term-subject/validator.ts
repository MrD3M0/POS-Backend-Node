import { z } from "zod";
import { Decimal } from "decimal.js";

const creditHourSchema = z.number().positive("Credit hour must be a positive number").max(999.9, "Credit hour is too large");

export const batchTermSubjectCreateInputSchema = z.object({
  batchTermId: z.string().uuid("Invalid BatchTerm ID format"),
  subjectId: z.string().uuid("Invalid Subject ID format"),
  creditHour: creditHourSchema,
  isElective: z.boolean().default(false),
});

export const batchTermSubjectUpdateInputSchema = batchTermSubjectCreateInputSchema.partial();

export type BatchTermSubjectCreateInput = z.infer<typeof batchTermSubjectCreateInputSchema>;
export type BatchTermSubjectUpdateInput = z.infer<typeof batchTermSubjectUpdateInputSchema>;

export const validateBatchTermSubjectCreate = (data: unknown) => {
  return batchTermSubjectCreateInputSchema.parse(data);
};

export const validateBatchTermSubjectUpdate = (data: unknown) => {
  return batchTermSubjectUpdateInputSchema.parse(data);
};