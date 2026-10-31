import { z } from "zod";

export const principalCreateInputSchema = z.object({
  employeeId: z.string().uuid("Invalid Employee ID format"),
  createdBy: z.string().uuid("Invalid Creator User ID format").optional().nullable(),
});

export type PrincipalCreateInput = z.infer<typeof principalCreateInputSchema>;
export type PrincipalUpdateInput = z.infer<typeof principalCreateInputSchema>;

export const validatePrincipalCreate = (data: unknown) => {
  return principalCreateInputSchema.parse(data);
};