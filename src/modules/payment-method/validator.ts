import { z } from "zod";

export const paymentMethodCreateInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  code: z.string().min(1, "Code is required").max(255, "Code is too long"),
});

export type PaymentMethodCreateInput = z.infer<typeof paymentMethodCreateInputSchema>;
export type PaymentMethodUpdateInput = z.infer<typeof paymentMethodCreateInputSchema>;

export const validatePaymentMethodCreate = (data: unknown) => {
  return paymentMethodCreateInputSchema.parse(data);
};