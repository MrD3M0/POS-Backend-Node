"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateResultPublish = exports.validateExamSubjectReview = exports.validateExamSubjectUpdate = exports.validateExamSubjectCreate = exports.resultPublishInputSchema = exports.examSubjectReviewInputSchema = exports.examSubjectUpdateInputSchema = exports.examSubjectCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.examSubjectCreateInputSchema = zod_1.z.object({
    examId: zod_1.z.string().uuid("Invalid Exam ID format"),
    batchTermSubjectId: zod_1.z.string().uuid("Invalid Batch Term Subject ID format").optional(),
    fullMarks: zod_1.z.string().min(1, "Full marks are required"),
    passMarks: zod_1.z.string().min(1, "Pass marks are required"),
    examDateBs: zod_1.z.string().min(1, "Exam date is required"),
});
exports.examSubjectUpdateInputSchema = exports.examSubjectCreateInputSchema.partial();
// Group-level result workflow (Batch + Term + Subject).
exports.examSubjectReviewInputSchema = zod_1.z.object({
    action: zod_1.z.enum(["APPROVE", "REJECT"]),
    batchId: zod_1.z.string().uuid("Invalid Batch ID format"),
    termId: zod_1.z.string().uuid("Invalid Term ID format"),
    subjectId: zod_1.z.string().uuid("Invalid Subject ID format").optional(),
    examId: zod_1.z.string().uuid("Invalid Exam ID format").optional(),
    reason: zod_1.z.string().trim().max(1000, "Reason is too long").optional(),
});
exports.resultPublishInputSchema = zod_1.z.object({
    batchId: zod_1.z.string().uuid("Invalid Batch ID format"),
    termId: zod_1.z.string().uuid("Invalid Term ID format"),
    examId: zod_1.z.string().uuid("Invalid Exam ID format").optional(),
});
const validateExamSubjectCreate = (data) => {
    return exports.examSubjectCreateInputSchema.parse(data);
};
exports.validateExamSubjectCreate = validateExamSubjectCreate;
const validateExamSubjectUpdate = (data) => {
    return exports.examSubjectUpdateInputSchema.parse(data);
};
exports.validateExamSubjectUpdate = validateExamSubjectUpdate;
const validateExamSubjectReview = (data) => {
    return exports.examSubjectReviewInputSchema.parse(data);
};
exports.validateExamSubjectReview = validateExamSubjectReview;
const validateResultPublish = (data) => {
    return exports.resultPublishInputSchema.parse(data);
};
exports.validateResultPublish = validateResultPublish;
