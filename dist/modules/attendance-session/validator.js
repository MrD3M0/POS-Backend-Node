"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAttendanceSessionUpdate = exports.validateAttendanceSessionCreate = exports.attendanceSessionUpdateInputSchema = exports.attendanceSessionCreateInputSchema = void 0;
const zod_1 = require("zod");
const bs_date_1 = require("@/utils/bs-date");
// Accept "dateBs" as BS date "YYYY-MM-DD" OR BS datetime "YYYY-MM-DD HH:mm" / "YYYY-MM-DDTHH:mm".
// Normalizes to the date part (schema stores date only; the period carries the start/end time).
const BS_DATETIME_RE = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{1,2}):(\d{2}))?$/;
const bsDateOrDateTime = (field) => zod_1.z
    .string()
    .transform((v, ctx) => {
    const m = BS_DATETIME_RE.exec(v.trim());
    if (!m) {
        ctx.addIssue(`${field} must be a BS date YYYY-MM-DD or datetime YYYY-MM-DD HH:mm`);
        return zod_1.z.NEVER;
    }
    const [, d, h, mi] = m;
    if ((0, bs_date_1.parseBsDate)(d) === null) {
        ctx.addIssue(`${field} date part must be a valid BS date YYYY-MM-DD`);
        return zod_1.z.NEVER;
    }
    if (h !== undefined) {
        const hh = Number(h);
        const mm = Number(mi);
        if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
            ctx.addIssue(`${field} time part must be HH:mm (00:00-23:59)`);
            return zod_1.z.NEVER;
        }
    }
    return d; // store/normalize to date only
})
    .pipe(zod_1.z.string());
exports.attendanceSessionCreateInputSchema = zod_1.z.object({
    teachingAssignmentId: zod_1.z
        .string()
        .uuid("Invalid Teaching Assignment ID format"),
    teacherId: zod_1.z.string().uuid("Invalid Teacher ID format"),
    periodId: zod_1.z.string().uuid("Invalid Period ID format"),
    dateBs: bsDateOrDateTime("dateBs"),
});
exports.attendanceSessionUpdateInputSchema = zod_1.z.object({
    teachingAssignmentId: zod_1.z
        .string()
        .uuid("Invalid Teaching Assignment ID format")
        .optional(),
    teacherId: zod_1.z.string().uuid("Invalid Teacher ID format").optional(),
    periodId: zod_1.z.string().uuid("Invalid Period ID format").optional(),
    dateBs: bsDateOrDateTime("dateBs").optional(),
    isLocked: zod_1.z.boolean().optional(), // honoured only via /unlock (PRINCIPAL/ADMIN); ignored here if false
    // Optional per-student statuses saved together with the session metadata.
    records: zod_1.z
        .array(zod_1.z.object({
        studentId: zod_1.z.string().uuid("Invalid Student ID format"),
        status: zod_1.z.enum(["PRESENT", "ABSENT", "LEAVE", "LATE"]),
        remarks: zod_1.z
            .string()
            .trim()
            .max(500, "Remarks are too long")
            .optional()
            .nullable(),
    }))
        .max(500, "Too many records in one request")
        .optional(),
});
const validateAttendanceSessionCreate = (data) => {
    return exports.attendanceSessionCreateInputSchema.parse(data);
};
exports.validateAttendanceSessionCreate = validateAttendanceSessionCreate;
const validateAttendanceSessionUpdate = (data) => {
    const parsed = exports.attendanceSessionUpdateInputSchema.parse(data);
    // Prevent locking/unlocking through generic PATCH — /unlock is the audited path
    const { isLocked: _ignored, ...rest } = parsed;
    void _ignored;
    return rest;
};
exports.validateAttendanceSessionUpdate = validateAttendanceSessionUpdate;
