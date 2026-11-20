import z from "zod";

export const gradeScaleItemCreateInputSchema = z.object({
  grade: z.string().trim().min(1, "Grade is required").max(20),
  minPercent: z.union([z.string(), z.number()]).transform(String),
  maxPercent: z.union([z.string(), z.number()]).transform(String),
  gradePoint: z.union([z.string(), z.number()]).transform(String),
  description: z.string().trim().max(255).optional().nullable(),
  isPassGrade: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const gradeScaleItemUpdateInputSchema = gradeScaleItemCreateInputSchema.partial();

export type GradeScaleItemCreateInput = z.infer<typeof gradeScaleItemCreateInputSchema>;
export type GradeScaleItemUpdateInput = z.infer<typeof gradeScaleItemUpdateInputSchema>;

export const validateGradeScaleItemCreate = (data: unknown) => gradeScaleItemCreateInputSchema.parse(data);
export const validateGradeScaleItemUpdate = (data: unknown) => gradeScaleItemUpdateInputSchema.parse(data);
