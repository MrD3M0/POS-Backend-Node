"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePrincipalUpdate = exports.validatePrincipalCreate = exports.principalUpdateInputSchema = exports.principalCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.principalCreateInputSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid("Invalid Employee ID format"),
    createdBy: zod_1.z.string().uuid("Invalid Creator User ID format").optional().nullable(),
});
exports.principalUpdateInputSchema = exports.principalCreateInputSchema.partial();
const validatePrincipalCreate = (data) => {
    return exports.principalCreateInputSchema.parse(data);
};
exports.validatePrincipalCreate = validatePrincipalCreate;
const validatePrincipalUpdate = (data) => {
    return exports.principalUpdateInputSchema.parse(data);
};
exports.validatePrincipalUpdate = validatePrincipalUpdate;
