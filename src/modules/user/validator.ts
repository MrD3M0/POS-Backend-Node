import { z } from "zod";

export const roleSchema = z.enum([
  "ADMIN",
  "PRINCIPAL",
  "ACCOUNTANT",
  "TEACHER",
  "STAFF",
  "STUDENT",
]);

export const userCreateInputSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username is too long")
    .optional()
    .nullable(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  role: roleSchema,
  isActive: z.boolean().default(true),
  isEmailVerified: z.boolean().default(false),
});

// Password is changed through its own endpoint
export const userUpdateInputSchema = userCreateInputSchema
  .omit({ password: true })
  .partial();

export const userResetPasswordInputSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export type UserCreateInput = z.infer<typeof userCreateInputSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateInputSchema>;
export type UserResetPasswordInput = z.infer<
  typeof userResetPasswordInputSchema
>;

export const validateUserCreate = (data: unknown) => {
  return userCreateInputSchema.parse(data);
};

export const validateUserUpdate = (data: unknown) => {
  return userUpdateInputSchema.parse(data);
};

export const validateUserResetPassword = (data: unknown) => {
  return userResetPasswordInputSchema.parse(data);
};
