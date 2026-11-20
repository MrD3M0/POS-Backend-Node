"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassScheduleController = void 0;
const prismaClient_1 = require("@/lib/prismaClient");
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
const DAY_OF_WEEK_VALUES = new Set([
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
]);
/**
 * Resolves the teacher profile id for a logged-in user (by userId).
 * Returns null when the user has no teacher profile or the profile is
 * soft-deleted.
 */
async function teacherIdForUser(userId) {
    if (!userId)
        return null;
    const teacher = await prismaClient_1.prismaMain.teacher.findFirst({
        where: { deletedAt: null, employee: { userId, deletedAt: null } },
        select: { id: true },
    });
    return teacher?.id ?? null;
}
function teacherOnlyGuard(res, role, requestedTeacherId, ownTeacherId) {
    if (role !== "TEACHER")
        return false;
    if (!ownTeacherId || requestedTeacherId !== ownTeacherId) {
        response_1.ResponseHandler.error({
            res,
            code: 403,
            message: "You can only view your own schedule",
            error: null,
        });
        return true;
    }
    return false;
}
exports.ClassScheduleController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const batchId = req.query.batchId;
            const batchTermId = req.query.batchTermId;
            const teacherId = req.query.teacherId;
            const dayOfWeek = req.query.dayOfWeek;
            const periodId = req.query.periodId;
            const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const role = res.locals.context?.role;
            const userId = res.locals.context?.userId;
            if (dayOfWeek && !DAY_OF_WEEK_VALUES.has(dayOfWeek)) {
                return response_1.ResponseHandler.success({
                    res,
                    code: 400,
                    message: "dayOfWeek must be one of SUNDAY..SATURDAY",
                    data: null,
                });
            }
            // Teacher role: force teacherId to their own profile (ignores any
            // teacherId in the query string; other-teacher scoping would 403).
            let effectiveTeacherId = teacherId;
            if (role === "TEACHER") {
                const own = await teacherIdForUser(userId);
                if (!own) {
                    return response_1.ResponseHandler.error({
                        res,
                        code: 403,
                        message: "No teacher profile is linked to this account",
                        error: null,
                    });
                }
                if (teacherId && teacherId !== own) {
                    return response_1.ResponseHandler.error({
                        res,
                        code: 403,
                        message: "You can only view your own schedule",
                        error: null,
                    });
                }
                effectiveTeacherId = own;
            }
            const result = await service_1.ClassScheduleService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                batchId,
                batchTermId,
                teacherId: effectiveTeacherId,
                dayOfWeek,
                periodId,
                isActive,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Class schedules fetched successfully!",
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validateClassScheduleCreate)(req.body);
            const userId = res.locals.context?.userId;
            const classSchedule = await service_1.ClassScheduleService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Class schedule created successfully",
                data: classSchedule,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const role = res.locals.context?.role;
            const userId = res.locals.context?.userId;
            const classSchedule = await service_1.ClassScheduleService.getById(id);
            if (role === "TEACHER") {
                const own = await teacherIdForUser(userId);
                if (!own || classSchedule.teachingAssignment.teacherId !== own) {
                    return response_1.ResponseHandler.error({
                        res,
                        code: 403,
                        message: "You can only view your own schedule",
                        error: null,
                    });
                }
            }
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Class schedule retrieved successfully",
                data: classSchedule,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateClassScheduleUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const classSchedule = await service_1.ClassScheduleService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Class schedule updated successfully",
                data: classSchedule,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            const id = req.params.id;
            const userId = res.locals.context?.userId;
            await service_1.ClassScheduleService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Class schedule deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    /** GET /class-schedule/teacher/:teacherId/week?fromBs&toBs */
    teacherWeek: async (req, res) => {
        try {
            const teacherId = req.params.teacherId;
            const fromBs = req.query.fromBs;
            const toBs = req.query.toBs;
            const role = res.locals.context?.role;
            const userId = res.locals.context?.userId;
            if (!fromBs || !toBs) {
                return response_1.ResponseHandler.error({
                    res,
                    code: 400,
                    message: "fromBs and toBs query params are required",
                    error: null,
                });
            }
            const own = await teacherIdForUser(userId);
            if (teacherOnlyGuard(res, role, teacherId, own))
                return undefined;
            const events = await service_1.ClassScheduleService.teacherWeek(teacherId, fromBs, toBs);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Teacher week schedule fetched successfully!",
                data: events,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    /** GET /class-schedule/batch-term/:batchTermId/week?fromBs&toBs */
    batchTermWeek: async (req, res) => {
        try {
            const batchTermId = req.params.batchTermId;
            const fromBs = req.query.fromBs;
            const toBs = req.query.toBs;
            if (!fromBs || !toBs) {
                return response_1.ResponseHandler.error({
                    res,
                    code: 400,
                    message: "fromBs and toBs query params are required",
                    error: null,
                });
            }
            const events = await service_1.ClassScheduleService.batchTermWeek(batchTermId, fromBs, toBs);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Batch term week schedule fetched successfully!",
                data: events,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    /** GET /class-schedule/calendar?teacherId&fromBs&toBs */
    calendar: async (req, res) => {
        try {
            const teacherId = req.query.teacherId;
            const fromBs = req.query.fromBs;
            const toBs = req.query.toBs;
            const role = res.locals.context?.role;
            const userId = res.locals.context?.userId;
            if (!fromBs || !toBs) {
                return response_1.ResponseHandler.error({
                    res,
                    code: 400,
                    message: "fromBs and toBs query params are required",
                    error: null,
                });
            }
            // Teacher role: force own teacher id
            let effectiveTeacherId = null;
            if (role === "TEACHER") {
                const own = await teacherIdForUser(userId);
                if (!own) {
                    return response_1.ResponseHandler.error({
                        res,
                        code: 403,
                        message: "No teacher profile is linked to this account",
                        error: null,
                    });
                }
                effectiveTeacherId = own;
            }
            const result = await service_1.ClassScheduleService.calendar(fromBs, toBs, effectiveTeacherId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Class schedule calendar fetched successfully!",
                data: result,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
