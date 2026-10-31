import { z } from "zod";

export const salaryStructureCreateInputSchema = z.object({
  employeeId: z.string().uuid("Invalid Employee ID format"),
  basicSalary: z.number().min(0, "Basic salary must be >= 0"),
  effectiveFromBs: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  effectiveToBs: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
  remarks: z.string().max(1000, "Remarks too long").optional().nullable(),
});

export const salaryStructureUpdateInputSchema = salaryStructureCreateInputSchema.partial();

export type SalaryStructureCreateInput = z.infer<typeof salaryStructureCreateInputSchema>;
export type SalaryStructureUpdateInput = z.infer<typeof salaryStructureUpdateInputSchema>;

export const validateSalaryStructureCreate = (data: unknown) => {
  return salaryStructureCreateInputSchema.parse(data);
};

export const validateSalaryStructureUpdate = (data: unknown) => {
  return salaryStructureUpdateInputSchema.parse(data);
};
