import { z } from "zod";

export const attendanceSessionCreateInputSchema = z.object({
  teachingAssignmentId: z.string().uuid("Invalid Teaching Assignment ID format"),
  teacherId: z.string().uuid("Invalid Teacher ID format"),
  periodId: z.string().uuid("Invalid Period ID format"),
  dateBs: z.string().min(1, "Date is required"),
  isLocked: z.boolean().optional(),
});

export type AttendanceSessionCreateInput = z.infer<typeof attendanceSessionCreateInputSchema>;
export type AttendanceSessionUpdateInput = z.infer<typeof attendanceSessionCreateInputSchema>;

export const validateAttendanceSessionCreate = (data: unknown) => {
  return attendanceSessionCreateInputSchema.parse(data);
};