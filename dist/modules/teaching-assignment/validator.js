"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTeachingAssignmentUpdate = exports.validateTeachingAssignmentCreate = exports.teachingAssignmentUpdateInputSchema = exports.teachingAssignmentCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.teachingAssignmentCreateInputSchema = zod_1.z.object({
    teacherId: zod_1.z.string().uuid("Invalid Teacher ID format"),
    batchTermSubjectId: zod_1.z.string().uuid("Invalid Batch Term Subject ID format"),
    assignedDateBs: zod_1.z.string().min(1, "Assigned date is required"),
    // null clears an existing end date; undefined leaves it unchanged.
    endDateBs: zod_1.z.string().nullable().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.teachingAssignmentUpdateInputSchema = exports.teachingAssignmentCreateInputSchema.partial();
const validateTeachingAssignmentCreate = (data) => {
    return exports.teachingAssignmentCreateInputSchema.parse(data);
};
exports.validateTeachingAssignmentCreate = validateTeachingAssignmentCreate;
const validateTeachingAssignmentUpdate = (data) => {
    return exports.teachingAssignmentUpdateInputSchema.parse(data);
};
exports.validateTeachingAssignmentUpdate = validateTeachingAssignmentUpdate;
