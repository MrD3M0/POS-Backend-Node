"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
exports.hashOtpCode = hashOtpCode;
exports.verifyOtpCodeHash = verifyOtpCodeHash;
exports.generateOtpCode = generateOtpCode;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
require("dotenv/config");
const OTP_DIGITS = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
function otpSecret() {
    const secret = process.env.OTP_HMAC_SECRET || process.env.JWT_SECRET;
    if (!secret)
        throw new Error("OTP_HMAC_SECRET or JWT_SECRET is not defined in .env");
    return secret;
}
// HMAC-SHA256 hash only — the plain code is never stored.
function hashOtpCode(code) {
    return crypto_1.default.createHmac("sha256", otpSecret()).update(code).digest("hex");
}
function verifyOtpCodeHash(code, codeHash) {
    const a = Buffer.from(hashOtpCode(code), "utf8");
    const b = Buffer.from(codeHash, "utf8");
    if (a.length !== b.length)
        return false;
    return crypto_1.default.timingSafeEqual(a, b);
}
function generateOtpCode() {
    return crypto_1.default.randomInt(0, 10 ** OTP_DIGITS).toString().padStart(OTP_DIGITS, "0");
}
exports.AuthService = {
    constants: {
        OTP_TTL_MS,
        OTP_MAX_ATTEMPTS,
        OTP_RESEND_COOLDOWN_MS,
    },
    hashOtpCode,
    verifyOtpCodeHash,
    generateOtpCode,
    generateToken: (userId, role) => {
        const secret = process.env.JWT_SECRET;
        if (!secret)
            throw new Error("JWT_SECRET is not defined in .env");
        return jsonwebtoken_1.default.sign({ userId, role, type: "access" }, secret, {
            expiresIn: Number(process.env.JWT_EXPIRES_IN) || 3600,
        });
    },
    generateRefreshToken: (userId) => {
        const secret = process.env.JWT_SECRET;
        if (!secret)
            throw new Error("JWT_SECRET is not defined in .env");
        return jsonwebtoken_1.default.sign({ userId, type: "refresh" }, secret, {
            expiresIn: Number(process.env.JWT_REFRESH_EXPIRES_IN) || 86400,
        });
    },
    verifyToken: (token) => {
        try {
            const secret = process.env.JWT_SECRET;
            if (!secret)
                throw new Error("JWT_SECRET is not defined");
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            return decoded;
        }
        catch (error) {
            return null;
        }
    },
    // Only accepts tokens that were created as refresh tokens
    verifyRefreshToken: (token) => {
        const decoded = exports.AuthService.verifyToken(token);
        if (!decoded || typeof decoded === "string")
            return null;
        if (decoded.type !== "refresh" || typeof decoded.userId !== "string")
            return null;
        return { userId: decoded.userId };
    },
};
