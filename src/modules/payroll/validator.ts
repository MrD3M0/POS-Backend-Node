import { z } from "zod";

export const payrollCreateInputSchema = z.object({
  fiscalYearId: z.string().uuid("Invalid Fiscal Year ID format"),
  yearBs: z.string().min(1, "Year is required"),
  monthBs: z.string().min(1, "Month is required"),
  totalDays: z.number().int().min(0),
});

export type PayrollCreateInput = z.infer<typeof payrollCreateInputSchema>;
export type PayrollUpdateInput = z.infer<typeof payrollCreateInputSchema>;

export const validatePayrollCreate = (data: unknown) => {
  return payrollCreateInputSchema.parse(data);
};