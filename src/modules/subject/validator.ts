import { z } from "zod";

export const subjectCreateInputSchema = z.object({
  code: z.string().min(1, "Subject code is required").max(20, "Subject code is too long"),
  name: z.string().min(1, "Subject name is required").max(255, "Subject name is too long"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const subjectUpdateInputSchema = subjectCreateInputSchema.partial();

export type SubjectCreateInput = z.infer<typeof subjectCreateInputSchema>;
export type SubjectUpdateInput = z.infer<typeof subjectUpdateInputSchema>;

export const validateSubjectCreate = (data: unknown) => {
  return subjectCreateInputSchema.parse(data);
};

export const validateSubjectUpdate = (data: unknown) => {
  return subjectUpdateInputSchema.parse(data);
};