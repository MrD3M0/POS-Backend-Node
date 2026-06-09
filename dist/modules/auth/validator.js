"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateLogin = ValidateLogin;
exports.ValidateRegister = ValidateRegister;
const zod_1 = __importDefault(require("zod"));
const LoginSchema = zod_1.default.object({
    email: zod_1.default.email({ message: "Email is required" }),
    password: zod_1.default
        .string({ message: "Password is required" })
        .min(6, "Password must be at least 6 characters long"),
});
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
        .min(1, { message: "Email Cannot be empty" }),
    password: zod_1.default
        .string()
        .trim()
        .min(6, { message: "Password must be at least 14 characters" }),
});
function ValidateRegister(data) {
    return RegisterSchema.parse(data);
}
