import { z } from "zod";
import { nonNegativeMoneySchema } from "@/lib/money";

export const journalLineInputSchema = z.object({
  accountId: z.string().uuid("Invalid Account ID format"),
  debit: nonNegativeMoneySchema.optional(),
  credit: nonNegativeMoneySchema.optional(),
  description: z.string().max(500).optional(),
  studentId: z.string().uuid("Invalid Student ID format").optional().nullable(),
  employeeId: z.string().uuid("Invalid Employee ID format").optional().nullable(),
});

export const journalEntryCreateInputSchema = z.object({
  fiscalYearId: z.string().uuid("Invalid Fiscal Year ID format"),
  dateBs: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dateBs must be a BS date YYYY-MM-DD"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(1000, "Description is too long"),
  source: z
    .enum([
      "MANUAL",
      "FEE_PAYMENT",
      "FEE_PAYMENT_CANCEL",
      "PAYROLL",
      "OPENING",
      "REVERSAL",
      "CLOSING",
    ])
    .optional()
    .default("MANUAL"),
  // entryNo is generated server-side as JV-<fiscalYear>-<6-digit seq>.
  lines: z
    .array(journalLineInputSchema)
    .min(2, "A journal entry requires at least 2 lines"),
});

export const journalEntryReverseInputSchema = z.object({
  description: z.string().trim().max(1000).optional(),
  dateBs: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dateBs must be a BS date YYYY-MM-DD")
    .optional(),
});

export type JournalLineInput = z.infer<typeof journalLineInputSchema>;
export type JournalEntryCreateInput = z.infer<typeof journalEntryCreateInputSchema>;
export type JournalEntryUpdateInput = z.infer<typeof journalEntryCreateInputSchema>;
export type JournalEntryReverseInput = z.infer<typeof journalEntryReverseInputSchema>;

export const validateJournalEntryCreate = (data: unknown) => {
  return journalEntryCreateInputSchema.parse(data);
};

export const validateJournalEntryReverse = (data: unknown) => {
  return journalEntryReverseInputSchema.parse(data ?? {});
};
