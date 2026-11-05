import { z } from "zod";

export const studentFeeItemCreateInputSchema = z.object({
  studentFeeId: z.string().uuid("Invalid Student Fee ID format"),
  feeHeadId: z.string().uuid("Invalid Fee Head ID format"),
  feeStructureItemId: z.string().uuid("Invalid Fee Structure Item ID format").optional(),
  termNumber: z.number().int().min(1),
  description: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  discountAmount: z.string().optional(),
  discountReason: z.string().optional(),
  netAmount: z.string().min(1, "Net amount is required"),
  dueDateBs: z.string().optional(),
});

export type StudentFeeItemCreateInput = z.infer<typeof studentFeeItemCreateInputSchema>;
export type StudentFeeItemUpdateInput = z.infer<typeof studentFeeItemCreateInputSchema>;

export const validateStudentFeeItemCreate = (data: unknown) => {
  return studentFeeItemCreateInputSchema.parse(data);
};