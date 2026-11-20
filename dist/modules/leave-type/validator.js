"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLeaveTypeUpdate = exports.validateLeaveTypeCreate = exports.leaveTypeUpdateInputSchema = exports.leaveTypeCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.leaveTypeCreateInputSchema = zod_1.z.object({
    code: zod_1.z.string().min(1).max(50),
    name: zod_1.z.string().min(1).max(255),
    isPaid: zod_1.z.boolean().optional().default(true),
    yearlyAllowed: zod_1.z.number().int().positive().optional().nullable(),
    isActive: zod_1.z.boolean().optional().default(true),
});
exports.leaveTypeUpdateInputSchema = zod_1.z.object({
    code: zod_1.z.string().min(1).max(50).optional(),
    name: zod_1.z.string().max(255).optional(),
    isPaid: zod_1.z.boolean().optional(),
    yearlyAllowed: zod_1.z.number().int().positive().optional().nullable(),
    isActive: zod_1.z.boolean().optional(),
});
const validateLeaveTypeCreate = (data) => {
    return exports.leaveTypeCreateInputSchema.parse(data);
};
exports.validateLeaveTypeCreate = validateLeaveTypeCreate;
const validateLeaveTypeUpdate = (data) => {
    return exports.leaveTypeUpdateInputSchema.parse(data);
};
exports.validateLeaveTypeUpdate = validateLeaveTypeUpdate;
