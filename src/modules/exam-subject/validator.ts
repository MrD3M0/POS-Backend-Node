import { z } from "zod";

export const examSubjectCreateInputSchema = z.object({
  examId: z.string().uuid("Invalid Exam ID format"),
  batchTermSubjectId: z.string().uuid("Invalid Batch Term Subject ID format").optional(),
  fullMarks: z.string().min(1, "Full marks are required"),
  passMarks: z.string().min(1, "Pass marks are required"),
  examDateBs: z.string().min(1, "Exam date is required"),
});

export type ExamSubjectCreateInput = z.infer<typeof examSubjectCreateInputSchema>;
export type ExamSubjectUpdateInput = z.infer<typeof examSubjectCreateInputSchema>;

export const validateExamSubjectCreate = (data: unknown) => {
  return examSubjectCreateInputSchema.parse(data);
};