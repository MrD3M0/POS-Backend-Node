"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpPurposeSchema = void 0;
exports.ValidateLogin = ValidateLogin;
exports.ValidateRegister = ValidateRegister;
exports.ValidateRequestOtp = ValidateRequestOtp;
exports.ValidateVerifyOtp = ValidateVerifyOtp;
const zod_1 = __importDefault(require("zod"));
const password_1 = require("@/utils/password");
// Login accepts email OR username (or a generic `identifier` that may be either).
// Normalized to `identifier` so controllers have a single field to query on.
const LoginSchema = zod_1.default
    .object({
    identifier: zod_1.default.string().trim().min(1, "Email or username is required").optional(),
    email: zod_1.default.string().trim().min(1).optional(),
    username: zod_1.default.string().trim().min(1).optional(),
    password: zod_1.default.string({ message: "Password is required" }).min(1, "Password is required"),
})
    .transform((v) => ({
    identifier: (v.identifier ?? v.email ?? v.username ?? "").trim(),
    password: v.password,
}))
    .pipe(zod_1.default.object({
    identifier: zod_1.default.string().min(1, "Email or username is required"),
    password: zod_1.default.string().min(1, "Password is required"),
}));
function ValidateLogin(data) {
    return LoginSchema.parse(data);
}
const RegisterSchema = zod_1.default.object({
    username: zod_1.default
        .string({ message: "Username is required" })
        .trim()
        .min(1, { message: "Username Cannot be empty" }),
    email: zod_1.default
        .email({ message: "Email is required" })
        .trim()
        .toLowerCase()
        .min(1, { message: "Email Cannot be empty" }),
    password: password_1.strongPasswordSchema,
});
function ValidateRegister(data) {
    return RegisterSchema.parse(data);
}
exports.otpPurposeSchema = zod_1.default.enum(["EMAIL_VERIFY", "PASSWORD_RESET", "LOGIN"]);
const RequestOtpSchema = zod_1.default.object({
    email: zod_1.default.email({ message: "Email is required" }).trim().toLowerCase(),
    purpose: exports.otpPurposeSchema.default("EMAIL_VERIFY"),
});
function ValidateRequestOtp(data) {
    return RequestOtpSchema.parse(data);
}
const VerifyOtpSchema = zod_1.default.object({
    email: zod_1.default.email({ message: "Email is required" }).trim().toLowerCase(),
    purpose: exports.otpPurposeSchema.default("EMAIL_VERIFY"),
    code: zod_1.default.string().regex(/^\d{6}$/, "Code must be exactly 6 digits"),
});
function ValidateVerifyOtp(data) {
    return VerifyOtpSchema.parse(data);
}
