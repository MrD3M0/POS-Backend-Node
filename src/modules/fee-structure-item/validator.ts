import { z } from "zod";
import { positiveMoneySchema } from "@/lib/money";

export const feeStructureItemCreateInputSchema = z.object({
  feeStructureId: z.string().uuid("Invalid Fee Structure ID format"),
  feeHeadId: z.string().uuid("Invalid Fee Head ID format"),
  // null = one-time fee (e.g. admission); a number = per-term fee.
  termNumber: z.number().int().min(1).optional().nullable(),
  amount: positiveMoneySchema,
});

export type FeeStructureItemCreateInput = z.infer<typeof feeStructureItemCreateInputSchema>;
export type FeeStructureItemUpdateInput = z.infer<typeof feeStructureItemCreateInputSchema>;

export const validateFeeStructureItemCreate = (data: unknown) => {
  return feeStructureItemCreateInputSchema.parse(data);
};
