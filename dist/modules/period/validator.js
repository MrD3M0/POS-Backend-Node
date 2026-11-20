"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePeriodUpdate = exports.validatePeriodCreate = exports.periodUpdateInputSchema = exports.periodCreateInputSchema = void 0;
const zod_1 = require("zod");
const periodShape = {
    periodNumber: zod_1.z.number().int().min(1, "Period number must be a positive integer"),
    name: zod_1.z.string().min(1, "Period name is required").max(100, "Period name is too long"),
    startTime: zod_1.z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format")
        .max(5, "Time must be in HH:mm format")
        .refine((t) => t.length === 5, "Time must be in HH:mm format"),
    endTime: zod_1.z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format")
        .max(5, "Time must be in HH:mm format")
        .refine((t) => t.length === 5, "Time must be in HH:mm format"),
    isActive: zod_1.z.boolean().default(true),
};
exports.periodCreateInputSchema = zod_1.z.object(periodShape).superRefine((data, ctx) => {
    if (data.endTime <= data.startTime) {
        ctx.addIssue({
            code: "custom",
            path: ["endTime"],
            message: "endTime must be after startTime",
        });
    }
});
// NOTE: .partial() cannot be applied to a schema with object refinements
// (zod throws at import time), so the update schema reuses the base shape.
exports.periodUpdateInputSchema = zod_1.z.object(periodShape).partial();
const validatePeriodCreate = (data) => {
    return exports.periodCreateInputSchema.parse(data);
};
exports.validatePeriodCreate = validatePeriodCreate;
const validatePeriodUpdate = (data) => {
    return exports.periodUpdateInputSchema.parse(data);
};
exports.validatePeriodUpdate = validatePeriodUpdate;
