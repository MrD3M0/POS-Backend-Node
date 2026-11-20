"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentAttendanceController = void 0;
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
const service_1 = require("./service");
const getActor = (res) => ({
    userId: res.locals.context?.userId,
    role: res.locals.context?.role,
});
const asString = (value) => typeof value === "string" && value.length > 0 ? value : undefined;
exports.StudentAttendanceController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 10;
            const result = await service_1.StudentAttendanceService.index({
                page: pageNumber,
                limit: limitNumber,
                search,
                sessionId: asString(req.query.sessionId),
                studentId: asString(req.query.studentId),
                status: asString(req.query.status),
                batchId: asString(req.query.batchId),
                dateBs: asString(req.query.dateBs),
            }, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student attendances fetched successfully!",
                data: {
                    data: result.data,
                    pagination: result.pagination,
                },
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    create: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validateStudentAttendanceCreate)(req.body);
            const record = await service_1.StudentAttendanceService.create(validatedData, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Student attendance created successfully",
                data: record,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    bulkMark: async (req, res) => {
        try {
            const validatedData = (0, validator_1.validateStudentAttendanceBulk)(req.body);
            const records = await service_1.StudentAttendanceService.bulkMark(validatedData, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student attendance marked successfully",
                data: records,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const record = await service_1.StudentAttendanceService.getById(id, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student attendance retrieved successfully",
                data: record,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    summary: async (req, res) => {
        try {
            const studentId = req.params.studentId;
            const result = await service_1.StudentAttendanceService.summary(studentId, { fromBs: asString(req.query.fromBs), toBs: asString(req.query.toBs) }, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student attendance summary retrieved successfully",
                data: result,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    update: async (req, res) => {
        try {
            const id = req.params.id;
            const validatedData = (0, validator_1.validateStudentAttendanceUpdate)(req.body);
            const record = await service_1.StudentAttendanceService.update(id, validatedData, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student attendance updated successfully",
                data: record,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    delete: async (req, res) => {
        try {
            const id = req.params.id;
            await service_1.StudentAttendanceService.delete(id, getActor(res));
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student attendance deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
