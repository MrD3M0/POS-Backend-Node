import { z } from "zod";

const marksInput = z.union([z.string(), z.number()], {
  message: "Marks must be a number",
});

export const examMarkCreateInputSchema = z.object({
  examSubjectId: z.string().uuid("Invalid Exam Subject ID format"),
  studentId: z.string().uuid("Invalid Student ID format"),
  // marksObtained is forced to null when isAbsent=true in the service
  marksObtained: marksInput.optional().nullable(),
  isAbsent: z.boolean().optional().default(false),
  remarks: z.string().trim().max(500, "Remarks are too long").optional().nullable(),
});

export const examMarkUpdateInputSchema = z.object({
  examSubjectId: z.string().uuid("Invalid Exam Subject ID format").optional(),
  studentId: z.string().uuid("Invalid Student ID format").optional(),
  marksObtained: marksInput.optional().nullable(),
  isAbsent: z.boolean().optional(),
  remarks: z.string().trim().max(500, "Remarks are too long").optional().nullable(),
});

export const examMarkBulkInputSchema = z.object({
  marks: z
    .array(examMarkCreateInputSchema)
    .min(1, "At least one exam mark is required")
    .max(500, "Too many records in one request"),
});

export type ExamMarkCreateInput = z.infer<typeof examMarkCreateInputSchema>;
export type ExamMarkUpdateInput = z.infer<typeof examMarkUpdateInputSchema>;
export type ExamMarkBulkInput = z.infer<typeof examMarkBulkInputSchema>;

export const validateExamMarkCreate = (data: unknown) => {
  return examMarkCreateInputSchema.parse(data);
};

export const validateExamMarkUpdate = (data: unknown) => {
  return examMarkUpdateInputSchema.parse(data);
};

export const validateExamMarkBulk = (data: unknown) => {
  return examMarkBulkInputSchema.parse(data);
};
