import { z } from "zod";

export const salaryStructureItemCreateInputSchema = z.object({
  salaryStructureId: z.string().uuid("Invalid Salary Structure ID format"),
  componentId: z.string().uuid("Invalid Salary Component ID format"),
  amount: z.number().min(0, "Amount must be >= 0"),
  isPercentOfBasic: z.boolean().default(false),
});

export const salaryStructureItemUpdateInputSchema = salaryStructureItemCreateInputSchema.partial();

export type SalaryStructureItemCreateInput = z.infer<typeof salaryStructureItemCreateInputSchema>;
export type SalaryStructureItemUpdateInput = z.infer<typeof salaryStructureItemUpdateInputSchema>;

export const validateSalaryStructureItemCreate = (data: unknown) => {
  return salaryStructureItemCreateInputSchema.parse(data);
};

export const validateSalaryStructureItemUpdate = (data: unknown) => {
  return salaryStructureItemUpdateInputSchema.parse(data);
};
