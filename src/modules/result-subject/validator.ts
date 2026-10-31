import { z } from "zod";

export const resultSubjectCreateInputSchema = z.object({
  examSubjectId: z.string().uuid("Invalid Exam Subject ID format"),
  marksObtained: z.number().min(0, "Marks obtained must be >= 0"),
  fullMarks: z.number().min(1, "Full marks must be > 0"),
  creditHour: z.number().min(0, "Credit hour must be >= 0"),
  gradePoint: z.number().min(0).max(4, "Grade point must be between 0 and 4"),
});

export const resultSubjectUpdateInputSchema = resultSubjectCreateInputSchema.partial();

export type ResultSubjectCreateInput = z.infer<typeof resultSubjectCreateInputSchema>;
export type ResultSubjectUpdateInput = z.infer<typeof resultSubjectUpdateInputSchema>;

export const validateResultSubjectCreate = (data: unknown) => {
  return resultSubjectCreateInputSchema.parse(data);
};

export const validateResultSubjectUpdate = (data: unknown) => {
  return resultSubjectUpdateInputSchema.parse(data);
};
