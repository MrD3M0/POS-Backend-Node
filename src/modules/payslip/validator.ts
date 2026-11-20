import { z } from "zod";

const decimalLike = z
  .union([z.string().min(1), z.number()])
  .transform((v) => String(v));

export const payslipCreateInputSchema = z.object({
  payslipNo: z.string().min(1, "Payslip number is required"),
  payrollId: z.string().uuid("Invalid Payroll ID format"),
  employeeId: z.string().uuid("Invalid Employee ID format"),
  paymentMethodId: z.string().uuid("Invalid Payment Method ID format").optional().nullable(),
  presentDays: decimalLike,
  halfDays: z.coerce.number().int().min(0),
  paidLeaveDays: z.coerce.number().int().min(0),
  unpaidLeaveDays: z.coerce.number().int().min(0),
  absentDays: z.coerce.number().int().min(0),
  basicSalary: decimalLike,
  attendanceDeduction: decimalLike.optional().default("0"),
  totalAllowance: decimalLike.optional().default("0"),
  teachingPay: decimalLike.optional().default("0"),
  grossPay: decimalLike,
  totalDeduction: decimalLike,
  taxAmount: decimalLike.optional().default("0"),
  netPay: decimalLike,
  paidDateBs: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Paid date must be YYYY-MM-DD (BS)")
    .optional()
    .nullable(),
});

export const payslipUpdateInputSchema = payslipCreateInputSchema.partial();

export type PayslipCreateInput = z.infer<typeof payslipCreateInputSchema>;
export type PayslipUpdateInput = z.infer<typeof payslipUpdateInputSchema>;

export const validatePayslipCreate = (data: unknown) => payslipCreateInputSchema.parse(data);
export const validatePayslipUpdate = (data: unknown) => payslipUpdateInputSchema.parse(data);
