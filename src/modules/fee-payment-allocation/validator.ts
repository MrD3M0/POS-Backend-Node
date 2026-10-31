import { z } from "zod";

export const feePaymentAllocationCreateInputSchema = z.object({
  feePaymentId: z.string().uuid("Invalid Fee Payment ID format"),
  studentFeeItemId: z.string().uuid("Invalid Student Fee Item ID format"),
  feeInstallmentId: z.string().uuid("Invalid Fee Installment ID format").optional(),
  amount: z.string().min(1, "Amount is required"),
});

export type FeePaymentAllocationCreateInput = z.infer<typeof feePaymentAllocationCreateInputSchema>;
export type FeePaymentAllocationUpdateInput = z.infer<typeof feePaymentAllocationCreateInputSchema>;

export const validateFeePaymentAllocationCreate = (data: unknown) => {
  return feePaymentAllocationCreateInputSchema.parse(data);
};