import { z } from "zod";

export const courseCreateInputSchema = z.object({
  code: z.string().min(1, "Course code is required").max(50, "Course code is too long"),
  name: z.string().min(1, "Course name is required").max(255, "Course name is too long"),
  system: z.enum(["SEMESTER", "YEARLY"], {
    errorMap: () => ({ message: "System must be SEMESTER or YEARLY" }),
  }),
  totalTerms: z.number().int().positive("Total terms must be a positive integer"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const courseUpdateInputSchema = courseCreateInputSchema.partial();

export type CourseCreateInput = z.infer<typeof courseCreateInputSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateInputSchema>;

export const validateCourseCreate = (data: unknown) => {
  return courseCreateInputSchema.parse(data);
};

export const validateCourseUpdate = (data: unknown) => {
  return courseUpdateInputSchema.parse(data);
};
