import { z } from "zod";

export const paymentMethodCreateInputSchema = z.object({
  name: z.string().max(255, "Name is too long"),
  code: z.string().max(255, "Code is too long").optional(),
});

export type PaymentMethodCreateInput = z.infer<typeof paymentMethodCreateInputSchema>;
export type PaymentMethodUpdateInput = z.infer<typeof paymentMethodCreateInputSchema>;

export const validatePaymentMethodCreate = (data: unknown) => {
  return paymentMethodCreateInputSchema.parse(data);
};