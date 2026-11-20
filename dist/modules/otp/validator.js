"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOtpCreate = exports.otpCreateInputSchema = exports.otpPurposeEnum = void 0;
const zod_1 = require("zod");
exports.otpPurposeEnum = zod_1.z.enum([
    "EMAIL_VERIFY",
    "PASSWORD_RESET",
    "LOGIN",
]);
exports.otpCreateInputSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("Invalid User ID format"),
    purpose: exports.otpPurposeEnum,
    // Plaintext code; the service stores only an HMAC-SHA256 hash (see schema note on Otp)
    code: zod_1.z.string().regex(/^\d{6}$/, "OTP code must be exactly 6 digits"),
    expiresAt: zod_1.z.coerce.date(),
});
const validateOtpCreate = (data) => {
    return exports.otpCreateInputSchema.parse(data);
};
exports.validateOtpCreate = validateOtpCreate;
