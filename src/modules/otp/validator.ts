import { z } from "zod";

export const otpPurposeEnum = z.enum([
  "EMAIL_VERIFY",
  "PASSWORD_RESET",
  "LOGIN",
]);

export const otpCreateInputSchema = z.object({
  userId: z.string().uuid("Invalid User ID format"),
  purpose: otpPurposeEnum,
  // Plaintext code; the service stores only a hash (see schema note on Otp)
  code: z.string().min(4, "OTP code is too short").max(10),
  expiresAt: z.coerce.date(),
});

export type OtpCreateInput = z.infer<typeof otpCreateInputSchema>;
export type OtpUpdateInput = Partial<OtpCreateInput>;

export const validateOtpCreate = (data: unknown) => {
  return otpCreateInputSchema.parse(data);
};
