import { z } from "zod";

export const salaryComponentCreateInputSchema = z.object({
  code: z.string().min(1, "Component code is required").max(50, "Component code is too long"),
  name: z.string().min(1, "Component name is required").max(100, "Component name is too long"),
  isDeduction: z.boolean().default(false),
  isEmployerContribution: z.boolean().default(false),
  isTaxable: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const salaryComponentUpdateInputSchema = salaryComponentCreateInputSchema.partial();

export type SalaryComponentCreateInput = z.infer<typeof salaryComponentCreateInputSchema>;
export type SalaryComponentUpdateInput = z.infer<typeof salaryComponentUpdateInputSchema>;

export const validateSalaryComponentCreate = (data: unknown) => {
  return salaryComponentCreateInputSchema.parse(data);
};

export const validateSalaryComponentUpdate = (data: unknown) => {
  return salaryComponentUpdateInputSchema.parse(data);
};
