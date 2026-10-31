import { z } from "zod";

export const examMarkCreateInputSchema = z.object({
  examId: z.string().uuid("Invalid Exam ID format"),
  examSubjectId: z.string().uuid("Invalid Exam Subject ID format"),
  studentId: z.string().uuid("Invalid Student ID format"),
  marksObtained: z.string().min(1, "Marks are required"),
  isAbsent: z.boolean().optional(),
  remarks: z.string().optional(),
});

export type ExamMarkCreateInput = z.infer<typeof examMarkCreateInputSchema>;
export type ExamMarkUpdateInput = z.infer<typeof examMarkCreateInputSchema>;

export const validateExamMarkCreate = (data: unknown) => {
  return examMarkCreateInputSchema.parse(data);
};