import { z } from "zod";

export const payslipItemCreateInputSchema = z.object({
  payslipId: z.string().uuid("Invalid Payslip ID format"),
  componentId: z.string().uuid("Invalid Salary Component ID format").optional().nullable(),
  description: z.string().min(1, "Description is required"),
  amount: z
    .union([z.string().min(1), z.number()])
    .transform((v) => String(v)),
  isDeduction: z.boolean().optional().default(false),
  isEmployerContribution: z.boolean().optional().default(false),
});

export type PayslipItemCreateInput = z.infer<typeof payslipItemCreateInputSchema>;
export type PayslipItemUpdateInput = z.infer<typeof payslipItemCreateInputSchema>;

export const validatePayslipItemCreate = (data: unknown) => {
  return payslipItemCreateInputSchema.parse(data);
};