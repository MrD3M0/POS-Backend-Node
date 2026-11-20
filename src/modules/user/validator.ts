import { z } from "zod";
import { strongPasswordSchema } from "@/utils/password";

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
  password: strongPasswordSchema,
  role: roleSchema,
  isActive: z.boolean().default(true),
  isEmailVerified: z.boolean().default(false),
});

export const userUpdateInputSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address").optional(),
  username: z.string().trim().min(3).max(50).optional().nullable(),
  role: roleSchema.optional(),
  isActive: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
  // Required when changing role, deactivating, or manually verifying email.
  reason: z.string().trim().min(3).max(255).optional(),
});

export const userResetPasswordInputSchema = z.object({
  password: strongPasswordSchema,
  reason: z.string().trim().min(3).max(255).optional(),
});

export const userLinkPersonSchema = z.object({
  type: z.enum(["employee", "student"]),
  id: z.string().uuid("Invalid person id"),
  reason: z.string().trim().min(3).max(255).optional(),
});

export const userVerifyEmailSchema = z.object({
  reason: z.string().trim().min(3, "A reason is required").max(255),
});

export type UserCreateInput = z.infer<typeof userCreateInputSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateInputSchema>;
export type UserResetPasswordInput = z.infer<typeof userResetPasswordInputSchema>;
export type UserLinkPersonInput = z.infer<typeof userLinkPersonSchema>;
export type UserVerifyEmailInput = z.infer<typeof userVerifyEmailSchema>;

export const validateUserCreate = (data: unknown) => userCreateInputSchema.parse(data);
export const validateUserUpdate = (data: unknown) => userUpdateInputSchema.parse(data);
export const validateUserResetPassword = (data: unknown) => userResetPasswordInputSchema.parse(data);
export const validateUserLinkPerson = (data: unknown) => userLinkPersonSchema.parse(data);
export const validateUserVerifyEmail = (data: unknown) => userVerifyEmailSchema.parse(data);
