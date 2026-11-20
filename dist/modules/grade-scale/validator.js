"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGradeScaleItemUpdate = exports.validateGradeScaleItemCreate = exports.gradeScaleItemUpdateInputSchema = exports.gradeScaleItemCreateInputSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.gradeScaleItemCreateInputSchema = zod_1.default.object({
    grade: zod_1.default.string().trim().min(1, "Grade is required").max(20),
    minPercent: zod_1.default.union([zod_1.default.string(), zod_1.default.number()]).transform(String),
    maxPercent: zod_1.default.union([zod_1.default.string(), zod_1.default.number()]).transform(String),
    gradePoint: zod_1.default.union([zod_1.default.string(), zod_1.default.number()]).transform(String),
    description: zod_1.default.string().trim().max(255).optional().nullable(),
    isPassGrade: zod_1.default.boolean().optional(),
    isActive: zod_1.default.boolean().optional(),
});
exports.gradeScaleItemUpdateInputSchema = exports.gradeScaleItemCreateInputSchema.partial();
const validateGradeScaleItemCreate = (data) => exports.gradeScaleItemCreateInputSchema.parse(data);
exports.validateGradeScaleItemCreate = validateGradeScaleItemCreate;
const validateGradeScaleItemUpdate = (data) => exports.gradeScaleItemUpdateInputSchema.parse(data);
exports.validateGradeScaleItemUpdate = validateGradeScaleItemUpdate;
