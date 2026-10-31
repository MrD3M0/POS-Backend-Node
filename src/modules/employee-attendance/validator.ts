import { z } from "zod";

export const employeeAttendanceCreateInputSchema = z.object({
  employeeId: z.string().uuid("Invalid Employee ID format"),
  dateBs: z.string().min(1, "Date is required"),
  statusId: z.string().uuid("Invalid Status ID format").optional(),
  leaveTypeId: z.string().uuid("Invalid Leave Type ID format").optional(),
  remarks: z.string().optional(),
  isLocked: z.boolean().optional(),
});

export type EmployeeAttendanceCreateInput = z.infer<typeof employeeAttendanceCreateInputSchema>;
export type EmployeeAttendanceUpdateInput = z.infer<typeof employeeAttendanceCreateInputSchema>;

export const validateEmployeeAttendanceCreate = (data: unknown) => {
  return employeeAttendanceCreateInputSchema.parse(data);
};