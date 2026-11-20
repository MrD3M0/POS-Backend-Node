"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmployeeAttendanceBulk = exports.validateEmployeeAttendanceUpdate = exports.validateEmployeeAttendanceCreate = exports.employeeAttendanceBulkInputSchema = exports.employeeAttendanceUpdateInputSchema = exports.employeeAttendanceCreateInputSchema = void 0;
const zod_1 = require("zod");
const bs_date_1 = require("@/utils/bs-date");
const bsDateString = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD (BS)")
    .refine((v) => {
    try {
        (0, bs_date_1.assertBsDateString)(v, "dateBs");
        return true;
    }
    catch {
        return false;
    }
}, "dateBs must be a valid BS date (see bs-date table)");
exports.employeeAttendanceCreateInputSchema = zod_1.z
    .object({
    employeeId: zod_1.z.string().uuid("Invalid Employee ID format"),
    dateBs: bsDateString,
    status: zod_1.z.enum(["PRESENT", "ABSENT", "LEAVE", "LATE"]),
    leaveTypeId: zod_1.z
        .string()
        .uuid("Invalid Leave Type ID format")
        .optional()
        .nullable(),
    remarks: zod_1.z.string().max(1000).optional().nullable(),
    isLocked: zod_1.z.boolean().optional(), // honoured only by admins on bulk-mark
})
    .superRefine((data, ctx) => {
    if (data.status === "LEAVE" && !data.leaveTypeId) {
        ctx.addIssue({
            code: "custom",
            path: ["leaveTypeId"],
            message: "leaveTypeId is required when status is LEAVE (paid leave needs a LeaveType)",
        });
    }
    if (data.status !== "LEAVE" && data.leaveTypeId) {
        ctx.addIssue({
            code: "custom",
            path: ["leaveTypeId"],
            message: "leaveTypeId must be empty unless status is LEAVE",
        });
    }
});
exports.employeeAttendanceUpdateInputSchema = zod_1.z.object({
    status: zod_1.z.enum(["PRESENT", "ABSENT", "LEAVE", "LATE"]).optional(),
    leaveTypeId: zod_1.z
        .string()
        .uuid("Invalid Leave Type ID format")
        .optional()
        .nullable(),
    remarks: zod_1.z.string().max(1000).optional().nullable(),
});
exports.employeeAttendanceBulkInputSchema = zod_1.z.object({
    records: zod_1.z.array(exports.employeeAttendanceCreateInputSchema).min(1).max(5000),
});
const validateEmployeeAttendanceCreate = (data) => exports.employeeAttendanceCreateInputSchema.parse(data);
exports.validateEmployeeAttendanceCreate = validateEmployeeAttendanceCreate;
const validateEmployeeAttendanceUpdate = (data) => exports.employeeAttendanceUpdateInputSchema.parse(data);
exports.validateEmployeeAttendanceUpdate = validateEmployeeAttendanceUpdate;
const validateEmployeeAttendanceBulk = (data) => exports.employeeAttendanceBulkInputSchema.parse(data);
exports.validateEmployeeAttendanceBulk = validateEmployeeAttendanceBulk;
