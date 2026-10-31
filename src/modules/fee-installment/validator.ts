import { z } from "zod";

export const feeInstallmentCreateInputSchema = z.object({
  studentFeeItemId: z.string().uuid("Invalid Student Fee Item ID format"),
  dueDateBs: z.string().min(1, "Due date is required"),
  amount: z.string().min(1, "Amount is required"),
});

export type FeeInstallmentCreateInput = z.infer<typeof feeInstallmentCreateInputSchema>;
export type FeeInstallmentUpdateInput = z.infer<typeof feeInstallmentCreateInputSchema>;

export const validateFeeInstallmentCreate = (data: unknown) => {
  return feeInstallmentCreateInputSchema.parse(data);
};