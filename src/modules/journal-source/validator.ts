import { z } from "zod";

export const journalSourceCreateInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(50, "Code is too long")
    .transform((value) => value.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name is too long"),
});

export const journalSourceUpdateInputSchema =
  journalSourceCreateInputSchema.partial();

export type JournalSourceCreateInput = z.infer<
  typeof journalSourceCreateInputSchema
>;
export type JournalSourceUpdateInput = z.infer<
  typeof journalSourceUpdateInputSchema
>;

export const validateJournalSourceCreate = (data: unknown) => {
  return journalSourceCreateInputSchema.parse(data);
};

export const validateJournalSourceUpdate = (data: unknown) => {
  return journalSourceUpdateInputSchema.parse(data);
};
