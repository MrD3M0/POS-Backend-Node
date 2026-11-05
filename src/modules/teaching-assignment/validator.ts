import { z } from "zod";

export const teachingAssignmentCreateInputSchema = z.object({
  teacherId: z.string().uuid("Invalid Teacher ID format"),
  batchTermSubjectId: z.string().uuid("Invalid Batch Term Subject ID format"),
  assignedDateBs: z.string().min(1, "Assigned date is required"),
  endDateBs: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type TeachingAssignmentCreateInput = z.infer<typeof teachingAssignmentCreateInputSchema>;
export type TeachingAssignmentUpdateInput = z.infer<typeof teachingAssignmentCreateInputSchema>;

export const validateTeachingAssignmentCreate = (data: unknown) => {
  return teachingAssignmentCreateInputSchema.parse(data);
};