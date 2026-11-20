import { z } from "zod";

const creditHourSchema = z.number().positive("Credit hour must be a positive number").max(999.9, "Credit hour is too large");

/** Elective seats — how many students may pick this elective. Null/omitted = unlimited. */
const maxStudentsSchema = z
  .number()
  .int("Number of students must be a whole number")
  .min(1, "Number of students must be at least 1")
  .max(9999, "Number of students is too large")
  .nullable()
  .optional();

export const batchTermSubjectCreateInputSchema = z.object({
  batchTermId: z.string().uuid("Invalid BatchTerm ID format"),
  subjectId: z.string().uuid("Invalid Subject ID format"),
  creditHour: creditHourSchema,
  isElective: z.boolean().default(false),
  maxStudents: maxStudentsSchema,
});

export const batchTermSubjectUpdateInputSchema = batchTermSubjectCreateInputSchema.partial();

/** Body for POST /batch-term-subject/bulk — atomic all-or-nothing assignment. */
export const batchTermSubjectBulkCreateInputSchema = z.object({
  batchTermId: z.string().uuid("Invalid BatchTerm ID format"),
  subjects: z
    .array(
      z.object({
        subjectId: z.string().uuid("Invalid Subject ID format"),
        creditHour: creditHourSchema,
        isElective: z.boolean().default(false),
        maxStudents: maxStudentsSchema,
      }),
    )
    .min(1, "At least one subject is required")
    .max(50, "A maximum of 50 subjects can be assigned at once"),
});

export type BatchTermSubjectCreateInput = z.infer<typeof batchTermSubjectCreateInputSchema>;
export type BatchTermSubjectUpdateInput = z.infer<typeof batchTermSubjectUpdateInputSchema>;
export type BatchTermSubjectBulkCreateInput = z.infer<typeof batchTermSubjectBulkCreateInputSchema>;

export const validateBatchTermSubjectCreate = (data: unknown) => {
  return batchTermSubjectCreateInputSchema.parse(data);
};

export const validateBatchTermSubjectUpdate = (data: unknown) => {
  return batchTermSubjectUpdateInputSchema.parse(data);
};

export const validateBatchTermSubjectBulkCreate = (data: unknown) => {
  return batchTermSubjectBulkCreateInputSchema.parse(data);
};