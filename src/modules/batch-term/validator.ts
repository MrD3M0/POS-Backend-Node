import { z } from "zod";

export const batchTermCreateInputSchema = z.object({
  batchId: z.string().uuid("Invalid Batch ID format"),
  termNumber: z.number().int().positive("Term number must be a positive integer"),
  name: z.string().min(1, "Term name is required").max(100, "Term name is too long"),
  startDateBs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
  endDateBs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
  isActive: z.boolean().default(true),
});

export const batchTermUpdateInputSchema = batchTermCreateInputSchema.partial();

export type BatchTermCreateInput = z.infer<typeof batchTermCreateInputSchema>;
export type BatchTermUpdateInput = z.infer<typeof batchTermUpdateInputSchema>;

export const validateBatchTermCreate = (data: unknown) => {
  return batchTermCreateInputSchema.parse(data);
};

export const validateBatchTermUpdate = (data: unknown) => {
  return batchTermUpdateInputSchema.parse(data);
};