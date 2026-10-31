import { z } from "zod";

export const courseSystemCreateInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(50, "Code is too long")
    .transform((value) => value.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name is too long"),
  isActive: z.boolean().default(true),
});

export const courseSystemUpdateInputSchema =
  courseSystemCreateInputSchema.partial();

export type CourseSystemCreateInput = z.infer<
  typeof courseSystemCreateInputSchema
>;
export type CourseSystemUpdateInput = z.infer<
  typeof courseSystemUpdateInputSchema
>;

export const validateCourseSystemCreate = (data: unknown) => {
  return courseSystemCreateInputSchema.parse(data);
};

export const validateCourseSystemUpdate = (data: unknown) => {
  return courseSystemUpdateInputSchema.parse(data);
};
