"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateExamTypeUpdate = exports.validateExamTypeCreate = exports.examTypeUpdateInputSchema = exports.examTypeCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.examTypeCreateInputSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(1).max(50).optional(),
    name: zod_1.z.string().trim().min(1, "Name is required").max(255),
    isActive: zod_1.z.boolean().optional(),
});
exports.examTypeUpdateInputSchema = exports.examTypeCreateInputSchema.partial();
const validateExamTypeCreate = (data) => exports.examTypeCreateInputSchema.parse(data);
exports.validateExamTypeCreate = validateExamTypeCreate;
const validateExamTypeUpdate = (data) => exports.examTypeUpdateInputSchema.parse(data);
exports.validateExamTypeUpdate = validateExamTypeUpdate;
