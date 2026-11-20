import { z } from "zod";
import { positiveMoneySchema } from "@/lib/money";

const installmentInputSchema = z.object({
  installmentNo: z.coerce.number().int().min(1, "Installment number is required"),
  dueDateBs: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDateBs must be a BS date YYYY-MM-DD"),
  amount: positiveMoneySchema,
});

export const feeInstallmentCreateInputSchema = z.object({
  studentFeeItemId: z.string().uuid("Invalid Student Fee Item ID format"),
  installmentNo: z.coerce.number().int().min(1, "Installment number is required"),
  dueDateBs: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be a BS date YYYY-MM-DD"),
  amount: positiveMoneySchema,
});

export const feeInstallmentBulkInputSchema = z.object({
  studentFeeItemId: z.string().uuid("Invalid Student Fee Item ID format"),
  installments: z
    .array(installmentInputSchema)
    .min(1, "At least one installment is required"),
});

export type FeeInstallmentCreateInput = z.infer<typeof feeInstallmentCreateInputSchema>;
export type FeeInstallmentBulkInput = z.infer<typeof feeInstallmentBulkInputSchema>;

export const validateFeeInstallmentCreate = (data: unknown) => {
  return feeInstallmentCreateInputSchema.parse(data);
};

export const validateFeeInstallmentBulk = (data: unknown) => {
  return feeInstallmentBulkInputSchema.parse(data);
};
