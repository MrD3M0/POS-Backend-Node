import { z } from "zod";

export const workflowStatusCreateInputSchema = z.object({
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
  isActive: z.boolean().default(true),
});

export const workflowStatusUpdateInputSchema =
  workflowStatusCreateInputSchema.partial();

export type WorkflowStatusCreateInput = z.infer<
  typeof workflowStatusCreateInputSchema
>;
export type WorkflowStatusUpdateInput = z.infer<
  typeof workflowStatusUpdateInputSchema
>;

export const validateWorkflowStatusCreate = (data: unknown) => {
  return workflowStatusCreateInputSchema.parse(data);
};

export const validateWorkflowStatusUpdate = (data: unknown) => {
  return workflowStatusUpdateInputSchema.parse(data);
};
