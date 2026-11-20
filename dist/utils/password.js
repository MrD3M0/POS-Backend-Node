"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strongPasswordSchema = void 0;
exports.isStrongPassword = isStrongPassword;
exports.maskBankAccountNo = maskBankAccountNo;
const zod_1 = require("zod");
// Min 8 chars, at least one upper, one lower, one digit. bcrypt for storage.
exports.strongPasswordSchema = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password is too long")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a digit");
function isStrongPassword(pw) {
    return exports.strongPasswordSchema.safeParse(pw).success;
}
// DECISIONS.md Feature 2: "***1234" form, stored value never returned as-is.
function maskBankAccountNo(value) {
    if (value == null || value === "")
        return value ?? null;
    if (value.length <= 4)
        return "****" + value.slice(-4);
    return "****" + value.slice(-4);
}
