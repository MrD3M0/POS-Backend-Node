import z from "zod";
import { strongPasswordSchema } from "@/utils/password";

// Login accepts email OR username (or a generic `identifier` that may be either).
// Normalized to `identifier` so controllers have a single field to query on.
const LoginSchema = z
  .object({
    identifier: z.string().trim().min(1, "Email or username is required").optional(),
    email: z.string().trim().min(1).optional(),
    username: z.string().trim().min(1).optional(),
    password: z.string({ message: "Password is required" }).min(1, "Password is required"),
  })
  .transform((v) => ({
    identifier: (v.identifier ?? v.email ?? v.username ?? "").trim(),
    password: v.password,
  }))
  .pipe(
    z.object({
      identifier: z.string().min(1, "Email or username is required"),
      password: z.string().min(1, "Password is required"),
    }),
  );
export type T_LoginSchema = z.infer<typeof LoginSchema>;

export function ValidateLogin(data: unknown): T_LoginSchema {
  return LoginSchema.parse(data);
}

const RegisterSchema = z.object({
  username: z
    .string({ message: "Username is required" })
    .trim()
    .min(1, { message: "Username Cannot be empty" }),
  email: z
    .email({ message: "Email is required" })
    .trim()
    .toLowerCase()
    .min(1, { message: "Email Cannot be empty" }),
  password: strongPasswordSchema,
});

export type T_RegisterSchema = z.infer<typeof RegisterSchema>;

export function ValidateRegister(data: unknown): T_RegisterSchema {
  return RegisterSchema.parse(data);
}

export const otpPurposeSchema = z.enum(["EMAIL_VERIFY", "PASSWORD_RESET", "LOGIN"]);
export type T_OtpPurpose = z.infer<typeof otpPurposeSchema>;

const RequestOtpSchema = z.object({
  email: z.email({ message: "Email is required" }).trim().toLowerCase(),
  purpose: otpPurposeSchema.default("EMAIL_VERIFY"),
});
export type T_RequestOtpSchema = z.infer<typeof RequestOtpSchema>;
export function ValidateRequestOtp(data: unknown): T_RequestOtpSchema {
  return RequestOtpSchema.parse(data);
}

const VerifyOtpSchema = z.object({
  email: z.email({ message: "Email is required" }).trim().toLowerCase(),
  purpose: otpPurposeSchema.default("EMAIL_VERIFY"),
  code: z.string().regex(/^\d{6}$/, "Code must be exactly 6 digits"),
});
export type T_VerifyOtpSchema = z.infer<typeof VerifyOtpSchema>;
export function ValidateVerifyOtp(data: unknown): T_VerifyOtpSchema {
  return VerifyOtpSchema.parse(data);
}
