import { z } from "zod";

export const feeHeadCreateInputSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean().optional(),
});

export type FeeHeadCreateInput = z.infer<typeof feeHeadCreateInputSchema>;
export type FeeHeadUpdateInput = z.infer<typeof feeHeadCreateInputSchema>;

export const validateFeeHeadCreate = (data: unknown) => {
  return feeHeadCreateInputSchema.parse(data);
};
