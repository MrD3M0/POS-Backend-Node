import { z } from "zod";
import { nonNegativeMoneySchema } from "@/lib/money";

export const journalLineCreateInputSchema = z.object({
  journalEntryId: z.string().uuid("Invalid Journal Entry ID format"),
  accountId: z.string().uuid("Invalid Account ID format"),
  debit: nonNegativeMoneySchema.optional(),
  credit: nonNegativeMoneySchema.optional(),
  description: z.string().max(500).optional(),
  studentId: z.string().uuid("Invalid Student ID format").optional().nullable(),
  employeeId: z.string().uuid("Invalid Employee ID format").optional().nullable(),
});

export type JournalLineCreateInput = z.infer<typeof journalLineCreateInputSchema>;
export type JournalLineUpdateInput = z.infer<typeof journalLineCreateInputSchema>;

export const validateJournalLineCreate = (data: unknown) => {
  return journalLineCreateInputSchema.parse(data);
};
