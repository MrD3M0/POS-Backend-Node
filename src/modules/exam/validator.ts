import { z } from "zod";

export const examCreateInputSchema = z.object({
  batchTermId: z.string().uuid("Invalid Batch Term ID format").optional(),
  examTypeId: z.string().uuid("Invalid Exam Type ID format").optional(),
  name: z.string().min(1, "Exam name is required"),
  startDateBs: z.string().min(1, "Start date is required"),
  endDateBs: z.string().min(1, "End date is required"),
});

export type ExamCreateInput = z.infer<typeof examCreateInputSchema>;
export type ExamUpdateInput = z.infer<typeof examCreateInputSchema>;

export const validateExamCreate = (data: unknown) => {
  return examCreateInputSchema.parse(data);
};