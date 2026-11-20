"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateResultSubjectUpdate = exports.validateResultSubjectCreate = exports.resultSubjectUpdateInputSchema = exports.resultSubjectCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.resultSubjectCreateInputSchema = zod_1.z.object({
    resultId: zod_1.z.string().uuid("Invalid Result ID format"),
    examSubjectId: zod_1.z.string().uuid("Invalid Exam Subject ID format"),
    gradeScaleId: zod_1.z.string().uuid("Invalid Grade Scale ID format"),
    marksObtained: zod_1.z.number().min(0, "Marks obtained must be >= 0"),
    fullMarks: zod_1.z.number().min(1, "Full marks must be > 0"),
    creditHour: zod_1.z.number().min(0, "Credit hour must be >= 0"),
    gradePoint: zod_1.z.number().min(0).max(4, "Grade point must be between 0 and 4"),
});
exports.resultSubjectUpdateInputSchema = exports.resultSubjectCreateInputSchema.partial();
const validateResultSubjectCreate = (data) => {
    return exports.resultSubjectCreateInputSchema.parse(data);
};
exports.validateResultSubjectCreate = validateResultSubjectCreate;
const validateResultSubjectUpdate = (data) => {
    return exports.resultSubjectUpdateInputSchema.parse(data);
};
exports.validateResultSubjectUpdate = validateResultSubjectUpdate;
