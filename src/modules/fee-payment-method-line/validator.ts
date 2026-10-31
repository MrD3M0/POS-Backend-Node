import { z } from "zod";

export const feePaymentMethodLineCreateInputSchema = z.object({
  feePaymentId: z.string().uuid("Invalid Fee Payment ID format"),
  paymentMethodId: z.string().uuid("Invalid Payment Method ID format"),
  amount: z.string().min(1, "Amount is required"),
  referenceNo: z.string().optional(),
  bankName: z.string().optional(),
});

export type FeePaymentMethodLineCreateInput = z.infer<typeof feePaymentMethodLineCreateInputSchema>;
export type FeePaymentMethodLineUpdateInput = z.infer<typeof feePaymentMethodLineCreateInputSchema>;

export const validateFeePaymentMethodLineCreate = (data: unknown) => {
  return feePaymentMethodLineCreateInputSchema.parse(data);
};