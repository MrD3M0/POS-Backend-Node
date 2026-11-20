import { z } from "zod";

export const examSubjectCreateInputSchema = z.object({
  examId: z.string().uuid("Invalid Exam ID format"),
  batchTermSubjectId: z.string().uuid("Invalid Batch Term Subject ID format").optional(),
  fullMarks: z.string().min(1, "Full marks are required"),
  passMarks: z.string().min(1, "Pass marks are required"),
  examDateBs: z.string().min(1, "Exam date is required"),
});

export const examSubjectUpdateInputSchema = examSubjectCreateInputSchema.partial();

export type ExamSubjectCreateInput = z.infer<typeof examSubjectCreateInputSchema>;
export type ExamSubjectUpdateInput = z.infer<typeof examSubjectUpdateInputSchema>;

// Group-level result workflow (Batch + Term + Subject).
export const examSubjectReviewInputSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  batchId: z.string().uuid("Invalid Batch ID format"),
  termId: z.string().uuid("Invalid Term ID format"),
  subjectId: z.string().uuid("Invalid Subject ID format").optional(),
  examId: z.string().uuid("Invalid Exam ID format").optional(),
  reason: z.string().trim().max(1000, "Reason is too long").optional(),
});

export const resultPublishInputSchema = z.object({
  batchId: z.string().uuid("Invalid Batch ID format"),
  termId: z.string().uuid("Invalid Term ID format"),
  examId: z.string().uuid("Invalid Exam ID format").optional(),
});

export type ExamSubjectReviewInput = z.infer<typeof examSubjectReviewInputSchema>;
export type ResultPublishInput = z.infer<typeof resultPublishInputSchema>;

export const validateExamSubjectCreate = (data: unknown) => {
  return examSubjectCreateInputSchema.parse(data);
};

export const validateExamSubjectUpdate = (data: unknown) => {
  return examSubjectUpdateInputSchema.parse(data);
};

export const validateExamSubjectReview = (data: unknown) => {
  return examSubjectReviewInputSchema.parse(data);
};

export const validateResultPublish = (data: unknown) => {
  return resultPublishInputSchema.parse(data);
};
