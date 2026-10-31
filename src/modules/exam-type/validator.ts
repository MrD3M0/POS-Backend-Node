import { z } from "zod";

export const examTypeCreateInputSchema = z.object({
  name: z.string().max(255, "Name is too long"),
});

export type ExamTypeCreateInput = z.infer<typeof examTypeCreateInputSchema>;
export type ExamTypeUpdateInput = z.infer<typeof examTypeCreateInputSchema>;

export const validateExamTypeCreate = (data: unknown) => {
  return examTypeCreateInputSchema.parse(data);
};