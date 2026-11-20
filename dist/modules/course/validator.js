"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCourseUpdate = exports.validateCourseCreate = exports.courseUpdateInputSchema = exports.courseCreateInputSchema = void 0;
const zod_1 = require("zod");
const courseShape = {
    code: zod_1.z.string().min(1, "Course code is required").max(50, "Course code is too long"),
    name: zod_1.z.string().min(1, "Course name is required").max(255, "Course name is too long"),
    system: zod_1.z.enum(["SEMESTER", "YEARLY"], { message: "System must be SEMESTER or YEARLY" }),
    totalTerms: zod_1.z.number().int().positive("Total terms must be a positive integer"),
    description: zod_1.z.string().optional().nullable(),
    isActive: zod_1.z.boolean().default(true),
};
// DECISIONS/task F3: SEMESTER system = 8 terms, YEARLY system = 4 terms.
const checkTotalTerms = (data, ctx) => {
    if (data.system === "SEMESTER" && data.totalTerms !== undefined && data.totalTerms !== 8) {
        ctx.addIssue({
            code: "custom",
            path: ["totalTerms"],
            message: "SEMESTER courses must have totalTerms = 8",
        });
    }
    if (data.system === "YEARLY" && data.totalTerms !== undefined && data.totalTerms !== 4) {
        ctx.addIssue({
            code: "custom",
            path: ["totalTerms"],
            message: "YEARLY courses must have totalTerms = 4",
        });
    }
};
exports.courseCreateInputSchema = zod_1.z.object(courseShape).superRefine(checkTotalTerms);
// Partial updates are checked against the effective system/totalTerms in the
// service (a partial payload alone cannot prove the combined rule).
exports.courseUpdateInputSchema = zod_1.z.object(courseShape).partial();
const validateCourseCreate = (data) => {
    return exports.courseCreateInputSchema.parse(data);
};
exports.validateCourseCreate = validateCourseCreate;
const validateCourseUpdate = (data) => {
    return exports.courseUpdateInputSchema.parse(data);
};
exports.validateCourseUpdate = validateCourseUpdate;
