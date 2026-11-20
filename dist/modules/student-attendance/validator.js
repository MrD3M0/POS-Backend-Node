"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStudentAttendanceBulk = exports.validateStudentAttendanceUpdate = exports.validateStudentAttendanceCreate = exports.studentAttendanceBulkInputSchema = exports.studentAttendanceUpdateInputSchema = exports.studentAttendanceCreateInputSchema = exports.attendanceStatusEnum = void 0;
const zod_1 = require("zod");
// Native Postgres enum in the current schema (AttendanceStatus)
exports.attendanceStatusEnum = zod_1.z.enum([
    "PRESENT",
    "ABSENT",
    "LEAVE",
    "LATE",
]);
exports.studentAttendanceCreateInputSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid("Invalid Session ID format"),
    studentId: zod_1.z.string().uuid("Invalid Student ID format"),
    status: exports.attendanceStatusEnum,
    remarks: zod_1.z
        .string()
        .trim()
        .max(500, "Remarks are too long")
        .optional()
        .nullable(),
});
// Only the status and remarks can change after the record is created
exports.studentAttendanceUpdateInputSchema = zod_1.z.object({
    status: exports.attendanceStatusEnum.optional(),
    remarks: zod_1.z
        .string()
        .trim()
        .max(500, "Remarks are too long")
        .optional()
        .nullable(),
});
// Mark a whole class for one session in a single request
exports.studentAttendanceBulkInputSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid("Invalid Session ID format"),
    records: zod_1.z
        .array(zod_1.z.object({
        studentId: zod_1.z.string().uuid("Invalid Student ID format"),
        status: exports.attendanceStatusEnum,
        remarks: zod_1.z
            .string()
            .trim()
            .max(500, "Remarks are too long")
            .optional()
            .nullable(),
    }))
        .min(1, "At least one attendance record is required")
        .max(500, "Too many records in one request"),
});
const validateStudentAttendanceCreate = (data) => {
    return exports.studentAttendanceCreateInputSchema.parse(data);
};
exports.validateStudentAttendanceCreate = validateStudentAttendanceCreate;
const validateStudentAttendanceUpdate = (data) => {
    return exports.studentAttendanceUpdateInputSchema.parse(data);
};
exports.validateStudentAttendanceUpdate = validateStudentAttendanceUpdate;
const validateStudentAttendanceBulk = (data) => {
    return exports.studentAttendanceBulkInputSchema.parse(data);
};
exports.validateStudentAttendanceBulk = validateStudentAttendanceBulk;
