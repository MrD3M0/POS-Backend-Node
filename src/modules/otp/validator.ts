import { z } from "zod";

export const otpCreateInputSchema = z.object({
  userId: z.string().uuid("Invalid User ID format"),
  code: z.string().min(1, "OTP code is required"),
  expiresAt: z.string().min(1, "Expiration time is required"),
});

export type OtpCreateInput = z.infer<typeof otpCreateInputSchema>;
export type OtpUpdateInput = z.infer<typeof otpCreateInputSchema>;

export const validateOtpCreate = (data: unknown) => {
  return otpCreateInputSchema.parse(data);
};