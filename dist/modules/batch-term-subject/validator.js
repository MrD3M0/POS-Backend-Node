"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBatchTermSubjectBulkCreate = exports.validateBatchTermSubjectUpdate = exports.validateBatchTermSubjectCreate = exports.batchTermSubjectBulkCreateInputSchema = exports.batchTermSubjectUpdateInputSchema = exports.batchTermSubjectCreateInputSchema = void 0;
const zod_1 = require("zod");
const creditHourSchema = zod_1.z.number().positive("Credit hour must be a positive number").max(999.9, "Credit hour is too large");
exports.batchTermSubjectCreateInputSchema = zod_1.z.object({
    batchTermId: zod_1.z.string().uuid("Invalid BatchTerm ID format"),
    subjectId: zod_1.z.string().uuid("Invalid Subject ID format"),
    creditHour: creditHourSchema,
    isElective: zod_1.z.boolean().default(false),
});
exports.batchTermSubjectUpdateInputSchema = exports.batchTermSubjectCreateInputSchema.partial();
/** Body for POST /batch-term-subject/bulk — atomic all-or-nothing assignment. */
exports.batchTermSubjectBulkCreateInputSchema = zod_1.z.object({
    batchTermId: zod_1.z.string().uuid("Invalid BatchTerm ID format"),
    subjects: zod_1.z
        .array(zod_1.z.object({
        subjectId: zod_1.z.string().uuid("Invalid Subject ID format"),
        creditHour: creditHourSchema,
        isElective: zod_1.z.boolean().default(false),
    }))
        .min(1, "At least one subject is required")
        .max(50, "A maximum of 50 subjects can be assigned at once"),
});
const validateBatchTermSubjectCreate = (data) => {
    return exports.batchTermSubjectCreateInputSchema.parse(data);
};
exports.validateBatchTermSubjectCreate = validateBatchTermSubjectCreate;
const validateBatchTermSubjectUpdate = (data) => {
    return exports.batchTermSubjectUpdateInputSchema.parse(data);
};
exports.validateBatchTermSubjectUpdate = validateBatchTermSubjectUpdate;
const validateBatchTermSubjectBulkCreate = (data) => {
    return exports.batchTermSubjectBulkCreateInputSchema.parse(data);
};
exports.validateBatchTermSubjectBulkCreate = validateBatchTermSubjectBulkCreate;
