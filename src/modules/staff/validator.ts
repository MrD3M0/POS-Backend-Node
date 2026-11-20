import { z } from "zod";

export const staffCreateInputSchema = z.object({
  employeeId: z.string().uuid("Invalid Employee ID format"),
  department: z.string().max(100, "Department is too long").optional().nullable(),
  createdBy: z.string().uuid("Invalid Creator User ID format").optional().nullable(),
});

export const staffUpdateInputSchema = staffCreateInputSchema.partial().extend({
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long").optional(),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long").optional(),
  phone: z.string().max(20, "Phone number is too long").optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  temporaryAddress: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export type StaffCreateInput = z.infer<typeof staffCreateInputSchema>;
export type StaffUpdateInput = z.infer<typeof staffUpdateInputSchema>;

export const validateStaffCreate = (data: unknown) => {
  return staffCreateInputSchema.parse(data);
};

export const validateStaffUpdate = (data: unknown) => {
  return staffUpdateInputSchema.parse(data);
};