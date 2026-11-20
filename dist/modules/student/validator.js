"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStudentBulkImport = exports.validateStudentStatusChange = exports.validateStudentReject = exports.validateStudentUpdate = exports.validateStudentCreate = exports.studentBulkImportInputSchema = exports.studentStatusChangeInputSchema = exports.studentRejectInputSchema = exports.studentUpdateInputSchema = exports.studentCreateInputSchema = exports.guardianInputSchema = void 0;
const zod_1 = require("zod");
exports.guardianInputSchema = zod_1.z.object({
    relation: zod_1.z.enum(["FATHER", "MOTHER", "GUARDIAN", "OTHER"], {
        message: "Relation must be FATHER, MOTHER, GUARDIAN, or OTHER",
    }),
    fullName: zod_1.z.string().min(1, "Full name is required"),
    phone: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().email("Invalid email format").optional().nullable(),
    occupation: zod_1.z.string().optional().nullable(),
    address: zod_1.z.string().optional().nullable(),
    isPrimary: zod_1.z.boolean().optional(),
});
exports.studentCreateInputSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("Invalid User ID format").optional().nullable(),
    universityRegNo: zod_1.z.string().min(1, "University registration number is required").max(50, "University registration number is too long"),
    firstName: zod_1.z.string().min(1, "First name is required").max(100, "First name is too long"),
    middleName: zod_1.z.string().max(100, "Middle name is too long").optional().nullable(),
    lastName: zod_1.z.string().min(1, "Last name is required").max(100, "Last name is too long"),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHERS"], {
        message: "Gender must be MALE, FEMALE, or OTHERS",
    }),
    dobBs: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
    phone: zod_1.z.string().max(20, "Phone number is too long").optional().nullable(),
    email: zod_1.z.string().email("Invalid email format").max(255, "Email is too long").optional().nullable(),
    permanentAddress: zod_1.z.string().optional().nullable(),
    temporaryAddress: zod_1.z.string().optional().nullable(),
    photoUrl: zod_1.z.string().url("Invalid URL format").optional().nullable(),
    batchId: zod_1.z.string().uuid("Invalid Batch ID format"),
    admissionDateBs: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    // NOTE: approvalStatus/status are NOT client-settable on create. New
    // students are always PENDING + ACTIVE; transitions go through
    // POST /student/:id/approve|reject|resubmit|change-status (server-side).
    rejectionReason: zod_1.z.string().max(1000, "Rejection reason is too long").optional().nullable(),
    createdBy: zod_1.z.string().uuid("Invalid Creator User ID format").optional().nullable(),
    // Student + guardian(s) are created in one transaction. When supplied,
    // exactly one guardian must be primary (a single guardian defaults to
    // primary). Omitting `guardians` keeps legacy clients working.
    guardians: zod_1.z.array(exports.guardianInputSchema).min(1, "At least one guardian is required").max(10).optional(),
}).superRefine((data, ctx) => {
    if (!data.guardians)
        return;
    const primaries = data.guardians.filter((g) => g.isPrimary === true).length;
    if (data.guardians.length === 1 && primaries === 0)
        return; // defaults to primary in service
    if (primaries !== 1) {
        ctx.addIssue({
            code: "custom",
            path: ["guardians"],
            message: "Exactly one guardian must be marked isPrimary",
        });
    }
});
exports.studentUpdateInputSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("Invalid User ID format").optional().nullable(),
    universityRegNo: zod_1.z.string().min(1, "University registration number is required").max(50, "University registration number is too long").optional(),
    firstName: zod_1.z.string().min(1, "First name is required").max(100, "First name is too long").optional(),
    middleName: zod_1.z.string().max(100, "Middle name is too long").optional().nullable(),
    lastName: zod_1.z.string().min(1, "Last name is required").max(100, "Last name is too long").optional(),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHERS"], {
        message: "Gender must be MALE, FEMALE, or OTHERS",
    }).optional(),
    dobBs: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
    phone: zod_1.z.string().max(20, "Phone number is too long").optional().nullable(),
    email: zod_1.z.string().email("Invalid email format").max(255, "Email is too long").optional().nullable(),
    permanentAddress: zod_1.z.string().optional().nullable(),
    temporaryAddress: zod_1.z.string().optional().nullable(),
    photoUrl: zod_1.z.string().url("Invalid URL format").optional().nullable(),
    batchId: zod_1.z.string().uuid("Invalid Batch ID format").optional(),
    admissionDateBs: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
    // approvalStatus / status intentionally absent: use the dedicated
    // transition endpoints so PENDING->APPROVED|REJECTED, REJECTED->PENDING
    // and ADMIN-only status changes are enforced server-side.
});
exports.studentRejectInputSchema = zod_1.z.object({
    rejectionReason: zod_1.z.string().min(1, "Rejection reason is required").max(1000).optional(),
    reason: zod_1.z.string().min(1, "Rejection reason is required").max(1000).optional(),
}).superRefine((data, ctx) => {
    if (!data.rejectionReason && !data.reason) {
        ctx.addIssue({ code: "custom", path: ["rejectionReason"], message: "Rejection reason is required" });
    }
});
exports.studentStatusChangeInputSchema = zod_1.z.object({
    status: zod_1.z.enum(["ACTIVE", "GRADUATED", "DROPPED", "SUSPENDED"], {
        message: "Status must be ACTIVE, GRADUATED, DROPPED, or SUSPENDED",
    }),
    reason: zod_1.z.string().min(1, "Reason is required for a status change").max(1000, "Reason is too long"),
});
exports.studentBulkImportInputSchema = zod_1.z.object({
    students: zod_1.z.array(exports.studentCreateInputSchema).min(1, "At least one student row is required").max(100, "At most 100 rows per import"),
});
const validateStudentCreate = (data) => {
    return exports.studentCreateInputSchema.parse(data);
};
exports.validateStudentCreate = validateStudentCreate;
const validateStudentUpdate = (data) => {
    return exports.studentUpdateInputSchema.parse(data);
};
exports.validateStudentUpdate = validateStudentUpdate;
const validateStudentReject = (data) => {
    return exports.studentRejectInputSchema.parse(data);
};
exports.validateStudentReject = validateStudentReject;
const validateStudentStatusChange = (data) => {
    return exports.studentStatusChangeInputSchema.parse(data);
};
exports.validateStudentStatusChange = validateStudentStatusChange;
const validateStudentBulkImport = (data) => {
    return exports.studentBulkImportInputSchema.parse(data);
};
exports.validateStudentBulkImport = validateStudentBulkImport;
