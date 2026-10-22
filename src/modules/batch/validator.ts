import { z } from "zod";

export const batchCreateInputSchema = z.object({
  courseId: z.string().uuid("Invalid Course ID format"),
  name: z.string().min(1, "Batch name is required").max(100, "Batch name is too long"),
  startDateBs: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
  currentTermNumber: z.number().int().positive("Term number must be a positive integer").default(1),
  isActive: z.boolean().default(true),
});

export const batchUpdateInputSchema = batchCreateInputSchema.partial();

export type BatchCreateInput = z.infer<typeof batchCreateInputSchema>;
export type BatchUpdateInput = z.infer<typeof batchUpdateInputSchema>;

export const validateBatchCreate = (data: unknown) => {
  return batchCreateInputSchema.parse(data);
};

export const validateBatchUpdate = (data: unknown) => {
  return batchUpdateInputSchema.parse(data);
};
