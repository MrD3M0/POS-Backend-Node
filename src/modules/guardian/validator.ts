import { z } from "zod";

export const guardianCreateInputSchema = z.object({
  studentId: z.string().uuid("Invalid Student ID format"),
  relationId: z.string().uuid("Invalid Guardian Relation ID format").optional(),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export type GuardianCreateInput = z.infer<typeof guardianCreateInputSchema>;
export type GuardianUpdateInput = z.infer<typeof guardianCreateInputSchema>;

export const validateGuardianCreate = (data: unknown) => {
  return guardianCreateInputSchema.parse(data);
};