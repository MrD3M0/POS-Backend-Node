"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStaffUpdate = exports.validateStaffCreate = exports.staffUpdateInputSchema = exports.staffCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.staffCreateInputSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid("Invalid Employee ID format"),
    department: zod_1.z.string().max(100, "Department is too long").optional().nullable(),
    createdBy: zod_1.z.string().uuid("Invalid Creator User ID format").optional().nullable(),
});
exports.staffUpdateInputSchema = exports.staffCreateInputSchema.partial().extend({
    firstName: zod_1.z.string().min(1, "First name is required").max(100, "First name is too long").optional(),
    lastName: zod_1.z.string().min(1, "Last name is required").max(100, "Last name is too long").optional(),
    phone: zod_1.z.string().max(20, "Phone number is too long").optional().nullable(),
    permanentAddress: zod_1.z.string().optional().nullable(),
    temporaryAddress: zod_1.z.string().optional().nullable(),
    address: zod_1.z.string().optional().nullable(),
});
const validateStaffCreate = (data) => {
    return exports.staffCreateInputSchema.parse(data);
};
exports.validateStaffCreate = validateStaffCreate;
const validateStaffUpdate = (data) => {
    return exports.staffUpdateInputSchema.parse(data);
};
exports.validateStaffUpdate = validateStaffUpdate;
