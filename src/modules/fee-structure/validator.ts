import { z } from "zod";
import { positiveMoneySchema } from "@/lib/money";

const feeStructureItemInputSchema = z.object({
  feeHeadId: z.string().uuid("Invalid Fee Head ID format"),
  // null termNumber = one-time fee (e.g. admission); present = per-term fee.
  termNumber: z.number().int().min(1).optional().nullable(),
  amount: positiveMoneySchema,
});

export const feeStructureCreateInputSchema = z.object({
  courseId: z.string().uuid("Invalid Course ID format"),
  // null/absent = default structure for the course; set = batch override.
  batchId: z.string().uuid("Invalid Batch ID format").optional().nullable(),
  name: z.string().trim().min(1, "Name is required"),
  isActive: z.boolean().optional(),
  items: z.array(feeStructureItemInputSchema).optional(),
});

export type FeeStructureCreateInput = z.infer<typeof feeStructureCreateInputSchema>;
export const feeStructureUpdateInputSchema =
  feeStructureCreateInputSchema.partial();
export type FeeStructureUpdateInput = z.infer<
  typeof feeStructureUpdateInputSchema
>;

export const validateFeeStructureCreate = (data: unknown) => {
  return feeStructureCreateInputSchema.parse(data);
};

export const validateFeeStructureUpdate = (data: unknown) => {
  return feeStructureUpdateInputSchema.parse(data);
};
