import { z } from "zod";

export const accountantCreateInputSchema = z.object({
  employeeId: z.string().uuid("Invalid Employee ID format"),
});

export type AccountantCreateInput = z.infer<typeof accountantCreateInputSchema>;
export type AccountantUpdateInput = z.infer<typeof accountantCreateInputSchema>;

export const validateAccountantCreate = (data: unknown) => {
  return accountantCreateInputSchema.parse(data);
};