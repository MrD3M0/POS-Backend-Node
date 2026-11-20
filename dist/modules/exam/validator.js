"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateExamUpdate = exports.validateExamCreate = exports.examUpdateInputSchema = exports.examCreateInputSchema = void 0;
const zod_1 = require("zod");
const bs_date_1 = require("@/utils/bs-date");
const bsDate = (field) => zod_1.z
    .string()
    .refine((v) => (0, bs_date_1.parseBsDate)(v) !== null, `${field} must be a valid BS date YYYY-MM-DD`);
const examShape = {
    batchTermId: zod_1.z.string().uuid("Invalid Batch Term ID format"),
    examTypeId: zod_1.z.string().uuid("Invalid Exam Type ID format"),
    name: zod_1.z.string().min(1, "Exam name is required"),
    startDateBs: bsDate("startDateBs").optional().nullable(),
    endDateBs: bsDate("endDateBs").optional().nullable(),
};
exports.examCreateInputSchema = zod_1.z
    .object(examShape)
    .superRefine((data, ctx) => {
    if (data.startDateBs && data.endDateBs && data.endDateBs < data.startDateBs) {
        ctx.addIssue({
            code: "custom",
            path: ["endDateBs"],
            message: "endDateBs must be on or after startDateBs",
        });
    }
});
// NOTE: .partial() cannot be applied to a schema with object refinements
// (zod throws at import time), so the update schema reuses the base shape.
exports.examUpdateInputSchema = zod_1.z.object(examShape).partial();
const validateExamCreate = (data) => {
    return exports.examCreateInputSchema.parse(data);
};
exports.validateExamCreate = validateExamCreate;
const validateExamUpdate = (data) => {
    return exports.examUpdateInputSchema.parse(data);
};
exports.validateExamUpdate = validateExamUpdate;
