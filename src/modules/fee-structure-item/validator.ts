import { z } from "zod";

export const feeStructureItemCreateInputSchema = z.object({
  feeStructureId: z.string().uuid("Invalid Fee Structure ID format"),
  feeHeadId: z.string().uuid("Invalid Fee Head ID format"),
  termNumber: z.number().int().min(1),
  amount: z.string().min(1, "Amount is required"),
});

export type FeeStructureItemCreateInput = z.infer<typeof feeStructureItemCreateInputSchema>;
export type FeeStructureItemUpdateInput = z.infer<typeof feeStructureItemCreateInputSchema>;

export const validateFeeStructureItemCreate = (data: unknown) => {
  return feeStructureItemCreateInputSchema.parse(data);
};
