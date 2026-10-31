import { z } from "zod";

export const attendanceStatusCreateInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(50, "Code is too long")
    .transform((value) => value.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name is too long"),
  // 1 = full pay/present, 0.5 = half day, 0 = no pay
  salaryFactor: z.number().min(0).max(1).default(1),
  isActive: z.boolean().default(true),
});

export const attendanceStatusUpdateInputSchema =
  attendanceStatusCreateInputSchema.partial();

export type AttendanceStatusCreateInput = z.infer<
  typeof attendanceStatusCreateInputSchema
>;
export type AttendanceStatusUpdateInput = z.infer<
  typeof attendanceStatusUpdateInputSchema
>;

export const validateAttendanceStatusCreate = (data: unknown) => {
  return attendanceStatusCreateInputSchema.parse(data);
};

export const validateAttendanceStatusUpdate = (data: unknown) => {
  return attendanceStatusUpdateInputSchema.parse(data);
};
