import { z } from "zod";

// Min 8 chars, at least one upper, one lower, one digit. bcrypt for storage.
export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a digit");

export function isStrongPassword(pw: string): boolean {
  return strongPasswordSchema.safeParse(pw).success;
}

// DECISIONS.md Feature 2: "***1234" form, stored value never returned as-is.
export function maskBankAccountNo(value: string | null | undefined): string | null {
  if (value == null || value === "") return value ?? null;
  if (value.length <= 4) return "****" + value.slice(-4);
  return "****" + value.slice(-4);
}
