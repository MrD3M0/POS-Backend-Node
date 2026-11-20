"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSubjectUpdate = exports.validateSubjectCreate = exports.subjectUpdateInputSchema = exports.subjectCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.subjectCreateInputSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "Subject code is required").max(20, "Subject code is too long"),
    name: zod_1.z.string().min(1, "Subject name is required").max(255, "Subject name is too long"),
    description: zod_1.z.string().optional().nullable(),
    isActive: zod_1.z.boolean().default(true),
});
exports.subjectUpdateInputSchema = exports.subjectCreateInputSchema.partial();
const validateSubjectCreate = (data) => {
    return exports.subjectCreateInputSchema.parse(data);
};
exports.validateSubjectCreate = validateSubjectCreate;
const validateSubjectUpdate = (data) => {
    return exports.subjectUpdateInputSchema.parse(data);
};
exports.validateSubjectUpdate = validateSubjectUpdate;
