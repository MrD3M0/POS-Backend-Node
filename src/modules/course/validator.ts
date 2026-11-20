import { z } from "zod";

const courseShape = {
  code: z.string().min(1, "Course code is required").max(50, "Course code is too long"),
  name: z.string().min(1, "Course name is required").max(255, "Course name is too long"),
  system: z.enum(["SEMESTER", "YEARLY"], { message: "System must be SEMESTER or YEARLY" }),
  totalTerms: z.number().int().positive("Total terms must be a positive integer"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
};

// DECISIONS/task F3: SEMESTER system = 8 terms, YEARLY system = 4 terms.
const checkTotalTerms = (data: { system?: string; totalTerms?: number }, ctx: z.RefinementCtx) => {
  if (data.system === "SEMESTER" && data.totalTerms !== undefined && data.totalTerms !== 8) {
    ctx.addIssue({
      code: "custom",
      path: ["totalTerms"],
      message: "SEMESTER courses must have totalTerms = 8",
    });
  }
  if (data.system === "YEARLY" && data.totalTerms !== undefined && data.totalTerms !== 4) {
    ctx.addIssue({
      code: "custom",
      path: ["totalTerms"],
      message: "YEARLY courses must have totalTerms = 4",
    });
  }
};

export const courseCreateInputSchema = z.object(courseShape).superRefine(checkTotalTerms);

// Partial updates are checked against the effective system/totalTerms in the
// service (a partial payload alone cannot prove the combined rule).
export const courseUpdateInputSchema = z.object(courseShape).partial();

export type CourseCreateInput = z.infer<typeof courseCreateInputSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateInputSchema>;

export const validateCourseCreate = (data: unknown) => {
  return courseCreateInputSchema.parse(data);
};

export const validateCourseUpdate = (data: unknown) => {
  return courseUpdateInputSchema.parse(data);
};
