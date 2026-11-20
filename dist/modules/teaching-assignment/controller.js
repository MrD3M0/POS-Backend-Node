"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeachingAssignmentController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
exports.TeachingAssignmentController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.TeachingAssignmentService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
            }, {
                userId: res.locals.context?.userId,
                role: res.locals.context?.role,
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Teaching assignments fetched successfully!",
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
            const validatedData = (0, validator_1.validateTeachingAssignmentCreate)(req.body);
            const userId = res.locals.context?.userId;
            const assignment = await service_1.TeachingAssignmentService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Teaching assignment created successfully",
                data: assignment,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const assignment = await service_1.TeachingAssignmentService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Teaching assignment retrieved successfully",
                data: assignment,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateTeachingAssignmentUpdate)(req.body);
            const userId = res.locals.context?.userId;
            // Optional UI flag: when an endDateBs is set, also close the weekly
            // schedules of this assignment that run beyond it.
            const closeSchedules = req.body?.closeSchedules === true;
            const assignment = await service_1.TeachingAssignmentService.update(id, validatedData, userId);
            let closedSchedules = 0;
            if (closeSchedules && assignment.endDateBs) {
                closedSchedules = await service_1.TeachingAssignmentService.closeSchedules(id, assignment.endDateBs, userId);
            }
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Teaching assignment updated successfully",
                data: { ...assignment, closedSchedules },
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    /** GET /teaching-assignment/workload/:teacherId */
    workload: async (req, res) => {
        try {
            const teacherId = req.params.teacherId;
            const result = await service_1.TeachingAssignmentService.workload(teacherId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Teacher workload fetched successfully",
                data: result,
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
            await service_1.TeachingAssignmentService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Teaching assignment deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
