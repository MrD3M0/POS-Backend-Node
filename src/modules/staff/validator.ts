import { z } from "zod";

export const staffCreateInputSchema = z.object({
  employeeId: z.string().uuid("Invalid Employee ID format"),
  department: z.string().max(100, "Department is too long").optional().nullable(),
  createdBy: z.string().uuid("Invalid Creator User ID format").optional().nullable(),
});

export type StaffCreateInput = z.infer<typeof staffCreateInputSchema>;
export type StaffUpdateInput = z.infer<typeof staffCreateInputSchema>;

export const validateStaffCreate = (data: unknown) => {
  return staffCreateInputSchema.parse(data);
};