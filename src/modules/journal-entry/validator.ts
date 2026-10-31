import { z } from "zod";

export const journalEntryCreateInputSchema = z.object({
  entryNo: z.string().min(1, "Entry number is required"),
  fiscalYearId: z.string().uuid("Invalid Fiscal Year ID format"),
  dateBs: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  sourceId: z.string().uuid("Invalid Source ID format").optional(),
  sourceRefId: z.string().uuid("Invalid Source Ref ID format").optional(),
  isManual: z.boolean().optional(),
  isBackdated: z.boolean().optional(),
  isReversed: z.boolean().optional(),
  reversalOfId: z.string().uuid("Invalid Reversal Of ID format").optional(),
});

export type JournalEntryCreateInput = z.infer<typeof journalEntryCreateInputSchema>;
export type JournalEntryUpdateInput = z.infer<typeof journalEntryCreateInputSchema>;

export const validateJournalEntryCreate = (data: unknown) => {
  return journalEntryCreateInputSchema.parse(data);
};