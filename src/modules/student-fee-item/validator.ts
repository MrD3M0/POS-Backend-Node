import { z } from "zod";
import { positiveMoneySchema, nonNegativeMoneySchema } from "@/lib/money";

const bsDateSchema = (field: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${field} must be a BS date YYYY-MM-DD`);

// netAmount is computed server-side (amount - discountAmount) and is not
// accepted from the client.
const baseItemSchema = z.object({
  studentFeeId: z.string().uuid("Invalid Student Fee ID format"),
  feeHeadId: z.string().uuid("Invalid Fee Head ID format"),
  feeStructureItemId: z
    .string()
    .uuid("Invalid Fee Structure Item ID format")
    .optional()
    .nullable(),
  termNumber: z.number().int().min(1).optional().nullable(),
  description: z.string().max(500).optional(),
  amount: positiveMoneySchema,
  discountAmount: nonNegativeMoneySchema.optional(),
  discountReason: z.string().trim().max(500).optional(),
  isSkipped: z.boolean().optional(),
  skipReason: z.string().trim().max(500).optional(),
  dueDateBs: bsDateSchema("dueDateBs").optional(),
});

export const studentFeeItemCreateInputSchema = baseItemSchema;

export const studentFeeItemUpdateInputSchema = baseItemSchema
  .omit({
    studentFeeId: true,
    feeHeadId: true,
    feeStructureItemId: true,
    termNumber: true,
  })
  .partial();

export type StudentFeeItemCreateInput = z.infer<typeof studentFeeItemCreateInputSchema>;
export type StudentFeeItemUpdateInput = z.infer<typeof studentFeeItemUpdateInputSchema>;

export const validateStudentFeeItemCreate = (data: unknown) => {
  return studentFeeItemCreateInputSchema.parse(data);
};

export const validateStudentFeeItemUpdate = (data: unknown) => {
  return studentFeeItemUpdateInputSchema.parse(data);
};
