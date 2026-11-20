"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStudentFeeBulk = exports.validateStudentFeeCreate = exports.studentFeeBulkInputSchema = exports.studentFeeCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.studentFeeCreateInputSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid Student ID format"),
    // Optional: omitted = resolve batch override first, then course default.
    feeStructureId: zod_1.z.string().uuid("Invalid Fee Structure ID format").optional(),
});
exports.studentFeeBulkInputSchema = zod_1.z
    .object({
    /** Assign this structure (default: the batch override / course default). */
    feeStructureId: zod_1.z.string().uuid("Invalid Fee Structure ID format").optional(),
    /** Every student of this batch gets the structure. */
    batchId: zod_1.z.string().uuid("Invalid Batch ID format").optional(),
    /** Or an explicit list of students. */
    studentIds: zod_1.z
        .array(zod_1.z.string().uuid("Invalid Student ID format"))
        .max(500)
        .optional(),
})
    .refine((value) => Boolean(value.batchId || value.studentIds?.length), {
    message: "Pick a batch or a list of students",
    path: ["batchId"],
});
const validateStudentFeeCreate = (data) => {
    return exports.studentFeeCreateInputSchema.parse(data);
};
exports.validateStudentFeeCreate = validateStudentFeeCreate;
const validateStudentFeeBulk = (data) => {
    return exports.studentFeeBulkInputSchema.parse(data);
};
exports.validateStudentFeeBulk = validateStudentFeeBulk;
