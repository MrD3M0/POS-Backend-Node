import { z } from "zod";

export const journalLineCreateInputSchema = z.object({
  journalEntryId: z.string().uuid("Invalid Journal Entry ID format"),
  accountId: z.string().uuid("Invalid Account ID format"),
  debit: z.string().min(1, "Debit amount is required"),
  credit: z.string().min(1, "Credit amount is required"),
  description: z.string().optional(),
  studentId: z.string().uuid("Invalid Student ID format").optional(),
  employeeId: z.string().uuid("Invalid Employee ID format").optional(),
});

export type JournalLineCreateInput = z.infer<typeof journalLineCreateInputSchema>;
export type JournalLineUpdateInput = z.infer<typeof journalLineCreateInputSchema>;

export const validateJournalLineCreate = (data: unknown) => {
  return journalLineCreateInputSchema.parse(data);
};