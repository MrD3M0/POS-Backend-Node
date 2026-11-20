import { z } from "zod";

export const studentFeeCreateInputSchema = z.object({
  studentId: z.string().uuid("Invalid Student ID format"),
  // Optional: omitted = resolve batch override first, then course default.
  feeStructureId: z.string().uuid("Invalid Fee Structure ID format").optional(),
});

export const studentFeeBulkInputSchema = z
  .object({
    /** Assign this structure (default: the batch override / course default). */
    feeStructureId: z.string().uuid("Invalid Fee Structure ID format").optional(),
    /** Every student of this batch gets the structure. */
    batchId: z.string().uuid("Invalid Batch ID format").optional(),
    /** Or an explicit list of students. */
    studentIds: z
      .array(z.string().uuid("Invalid Student ID format"))
      .max(500)
      .optional(),
  })
  .refine((value) => Boolean(value.batchId || value.studentIds?.length), {
    message: "Pick a batch or a list of students",
    path: ["batchId"],
  });

export type StudentFeeCreateInput = z.infer<typeof studentFeeCreateInputSchema>;
export type StudentFeeUpdateInput = z.infer<typeof studentFeeCreateInputSchema>;
export type StudentFeeBulkInput = z.infer<typeof studentFeeBulkInputSchema>;

export const validateStudentFeeCreate = (data: unknown) => {
  return studentFeeCreateInputSchema.parse(data);
};

export const validateStudentFeeBulk = (data: unknown) => {
  return studentFeeBulkInputSchema.parse(data);
};
