"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeeHeadUpdate = exports.validateFeeHeadCreate = exports.feeHeadUpdateInputSchema = exports.feeHeadCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.feeHeadCreateInputSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(1, "Code is required"),
    name: zod_1.z.string().trim().min(1, "Name is required"),
    isActive: zod_1.z.boolean().optional(),
});
exports.feeHeadUpdateInputSchema = exports.feeHeadCreateInputSchema.partial();
const validateFeeHeadCreate = (data) => exports.feeHeadCreateInputSchema.parse(data);
exports.validateFeeHeadCreate = validateFeeHeadCreate;
const validateFeeHeadUpdate = (data) => exports.feeHeadUpdateInputSchema.parse(data);
exports.validateFeeHeadUpdate = validateFeeHeadUpdate;
