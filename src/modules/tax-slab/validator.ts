import { z } from "zod";

export const taxSlabCreateInputSchema = z.object({
  fiscalYearId: z.string().uuid("Invalid Fiscal Year ID format"),
  isCouple: z.boolean().default(false),
  fromAmount: z.number().min(0, "From amount must be >= 0"),
  toAmount: z.number().min(0, "To amount must be >= 0").optional().nullable(),
  ratePercent: z.number().min(0, "Rate must be >= 0").max(100, "Rate must be <= 100"),
});

export const taxSlabUpdateInputSchema = taxSlabCreateInputSchema.partial();

export type TaxSlabCreateInput = z.infer<typeof taxSlabCreateInputSchema>;
export type TaxSlabUpdateInput = z.infer<typeof taxSlabUpdateInputSchema>;

export const validateTaxSlabCreate = (data: unknown) => {
  return taxSlabCreateInputSchema.parse(data);
};

export const validateTaxSlabUpdate = (data: unknown) => {
  return taxSlabUpdateInputSchema.parse(data);
};
