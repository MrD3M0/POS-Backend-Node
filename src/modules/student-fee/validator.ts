import { z } from "zod";

export const studentFeeCreateInputSchema = z.object({
  studentId: z.string().uuid("Invalid Student ID format"),
  feeStructureId: z.string().uuid("Invalid Fee Structure ID format"),
});

export type StudentFeeCreateInput = z.infer<typeof studentFeeCreateInputSchema>;
export type StudentFeeUpdateInput = z.infer<typeof studentFeeCreateInputSchema>;

export const validateStudentFeeCreate = (data: unknown) => {
  return studentFeeCreateInputSchema.parse(data);
};