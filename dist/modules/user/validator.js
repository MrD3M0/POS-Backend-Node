"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserVerifyEmail = exports.validateUserLinkPerson = exports.validateUserResetPassword = exports.validateUserUpdate = exports.validateUserCreate = exports.userVerifyEmailSchema = exports.userLinkPersonSchema = exports.userResetPasswordInputSchema = exports.userUpdateInputSchema = exports.userCreateInputSchema = exports.roleSchema = void 0;
const zod_1 = require("zod");
const password_1 = require("@/utils/password");
exports.roleSchema = zod_1.z.enum([
    "ADMIN",
    "PRINCIPAL",
    "ACCOUNTANT",
    "TEACHER",
    "STAFF",
    "STUDENT",
]);
exports.userCreateInputSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email("Invalid email address"),
    username: zod_1.z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters")
        .max(50, "Username is too long")
        .optional()
        .nullable(),
    password: password_1.strongPasswordSchema,
    role: exports.roleSchema,
    isActive: zod_1.z.boolean().default(true),
    isEmailVerified: zod_1.z.boolean().default(false),
});
exports.userUpdateInputSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email("Invalid email address").optional(),
    username: zod_1.z.string().trim().min(3).max(50).optional().nullable(),
    role: exports.roleSchema.optional(),
    isActive: zod_1.z.boolean().optional(),
    isEmailVerified: zod_1.z.boolean().optional(),
    // Required when changing role, deactivating, or manually verifying email.
    reason: zod_1.z.string().trim().min(3).max(255).optional(),
});
exports.userResetPasswordInputSchema = zod_1.z.object({
    password: password_1.strongPasswordSchema,
    reason: zod_1.z.string().trim().min(3).max(255).optional(),
});
exports.userLinkPersonSchema = zod_1.z.object({
    type: zod_1.z.enum(["employee", "student"]),
    id: zod_1.z.string().uuid("Invalid person id"),
    reason: zod_1.z.string().trim().min(3).max(255).optional(),
});
exports.userVerifyEmailSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(3, "A reason is required").max(255),
});
const validateUserCreate = (data) => exports.userCreateInputSchema.parse(data);
exports.validateUserCreate = validateUserCreate;
const validateUserUpdate = (data) => exports.userUpdateInputSchema.parse(data);
exports.validateUserUpdate = validateUserUpdate;
const validateUserResetPassword = (data) => exports.userResetPasswordInputSchema.parse(data);
exports.validateUserResetPassword = validateUserResetPassword;
const validateUserLinkPerson = (data) => exports.userLinkPersonSchema.parse(data);
exports.validateUserLinkPerson = validateUserLinkPerson;
const validateUserVerifyEmail = (data) => exports.userVerifyEmailSchema.parse(data);
exports.validateUserVerifyEmail = validateUserVerifyEmail;
