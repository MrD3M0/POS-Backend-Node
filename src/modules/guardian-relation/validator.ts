import { z } from "zod";

export const guardianRelationCreateInputSchema = z.object({
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
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const guardianRelationUpdateInputSchema =
  guardianRelationCreateInputSchema.partial();

export type GuardianRelationCreateInput = z.infer<
  typeof guardianRelationCreateInputSchema
>;
export type GuardianRelationUpdateInput = z.infer<
  typeof guardianRelationUpdateInputSchema
>;

export const validateGuardianRelationCreate = (data: unknown) => {
  return guardianRelationCreateInputSchema.parse(data);
};

export const validateGuardianRelationUpdate = (data: unknown) => {
  return guardianRelationUpdateInputSchema.parse(data);
};
