"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmployeeUpdate = exports.validateEmployeeCreate = exports.employeeUpdateInputSchema = exports.employeeCreateInputSchema = void 0;
const zod_1 = require("zod");
const password_1 = require("@/utils/password");
const roleSchema = zod_1.z.enum(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF", "STUDENT"]);
// Empty strings normalize to null so they never collide on @unique columns.
const nullIfEmpty = (v) => (typeof v === "string" && v.trim() === "" ? null : v);
exports.employeeCreateInputSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("Invalid User ID format").optional().nullable(),
    role: roleSchema.optional(),
    password: password_1.strongPasswordSchema.optional(),
    username: zod_1.z.string().trim().min(3).max(50).optional().nullable(),
    // Optional: server auto-generates EMP-XXXX sequentially within a transaction.
    employeeCode: zod_1.z.string().min(1, "Employee code is required").max(50, "Employee code is too long").optional(),
    firstName: zod_1.z.string().min(1, "First name is required").max(100, "First name is too long"),
    middleName: zod_1.z.string().max(100, "Middle name is too long").optional().nullable(),
    lastName: zod_1.z.string().min(1, "Last name is required").max(100, "Last name is too long"),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHERS"], { message: "Gender must be MALE, FEMALE, or OTHERS" }),
    dobBs: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
    phone: zod_1.z.string().max(20, "Phone number is too long").optional().nullable(),
    email: zod_1.z.string().email("Invalid email format").max(255, "Email is too long").optional().nullable(),
    permanentAddress: zod_1.z.string().optional().nullable(),
    temporaryAddress: zod_1.z.string().optional().nullable(),
    photoUrl: zod_1.z.string().url("Invalid URL format").optional().nullable(),
    designation: zod_1.z.string().min(1, "Designation is required").max(100, "Designation is too long"),
    joinDateBs: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    leaveDateBs: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
    panNo: zod_1.z.preprocess(nullIfEmpty, zod_1.z.string().max(20, "PAN number is too long").optional().nullable()),
    ssfNo: zod_1.z.preprocess(nullIfEmpty, zod_1.z.string().max(20, "SSF number is too long").optional().nullable()),
    bankName: zod_1.z.string().max(100, "Bank name is too long").optional().nullable(),
    bankAccountNo: zod_1.z.string().max(50, "Bank account number is too long").optional().nullable(),
    isActive: zod_1.z.boolean().default(true),
});
exports.employeeUpdateInputSchema = exports.employeeCreateInputSchema.partial();
const validateEmployeeCreate = (data) => {
    return exports.employeeCreateInputSchema.parse(data);
};
exports.validateEmployeeCreate = validateEmployeeCreate;
const validateEmployeeUpdate = (data) => {
    return exports.employeeUpdateInputSchema.parse(data);
};
exports.validateEmployeeUpdate = validateEmployeeUpdate;
