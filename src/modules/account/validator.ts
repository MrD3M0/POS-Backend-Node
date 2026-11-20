import z from "zod";

export const accountCreateInputSchema = z.object({
  code: z.string().trim().min(1, "Code is required").max(30),
  name: z.string().trim().min(1, "Name is required").max(120),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"], {
    message: "Type must be ASSET, LIABILITY, EQUITY, INCOME, or EXPENSE",
  }),
  parentId: z.string().uuid("Invalid Parent ID format").optional().nullable(),
  isGroup: z.boolean().optional(),
  isActive: z.boolean().optional(),
  // isSystem is intentionally NOT client-settable.
});

export const accountUpdateInputSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  parentId: z.string().uuid("Invalid Parent ID format").optional().nullable(),
  isActive: z.boolean().optional(),
});

export type AccountCreateInput = z.infer<typeof accountCreateInputSchema>;
export type AccountUpdateInput = z.infer<typeof accountUpdateInputSchema>;

export const validateAccountCreate = (data: unknown) => accountCreateInputSchema.parse(data);
export const validateAccountUpdate = (data: unknown) => accountUpdateInputSchema.parse(data);
