import { z } from "zod";

export const feePaymentCreateInputSchema = z.object({
  receiptNo: z.string().optional(),
  studentId: z.string().uuid("Invalid Student ID format"),
  fiscalYearId: z.string().uuid("Invalid Fiscal Year ID format").optional(),
  paymentDateBs: z.string().min(1, "Payment date is required"),
  totalAmount: z.string().min(1, "Total amount is required"),
  remarks: z.string().optional(),
  isCancelled: z.boolean().optional(),
  cancelledAt: z.string().datetime().optional(),
  cancelReason: z.string().optional(),
  journalEntryId: z.string().uuid("Invalid Journal Entry ID format").optional(),
});

export type FeePaymentCreateInput = z.infer<typeof feePaymentCreateInputSchema>;
export type FeePaymentUpdateInput = z.infer<typeof feePaymentCreateInputSchema>;

export const validateFeePaymentCreate = (data: unknown) => {
  return feePaymentCreateInputSchema.parse(data);
};