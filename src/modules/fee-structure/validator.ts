import { z } from "zod";

export const feeStructureCreateInputSchema = z.object({
  courseId: z.string().uuid("Invalid Course ID format"),
  batchId: z.string().uuid("Invalid Batch ID format").optional().nullable(),
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean().optional(),
});

export type FeeStructureCreateInput = z.infer<typeof feeStructureCreateInputSchema>;
export type FeeStructureUpdateInput = z.infer<typeof feeStructureCreateInputSchema>;

export const validateFeeStructureCreate = (data: unknown) => {
  return feeStructureCreateInputSchema.parse(data);
};
