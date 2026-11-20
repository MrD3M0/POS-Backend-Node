import { z } from "zod";

export const examTypeCreateInputSchema = z.object({
  code: z.string().trim().min(1).max(50).optional(),
  name: z.string().trim().min(1, "Name is required").max(255),
  isActive: z.boolean().optional(),
});

export const examTypeUpdateInputSchema = examTypeCreateInputSchema.partial();

export type ExamTypeCreateInput = z.infer<typeof examTypeCreateInputSchema>;
export type ExamTypeUpdateInput = z.infer<typeof examTypeUpdateInputSchema>;

export const validateExamTypeCreate = (data: unknown) => examTypeCreateInputSchema.parse(data);
export const validateExamTypeUpdate = (data: unknown) => examTypeUpdateInputSchema.parse(data);
