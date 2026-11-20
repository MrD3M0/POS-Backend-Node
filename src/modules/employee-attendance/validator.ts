import { z } from "zod";
import { assertBsDateString } from "@/utils/bs-date";

const bsDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD (BS)")
  .refine((v) => {
    try {
      assertBsDateString(v, "dateBs");
      return true;
    } catch {
      return false;
    }
  }, "dateBs must be a valid BS date (see bs-date table)");

export const employeeAttendanceCreateInputSchema = z
  .object({
    employeeId: z.string().uuid("Invalid Employee ID format"),
    dateBs: bsDateString,
    status: z.enum(["PRESENT", "ABSENT", "LEAVE", "LATE"]),
    leaveTypeId: z
      .string()
      .uuid("Invalid Leave Type ID format")
      .optional()
      .nullable(),
    remarks: z.string().max(1000).optional().nullable(),
    isLocked: z.boolean().optional(), // honoured only by admins on bulk-mark
  })
  .superRefine((data, ctx) => {
    if (data.status === "LEAVE" && !data.leaveTypeId) {
      ctx.addIssue({
        code: "custom",
        path: ["leaveTypeId"],
        message:
          "leaveTypeId is required when status is LEAVE (paid leave needs a LeaveType)",
      });
    }
    if (data.status !== "LEAVE" && data.leaveTypeId) {
      ctx.addIssue({
        code: "custom",
        path: ["leaveTypeId"],
        message: "leaveTypeId must be empty unless status is LEAVE",
      });
    }
  });

export const employeeAttendanceUpdateInputSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LEAVE", "LATE"]).optional(),
  leaveTypeId: z
    .string()
    .uuid("Invalid Leave Type ID format")
    .optional()
    .nullable(),
  remarks: z.string().max(1000).optional().nullable(),
});

export const employeeAttendanceBulkInputSchema = z.object({
  records: z.array(employeeAttendanceCreateInputSchema).min(1).max(5000),
});

export type EmployeeAttendanceBulkInput = z.infer<
  typeof employeeAttendanceBulkInputSchema
>;

export type EmployeeAttendanceCreateInput = z.infer<
  typeof employeeAttendanceCreateInputSchema
>;
export type EmployeeAttendanceUpdateInput = z.infer<
  typeof employeeAttendanceUpdateInputSchema
>;

export const validateEmployeeAttendanceCreate = (data: unknown) =>
  employeeAttendanceCreateInputSchema.parse(data);
export const validateEmployeeAttendanceUpdate = (data: unknown) =>
  employeeAttendanceUpdateInputSchema.parse(data);
export const validateEmployeeAttendanceBulk = (data: unknown) =>
  employeeAttendanceBulkInputSchema.parse(data);
