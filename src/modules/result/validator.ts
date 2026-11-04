import { z } from "zod";

export const resultCreateInputSchema = z.object({
  studentId: z.string().uuid("Invalid Student ID format"),
  examId: z.string().uuid("Invalid Exam ID format"),
  totalMarks: z.number().min(0, "Total marks must be a positive number"),
  fullMarks: z.number().min(1, "Full marks must be greater than 0"),
  percentage: z.number().min(0, "Percentage must be between 0 and 100"),
  totalCreditHour: z.number().min(0, "Total credit hour must be >= 0"),
  gpa: z.number().min(0).max(4, "GPA must be between 0 and 4"),
  cgpa: z.number().min(0).max(4).optional().nullable(),
  isPassed: z.boolean(),
  status: z.enum(["PENDING", "SUBMITTED", "APPROVED", "PUBLISHED"], {
    message: "Status must be PENDING, SUBMITTED, APPROVED, or PUBLISHED",
  }).default("PENDING"),
  submittedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
  approvedBy: z.string().uuid("Invalid User ID format").optional().nullable(),
  approvedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
  remarks: z.string().max(1000, "Remarks too long").optional().nullable(),
});

export const resultUpdateInputSchema = resultCreateInputSchema.partial();

export type ResultCreateInput = z.infer<typeof resultCreateInputSchema>;
export type ResultUpdateInput = z.infer<typeof resultUpdateInputSchema>;

export const validateResultCreate = (data: unknown) => {
  return resultCreateInputSchema.parse(data);
};

export const validateResultUpdate = (data: unknown) => {
  return resultUpdateInputSchema.parse(data);
};
