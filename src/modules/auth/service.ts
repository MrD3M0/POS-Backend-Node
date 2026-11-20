import jwt from "jsonwebtoken";
import crypto from "crypto";
import "dotenv/config";

const OTP_DIGITS = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

function otpSecret(): string {
  const secret = process.env.OTP_HMAC_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("OTP_HMAC_SECRET or JWT_SECRET is not defined in .env");
  return secret;
}

// HMAC-SHA256 hash only — the plain code is never stored.
export function hashOtpCode(code: string): string {
  return crypto.createHmac("sha256", otpSecret()).update(code).digest("hex");
}

export function verifyOtpCodeHash(code: string, codeHash: string): boolean {
  const a = Buffer.from(hashOtpCode(code), "utf8");
  const b = Buffer.from(codeHash, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function generateOtpCode(): string {
  return crypto.randomInt(0, 10 ** OTP_DIGITS).toString().padStart(OTP_DIGITS, "0");
}

export const AuthService = {
  constants: {
    OTP_TTL_MS,
    OTP_MAX_ATTEMPTS,
    OTP_RESEND_COOLDOWN_MS,
  },
  hashOtpCode,
  verifyOtpCodeHash,
  generateOtpCode,
  generateToken: (userId: string, role: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined in .env");

    return jwt.sign({ userId, role, type: "access" }, secret, {
      expiresIn: Number(process.env.JWT_EXPIRES_IN) || 3600,
    });
  },
  generateRefreshToken: (userId: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined in .env");

    return jwt.sign({ userId, type: "refresh" }, secret, {
      expiresIn: Number(process.env.JWT_REFRESH_EXPIRES_IN) || 86400,
    });
  },
  verifyToken: (token: string) => {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error("JWT_SECRET is not defined");
      const decoded = jwt.verify(token, secret);
      return decoded;
    } catch (error) {
      return null;
    }
  },
  // Only accepts tokens that were created as refresh tokens
  verifyRefreshToken: (token: string): { userId: string } | null => {
    const decoded = AuthService.verifyToken(token);
    if (!decoded || typeof decoded === "string") return null;
    if (decoded.type !== "refresh" || typeof decoded.userId !== "string")
      return null;
    return { userId: decoded.userId };
  },
};
