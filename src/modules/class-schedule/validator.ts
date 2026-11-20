import { z } from "zod";

const dayOfWeekSchema = z.enum([
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
], { message: "dayOfWeek must be one of SUNDAY..SATURDAY" });

export const classScheduleCreateInputSchema = z.object({
  teachingAssignmentId: z.string().uuid("Invalid TeachingAssignment ID format"),
  periodId: z.string().uuid("Invalid Period ID format"),
  dayOfWeek: dayOfWeekSchema,
  room: z.string().max(50, "Room is too long").optional().nullable(),
  effectiveFromBs: z.string().min(1, "Effective from date is required"),
  effectiveToBs: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const classScheduleUpdateInputSchema = classScheduleCreateInputSchema.partial();

export type ClassScheduleCreateInput = z.infer<typeof classScheduleCreateInputSchema>;
export type ClassScheduleUpdateInput = z.infer<typeof classScheduleUpdateInputSchema>;

export const validateClassScheduleCreate = (data: unknown) => classScheduleCreateInputSchema.parse(data);
export const validateClassScheduleUpdate = (data: unknown) => classScheduleUpdateInputSchema.parse(data);