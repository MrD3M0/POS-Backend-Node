import { z } from "zod";

export const leaveTypeUpdateInputSchema = z.object({
  name: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
});

export type LeaveTypeUpdateInput = z.infer<typeof leaveTypeUpdateInputSchema>;
export const validateLeaveTypeUpdate = (data: unknown) => {
  return leaveTypeUpdateInputSchema.parse(data);
};
