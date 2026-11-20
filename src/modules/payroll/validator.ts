import { z } from "zod";
import { assertBsDateString } from "@/utils/bs-date";

export const payrollCreateInputSchema = z.object({
  fiscalYearId: z.string().uuid("Invalid Fiscal Year ID format"),
  yearBs: z.coerce.number().int().min(2000).max(2099),
  monthBs: z.coerce.number().int().min(1, "Month must be 1-12").max(12, "Month must be 1-12"),
  // Accepted for backwards compatibility but ALWAYS recomputed server-side
  // from src/utils/bs-date.ts so payrolls never silently use a wrong month length.
  totalDays: z.coerce.number().int().min(1).max(62).optional(),
  remarks: z.string().max(1000).optional().nullable(),
});

export const payrollUpdateInputSchema = payrollCreateInputSchema.partial();

export const payrollPayInputSchema = z.object({
  paidDateBs: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD (BS)")
    .refine((v) => {
      try {
        assertBsDateString(v, "paidDateBs");
        return true;
      } catch {
        return false;
      }
    }, "paidDateBs must be a valid BS date"),
});

export type PayrollCreateInput = z.infer<typeof payrollCreateInputSchema>;
export type PayrollUpdateInput = z.infer<typeof payrollUpdateInputSchema>;
export type PayrollPayInput = z.infer<typeof payrollPayInputSchema>;

export const validatePayrollCreate = (data: unknown) => payrollCreateInputSchema.parse(data);
export const validatePayrollUpdate = (data: unknown) => payrollUpdateInputSchema.parse(data);
export const validatePayrollPay = (data: unknown) => payrollPayInputSchema.parse(data);
