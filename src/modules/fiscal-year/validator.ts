import { z } from "zod";

const bsDateSchema = (field: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${field} must be a BS date YYYY-MM-DD`);

export const fiscalYearCreateInputSchema = z.object({
  name: z
    .string()
    .regex(/^\d{4}\/\d{2}$/, "Fiscal year name must look like 2081/82"),
  startDateBs: bsDateSchema("Start date"),
  endDateBs: bsDateSchema("End date"),
  isCurrent: z.boolean().optional(),
  isClosed: z.boolean().optional(),
});

export const fiscalYearUpdateInputSchema = fiscalYearCreateInputSchema.partial();

export type FiscalYearCreateInput = z.infer<typeof fiscalYearCreateInputSchema>;
export type FiscalYearUpdateInput = z.infer<typeof fiscalYearUpdateInputSchema>;

export const validateFiscalYearCreate = (data: unknown) => {
  return fiscalYearCreateInputSchema.parse(data);
};

export const validateFiscalYearUpdate = (data: unknown) => {
  return fiscalYearUpdateInputSchema.parse(data);
};
