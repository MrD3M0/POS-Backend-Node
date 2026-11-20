"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBatchUpdate = exports.validateBatchCreate = exports.batchUpdateInputSchema = exports.batchCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.batchCreateInputSchema = zod_1.z.object({
    courseId: zod_1.z.string().uuid("Invalid Course ID format"),
    name: zod_1.z.string().min(1, "Batch name is required").max(100, "Batch name is too long"),
    startDateBs: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
        .optional()
        .nullable(),
    currentTermNumber: zod_1.z.number().int().positive("Term number must be a positive integer").default(1),
    isActive: zod_1.z.boolean().default(true),
});
exports.batchUpdateInputSchema = exports.batchCreateInputSchema.partial();
const validateBatchCreate = (data) => {
    return exports.batchCreateInputSchema.parse(data);
};
exports.validateBatchCreate = validateBatchCreate;
const validateBatchUpdate = (data) => {
    return exports.batchUpdateInputSchema.parse(data);
};
exports.validateBatchUpdate = validateBatchUpdate;
