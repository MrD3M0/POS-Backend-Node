"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateClassScheduleUpdate = exports.validateClassScheduleCreate = exports.classScheduleUpdateInputSchema = exports.classScheduleCreateInputSchema = void 0;
const zod_1 = require("zod");
const dayOfWeekSchema = zod_1.z.enum([
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
], { message: "dayOfWeek must be one of SUNDAY..SATURDAY" });
exports.classScheduleCreateInputSchema = zod_1.z.object({
    teachingAssignmentId: zod_1.z.string().uuid("Invalid TeachingAssignment ID format"),
    periodId: zod_1.z.string().uuid("Invalid Period ID format"),
    dayOfWeek: dayOfWeekSchema,
    room: zod_1.z.string().max(50, "Room is too long").optional().nullable(),
    effectiveFromBs: zod_1.z.string().min(1, "Effective from date is required"),
    effectiveToBs: zod_1.z.string().optional().nullable(),
    isActive: zod_1.z.boolean().default(true),
});
exports.classScheduleUpdateInputSchema = exports.classScheduleCreateInputSchema.partial();
const validateClassScheduleCreate = (data) => exports.classScheduleCreateInputSchema.parse(data);
exports.validateClassScheduleCreate = validateClassScheduleCreate;
const validateClassScheduleUpdate = (data) => exports.classScheduleUpdateInputSchema.parse(data);
exports.validateClassScheduleUpdate = validateClassScheduleUpdate;
