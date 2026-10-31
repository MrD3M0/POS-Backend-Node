import { z } from "zod";

export const studentAttendanceCreateInputSchema = z.object({
  sessionId: z.string().uuid("Invalid Session ID format"),
  studentId: z.string().uuid("Invalid Student ID format"),
  statusId: z.string().uuid("Invalid Attendance Status ID format"),
  remarks: z
    .string()
    .trim()
    .max(500, "Remarks are too long")
    .optional()
    .nullable(),
});

// Only the status and remarks can change after the record is created
export const studentAttendanceUpdateInputSchema = z.object({
  statusId: z.string().uuid("Invalid Attendance Status ID format").optional(),
  remarks: z
    .string()
    .trim()
    .max(500, "Remarks are too long")
    .optional()
    .nullable(),
});

// Mark a whole class for one session in a single request
export const studentAttendanceBulkInputSchema = z.object({
  sessionId: z.string().uuid("Invalid Session ID format"),
  records: z
    .array(
      z.object({
        studentId: z.string().uuid("Invalid Student ID format"),
        statusId: z.string().uuid("Invalid Attendance Status ID format"),
        remarks: z
          .string()
          .trim()
          .max(500, "Remarks are too long")
          .optional()
          .nullable(),
      }),
    )
    .min(1, "At least one attendance record is required")
    .max(500, "Too many records in one request"),
});

export type StudentAttendanceCreateInput = z.infer<
  typeof studentAttendanceCreateInputSchema
>;
export type StudentAttendanceUpdateInput = z.infer<
  typeof studentAttendanceUpdateInputSchema
>;
export type StudentAttendanceBulkInput = z.infer<
  typeof studentAttendanceBulkInputSchema
>;

export const validateStudentAttendanceCreate = (data: unknown) => {
  return studentAttendanceCreateInputSchema.parse(data);
};

export const validateStudentAttendanceUpdate = (data: unknown) => {
  return studentAttendanceUpdateInputSchema.parse(data);
};

export const validateStudentAttendanceBulk = (data: unknown) => {
  return studentAttendanceBulkInputSchema.parse(data);
};
