import { z } from "zod";

export const payrollCreateInputSchema = z.object({
  fiscalYearId: z.string().uuid("Invalid Fiscal Year ID format"),
  yearBs: z.coerce.number().int().min(2000, "Invalid BS year").max(2100, "Invalid BS year"),
  monthBs: z.coerce.number().int().min(1, "Month must be 1-12").max(12, "Month must be 1-12"),
  totalDays: z.number().int().min(0),
});

export type PayrollCreateInput = z.infer<typeof payrollCreateInputSchema>;
export type PayrollUpdateInput = z.infer<typeof payrollCreateInputSchema>;

export const validatePayrollCreate = (data: unknown) => {
  return payrollCreateInputSchema.parse(data);
};