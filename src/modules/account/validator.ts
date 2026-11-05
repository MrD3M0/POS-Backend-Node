import { z } from "zod";

export const accountCreateInputSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"], {
    message: "Type must be ASSET, LIABILITY, EQUITY, INCOME, or EXPENSE",
  }),
  parentId: z.string().uuid("Invalid Parent ID format").optional(),
  isGroup: z.boolean().optional(),
  isSystem: z.boolean().optional(),
});

export type AccountCreateInput = z.infer<typeof accountCreateInputSchema>;
export type AccountUpdateInput = z.infer<typeof accountCreateInputSchema>;

export const validateAccountCreate = (data: unknown) => {
  return accountCreateInputSchema.parse(data);
};