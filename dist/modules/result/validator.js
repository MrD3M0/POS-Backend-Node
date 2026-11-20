"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateResultTransition = exports.validateResultUpdate = exports.validateResultCreate = exports.resultTransitionInputSchema = exports.resultUpdateInputSchema = exports.resultCreateInputSchema = void 0;
const zod_1 = require("zod");
const resultStatusEnum = zod_1.z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED", "PUBLISHED"]);
// Client only submits who/which exam and optional remarks — totals, GPA, CGPA
// and isPassed are always computed server-side from ExamMarks + GradeScales.
exports.resultCreateInputSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid Student ID format"),
    examId: zod_1.z.string().uuid("Invalid Exam ID format"),
    status: zod_1.z.enum(["DRAFT", "PENDING"]).default("PENDING"),
    remarks: zod_1.z.string().trim().max(1000, "Remarks too long").optional().nullable(),
});
// PATCH is limited to remarks: published results are immutable, computed
// fields can never be edited directly. Status changes go through /transition.
exports.resultUpdateInputSchema = zod_1.z.object({
    remarks: zod_1.z.string().trim().max(1000, "Remarks too long").optional().nullable(),
});
exports.resultTransitionInputSchema = zod_1.z.object({
    to: resultStatusEnum,
});
const validateResultCreate = (data) => {
    return exports.resultCreateInputSchema.parse(data);
};
exports.validateResultCreate = validateResultCreate;
const validateResultUpdate = (data) => {
    return exports.resultUpdateInputSchema.parse(data);
};
exports.validateResultUpdate = validateResultUpdate;
const validateResultTransition = (data) => {
    return exports.resultTransitionInputSchema.parse(data);
};
exports.validateResultTransition = validateResultTransition;
