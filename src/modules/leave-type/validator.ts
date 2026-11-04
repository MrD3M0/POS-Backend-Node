import { z } from "zod";

export const leaveTypeCreateInputSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  isPaid: z.boolean().optional().default(true),
  yearlyAllowed: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const leaveTypeUpdateInputSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().max(255).optional(),
  isPaid: z.boolean().optional(),
  yearlyAllowed: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type LeaveTypeCreateInput = z.infer<typeof leaveTypeCreateInputSchema>;
export type LeaveTypeUpdateInput = z.infer<typeof leaveTypeUpdateInputSchema>;

export const validateLeaveTypeCreate = (data: unknown) => {
  return leaveTypeCreateInputSchema.parse(data);
};

export const validateLeaveTypeUpdate = (data: unknown) => {
  return leaveTypeUpdateInputSchema.parse(data);
};
