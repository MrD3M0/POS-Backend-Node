import { z } from "zod";

export const payslipCreateInputSchema = z.object({
  payslipNo: z.string().min(1, "Payslip number is required"),
  payrollId: z.string().uuid("Invalid Payroll ID format"),
  employeeId: z.string().uuid("Invalid Employee ID format"),
  paymentMethodId: z.string().uuid("Invalid Payment Method ID format").optional(),
  presentDays: z.string().min(1, "Present days are required"),
  halfDays: z.number().int().min(0),
  paidLeaveDays: z.number().int().min(0),
  unpaidLeaveDays: z.number().int().min(0),
  absentDays: z.number().int().min(0),
  basicSalary: z.string().min(1, "Basic salary is required"),
  attendanceDeduction: z.string().optional(),
  totalAllowance: z.string().optional(),
  teachingPay: z.string().optional(),
  grossPay: z.string().min(1, "Gross pay is required"),
  totalDeduction: z.string().min(1, "Total deduction is required"),
  taxAmount: z.string().min(1, "Tax amount is required"),
  netPay: z.string().min(1, "Net pay is required"),
  paidDateBs: z.string().min(1, "Paid date is required"),
});

export type PayslipCreateInput = z.infer<typeof payslipCreateInputSchema>;
export type PayslipUpdateInput = z.infer<typeof payslipCreateInputSchema>;

export const validatePayslipCreate = (data: unknown) => {
  return payslipCreateInputSchema.parse(data);
};