import { z } from "zod";

export const paymentMethodCreateInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  code: z.string().trim().min(1, "Code is required").max(255),
  accountId: z.string().uuid("Invalid Account ID format").optional().nullable(),
  isActive: z.boolean().optional(),
});

export const paymentMethodUpdateInputSchema = paymentMethodCreateInputSchema.partial();

export type PaymentMethodCreateInput = z.infer<typeof paymentMethodCreateInputSchema>;
export type PaymentMethodUpdateInput = z.infer<typeof paymentMethodUpdateInputSchema>;

export const validatePaymentMethodCreate = (data: unknown) => paymentMethodCreateInputSchema.parse(data);
export const validatePaymentMethodUpdate = (data: unknown) => paymentMethodUpdateInputSchema.parse(data);
