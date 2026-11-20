"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTeacherUpdate = exports.validateTeacherCreate = exports.teacherUpdateInputSchema = exports.teacherCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.teacherCreateInputSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid("Invalid Employee ID format"),
    qualification: zod_1.z.string().max(255, "Qualification is too long").optional().nullable(),
    specialization: zod_1.z.string().max(255, "Specialization is too long").optional().nullable(),
    createdBy: zod_1.z.string().uuid("Invalid Creator User ID format").optional().nullable(),
});
exports.teacherUpdateInputSchema = exports.teacherCreateInputSchema.partial();
const validateTeacherCreate = (data) => {
    return exports.teacherCreateInputSchema.parse(data);
};
exports.validateTeacherCreate = validateTeacherCreate;
const validateTeacherUpdate = (data) => {
    return exports.teacherUpdateInputSchema.parse(data);
};
exports.validateTeacherUpdate = validateTeacherUpdate;
