import { z } from "zod";

export const teachingAssignmentCreateInputSchema = z.object({
  teacherId: z.string().uuid("Invalid Teacher ID format"),
  batchTermSubjectId: z.string().uuid("Invalid Batch Term Subject ID format"),
  assignedDateBs: z.string().min(1, "Assigned date is required"),
  // null clears an existing end date; undefined leaves it unchanged.
  endDateBs: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const teachingAssignmentUpdateInputSchema =
  teachingAssignmentCreateInputSchema.partial();

export type TeachingAssignmentCreateInput = z.infer<typeof teachingAssignmentCreateInputSchema>;
export type TeachingAssignmentUpdateInput = z.infer<typeof teachingAssignmentUpdateInputSchema>;

export const validateTeachingAssignmentCreate = (data: unknown) => {
  return teachingAssignmentCreateInputSchema.parse(data);
};

export const validateTeachingAssignmentUpdate = (data: unknown) => {
  return teachingAssignmentUpdateInputSchema.parse(data);
};