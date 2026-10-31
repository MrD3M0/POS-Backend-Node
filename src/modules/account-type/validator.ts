import { z } from "zod";

export const accountTypeCreateInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(50, "Code is too long")
    .transform((value) => value.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name is too long"),
  isDebitNormal: z.boolean(),
  sortOrder: z.number().int().min(0).default(0),
});

export const accountTypeUpdateInputSchema =
  accountTypeCreateInputSchema.partial();

export type AccountTypeCreateInput = z.infer<
  typeof accountTypeCreateInputSchema
>;
export type AccountTypeUpdateInput = z.infer<
  typeof accountTypeUpdateInputSchema
>;

export const validateAccountTypeCreate = (data: unknown) => {
  return accountTypeCreateInputSchema.parse(data);
};

export const validateAccountTypeUpdate = (data: unknown) => {
  return accountTypeUpdateInputSchema.parse(data);
};
