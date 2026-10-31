import { z } from "zod";

export const studentStatusCreateInputSchema = z.object({
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

export const studentStatusUpdateInputSchema =
  studentStatusCreateInputSchema.partial();

export type StudentStatusCreateInput = z.infer<
  typeof studentStatusCreateInputSchema
>;
export type StudentStatusUpdateInput = z.infer<
  typeof studentStatusUpdateInputSchema
>;

export const validateStudentStatusCreate = (data: unknown) => {
  return studentStatusCreateInputSchema.parse(data);
};

export const validateStudentStatusUpdate = (data: unknown) => {
  return studentStatusUpdateInputSchema.parse(data);
};
