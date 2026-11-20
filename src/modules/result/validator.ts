import { z } from "zod";

const resultStatusEnum = z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED", "PUBLISHED"]);

// Client only submits who/which exam and optional remarks — totals, GPA, CGPA
// and isPassed are always computed server-side from ExamMarks + GradeScales.
export const resultCreateInputSchema = z.object({
  studentId: z.string().uuid("Invalid Student ID format"),
  examId: z.string().uuid("Invalid Exam ID format"),
  status: z.enum(["DRAFT", "PENDING"]).default("PENDING"),
  remarks: z.string().trim().max(1000, "Remarks too long").optional().nullable(),
});

// PATCH is limited to remarks: published results are immutable, computed
// fields can never be edited directly. Status changes go through /transition.
export const resultUpdateInputSchema = z.object({
  remarks: z.string().trim().max(1000, "Remarks too long").optional().nullable(),
});

export const resultTransitionInputSchema = z.object({
  to: resultStatusEnum,
});

export type ResultCreateInput = z.infer<typeof resultCreateInputSchema>;
export type ResultUpdateInput = z.infer<typeof resultUpdateInputSchema>;
export type ResultTransitionInput = z.infer<typeof resultTransitionInputSchema>;

export const validateResultCreate = (data: unknown) => {
  return resultCreateInputSchema.parse(data);
};

export const validateResultUpdate = (data: unknown) => {
  return resultUpdateInputSchema.parse(data);
};

export const validateResultTransition = (data: unknown) => {
  return resultTransitionInputSchema.parse(data);
};
