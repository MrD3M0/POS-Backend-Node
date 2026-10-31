import { z } from "zod";

export const fiscalYearCreateInputSchema = z.object({
  name: z.string().min(1, "Fiscal year name is required"),
  startDateBs: z.string().min(1, "Start date is required"),
  endDateBs: z.string().min(1, "End date is required"),
  isCurrent: z.boolean().optional(),
  isClosed: z.boolean().optional(),
});

export type FiscalYearCreateInput = z.infer<typeof fiscalYearCreateInputSchema>;
export type FiscalYearUpdateInput = z.infer<typeof fiscalYearCreateInputSchema>;

export const validateFiscalYearCreate = (data: unknown) => {
  return fiscalYearCreateInputSchema.parse(data);
};