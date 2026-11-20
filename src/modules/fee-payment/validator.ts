import { z } from "zod";
import { positiveMoneySchema } from "@/lib/money";

const methodLineSchema = z.object({
  paymentMethodId: z.string().uuid("Invalid Payment Method ID format"),
  amount: positiveMoneySchema,
  referenceNo: z.string().max(255).optional(),
  bankName: z.string().max(255).optional(),
});

const allocationSchema = z.object({
  studentFeeItemId: z.string().uuid("Invalid Student Fee Item ID format"),
  feeInstallmentId: z.string().uuid("Invalid Fee Installment ID format").optional().nullable(),
  amount: positiveMoneySchema,
});

export const feePaymentCreateInputSchema = z.object({
  studentId: z.string().uuid("Invalid Student ID format"),
  fiscalYearId: z.string().uuid("Invalid Fiscal Year ID format").optional(),
  paymentDateBs: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "paymentDateBs must be a BS date YYYY-MM-DD"),
  totalAmount: positiveMoneySchema,
  remarks: z.string().max(1000).optional(),
  // receiptNo is generated server-side as RC-<fiscalYear>-<6-digit seq>.
  methodLines: z
    .array(methodLineSchema)
    .min(1, "At least one payment method line is required"),
  allocations: z
    .array(allocationSchema)
    .min(1, "At least one allocation is required"),
});

export type FeePaymentCreateInput = z.infer<typeof feePaymentCreateInputSchema>;
export type FeePaymentUpdateInput = z.infer<typeof feePaymentCreateInputSchema>;

export const feePaymentCancelInputSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required").optional(),
  cancelReason: z.string().trim().min(1, "Reason is required").optional(),
}).superRefine((data, ctx) => {
  if (!data.reason && !data.cancelReason) {
    ctx.addIssue({ code: "custom", message: "Reason is required" });
  }
});

export type FeePaymentCancelInput = z.infer<typeof feePaymentCancelInputSchema>;

export const validateFeePaymentCreate = (data: unknown) => {
  return feePaymentCreateInputSchema.parse(data);
};

export const validateFeePaymentCancel = (data: unknown) => {
  return feePaymentCancelInputSchema.parse(data);
};
