import { z } from "zod";

export const feeHeadCreateInputSchema = z.object({
  code: z.string().trim().min(1, "Code is required"),
  name: z.string().trim().min(1, "Name is required"),
  isActive: z.boolean().optional(),
});

export const feeHeadUpdateInputSchema = feeHeadCreateInputSchema.partial();

export type FeeHeadCreateInput = z.infer<typeof feeHeadCreateInputSchema>;
export type FeeHeadUpdateInput = z.infer<typeof feeHeadUpdateInputSchema>;

export const validateFeeHeadCreate = (data: unknown) => feeHeadCreateInputSchema.parse(data);
export const validateFeeHeadUpdate = (data: unknown) => feeHeadUpdateInputSchema.parse(data);
