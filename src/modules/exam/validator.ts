import { z } from "zod";
import { parseBsDate } from "@/utils/bs-date";

const bsDate = (field: string) =>
  z
    .string()
    .refine((v) => parseBsDate(v) !== null, `${field} must be a valid BS date YYYY-MM-DD`);

const examShape = {
  batchTermId: z.string().uuid("Invalid Batch Term ID format"),
  examTypeId: z.string().uuid("Invalid Exam Type ID format"),
  name: z.string().min(1, "Exam name is required"),
  startDateBs: bsDate("startDateBs").optional().nullable(),
  endDateBs: bsDate("endDateBs").optional().nullable(),
};

export const examCreateInputSchema = z
  .object(examShape)
  .superRefine((data, ctx) => {
    if (data.startDateBs && data.endDateBs && data.endDateBs < data.startDateBs) {
      ctx.addIssue({
        code: "custom",
        path: ["endDateBs"],
        message: "endDateBs must be on or after startDateBs",
      });
    }
  });

// NOTE: .partial() cannot be applied to a schema with object refinements
// (zod throws at import time), so the update schema reuses the base shape.
export const examUpdateInputSchema = z.object(examShape).partial();

export type ExamCreateInput = z.infer<typeof examCreateInputSchema>;
export type ExamUpdateInput = z.infer<typeof examUpdateInputSchema>;

export const validateExamCreate = (data: unknown) => {
  return examCreateInputSchema.parse(data);
};

export const validateExamUpdate = (data: unknown) => {
  return examUpdateInputSchema.parse(data);
};
