"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBatchTermUpdate = exports.validateBatchTermCreate = exports.batchTermUpdateInputSchema = exports.batchTermCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.batchTermCreateInputSchema = zod_1.z.object({
    batchId: zod_1.z.string().uuid("Invalid Batch ID format"),
    termNumber: zod_1.z.number().int().positive("Term number must be a positive integer"),
    name: zod_1.z.string().min(1, "Term name is required").max(100, "Term name is too long"),
    startDateBs: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
    endDateBs: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
    isActive: zod_1.z.boolean().default(true),
});
exports.batchTermUpdateInputSchema = exports.batchTermCreateInputSchema.partial();
const validateBatchTermCreate = (data) => {
    return exports.batchTermCreateInputSchema.parse(data);
};
exports.validateBatchTermCreate = validateBatchTermCreate;
const validateBatchTermUpdate = (data) => {
    return exports.batchTermUpdateInputSchema.parse(data);
};
exports.validateBatchTermUpdate = validateBatchTermUpdate;
