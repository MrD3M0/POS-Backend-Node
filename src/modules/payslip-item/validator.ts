import { z } from "zod";

export const payslipItemCreateInputSchema = z.object({
  payslipId: z.string().uuid("Invalid Payslip ID format"),
  componentId: z.string().uuid("Invalid Salary Component ID format").optional(),
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  isDeduction: z.boolean().optional(),
  isEmployerContribution: z.boolean().optional(),
});

export type PayslipItemCreateInput = z.infer<typeof payslipItemCreateInputSchema>;
export type PayslipItemUpdateInput = z.infer<typeof payslipItemCreateInputSchema>;

export const validatePayslipItemCreate = (data: unknown) => {
  return payslipItemCreateInputSchema.parse(data);
};