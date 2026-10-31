import { z } from "zod";

export const teacherCreateInputSchema = z.object({
  employeeId: z.string().uuid("Invalid Employee ID format"),
  qualification: z.string().max(255, "Qualification is too long").optional().nullable(),
  specialization: z.string().max(255, "Specialization is too long").optional().nullable(),
  createdBy: z.string().uuid("Invalid Creator User ID format").optional().nullable(),
});

export type TeacherCreateInput = z.infer<typeof teacherCreateInputSchema>;
export type TeacherUpdateInput = z.infer<typeof teacherCreateInputSchema>;

export const validateTeacherCreate = (data: unknown) => {
  return teacherCreateInputSchema.parse(data);
};