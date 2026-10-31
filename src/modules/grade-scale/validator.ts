import { z } from "zod";

export const gradeScaleItemCreateInputSchema = z.object({
  grade: z.string().min(1, "Grade is required"),
  minPercent: z.string().min(1, "Minimum Percentage is required"),
  maxPercent: z.string().min(1, "Maximum Percentage is required"),
  gradePoint: z.string().min(1, "Grade Point is required"),
  description: z.string().optional(),
  isPassGrade: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type GradeScaleItemCreateInput = z.infer<typeof gradeScaleItemCreateInputSchema>;
export type GradeScaleItemUpdateInput = z.infer<typeof gradeScaleItemCreateInputSchema>;

export const validateGradeScaleItemCreate = (data: unknown) => {
  return gradeScaleItemCreateInputSchema.parse(data);
};