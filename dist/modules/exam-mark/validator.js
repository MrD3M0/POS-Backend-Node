"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateExamMarkBulk = exports.validateExamMarkUpdate = exports.validateExamMarkCreate = exports.examMarkBulkInputSchema = exports.examMarkUpdateInputSchema = exports.examMarkCreateInputSchema = void 0;
const zod_1 = require("zod");
const marksInput = zod_1.z.union([zod_1.z.string(), zod_1.z.number()], {
    message: "Marks must be a number",
});
exports.examMarkCreateInputSchema = zod_1.z.object({
    examSubjectId: zod_1.z.string().uuid("Invalid Exam Subject ID format"),
    studentId: zod_1.z.string().uuid("Invalid Student ID format"),
    // marksObtained is forced to null when isAbsent=true in the service
    marksObtained: marksInput.optional().nullable(),
    isAbsent: zod_1.z.boolean().optional().default(false),
    remarks: zod_1.z.string().trim().max(500, "Remarks are too long").optional().nullable(),
});
exports.examMarkUpdateInputSchema = zod_1.z.object({
    examSubjectId: zod_1.z.string().uuid("Invalid Exam Subject ID format").optional(),
    studentId: zod_1.z.string().uuid("Invalid Student ID format").optional(),
    marksObtained: marksInput.optional().nullable(),
    isAbsent: zod_1.z.boolean().optional(),
    remarks: zod_1.z.string().trim().max(500, "Remarks are too long").optional().nullable(),
});
exports.examMarkBulkInputSchema = zod_1.z.object({
    marks: zod_1.z
        .array(exports.examMarkCreateInputSchema)
        .min(1, "At least one exam mark is required")
        .max(500, "Too many records in one request"),
});
const validateExamMarkCreate = (data) => {
    return exports.examMarkCreateInputSchema.parse(data);
};
exports.validateExamMarkCreate = validateExamMarkCreate;
const validateExamMarkUpdate = (data) => {
    return exports.examMarkUpdateInputSchema.parse(data);
};
exports.validateExamMarkUpdate = validateExamMarkUpdate;
const validateExamMarkBulk = (data) => {
    return exports.examMarkBulkInputSchema.parse(data);
};
exports.validateExamMarkBulk = validateExamMarkBulk;
