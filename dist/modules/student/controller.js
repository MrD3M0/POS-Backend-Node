"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentController = void 0;
const service_1 = require("./service");
const response_1 = require("@/utils/response");
const error_1 = require("@/utils/error");
const queryFilters_1 = require("@/utils/queryFilters");
const validator_1 = require("./validator");
const CustomError_1 = require("@/errors/CustomError");
exports.StudentController = {
    index: async (req, res) => {
        try {
            const { page, limit, search } = (0, queryFilters_1.queryFilters)(req);
            const result = await service_1.StudentService.index({
                page: Number(page) || 1,
                limit: Number(limit) || 10,
                search,
                status: req.query.status,
                approvalStatus: req.query.approvalStatus,
                batchId: req.query.batchId,
                courseId: req.query.courseId,
                includeDeleted: req.query.includeDeleted === "true",
            });
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Students fetched successfully!",
                data: {
                    data: result.students,
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
            const validatedData = (0, validator_1.validateStudentCreate)(req.body);
            const userId = res.locals.context?.userId;
            const student = await service_1.StudentService.create(validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 201,
                message: "Student created successfully",
                data: student,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    retrieve: async (req, res) => {
        try {
            const id = req.params.id;
            const student = await service_1.StudentService.getById(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student retrieved successfully",
                data: student,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    dues: async (req, res) => {
        try {
            const id = req.params.id;
            const dues = await service_1.StudentService.getDues(id);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student dues fetched successfully",
                data: dues,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    approve: async (req, res) => {
        try {
            const id = req.params.id;
            const userId = res.locals.context?.userId;
            const student = await service_1.StudentService.approve(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student approved successfully",
                data: student,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    reject: async (req, res) => {
        try {
            const id = req.params.id;
            const validated = (0, validator_1.validateStudentReject)(req.body ?? {});
            const reason = (validated.rejectionReason ?? validated.reason);
            const userId = res.locals.context?.userId;
            const student = await service_1.StudentService.reject(id, reason, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student rejected successfully",
                data: student,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    resubmit: async (req, res) => {
        try {
            const id = req.params.id;
            const userId = res.locals.context?.userId;
            const student = await service_1.StudentService.resubmit(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student resubmitted successfully",
                data: student,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    changeStatus: async (req, res) => {
        try {
            const id = req.params.id;
            const validated = (0, validator_1.validateStudentStatusChange)(req.body ?? {});
            const userId = res.locals.context?.userId;
            const result = await service_1.StudentService.changeStatus(id, validated.status, validated.reason, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student status changed successfully",
                data: result,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    bulkApprove: async (req, res) => {
        try {
            const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id) => typeof id === "string") : [];
            const result = await service_1.StudentService.bulkApprove(ids, res.locals.context?.userId);
            return response_1.ResponseHandler.success({ res, code: 200, message: "Bulk approval completed", data: result });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
    bulkImport: async (req, res) => {
        try {
            const validated = (0, validator_1.validateStudentBulkImport)(req.body ?? {});
            const userId = res.locals.context?.userId;
            const result = await service_1.StudentService.bulkImport(validated, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: `Bulk import finished: ${result.imported} imported, ${result.failed} failed`,
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
            // approvalStatus/status changes must use the dedicated endpoints.
            if (req.body?.approvalStatus !== undefined) {
                throw new CustomError_1.CustomError("approvalStatus cannot be changed here; use POST /student/:id/approve, /reject or /resubmit", 400);
            }
            if (req.body?.status !== undefined) {
                throw new CustomError_1.CustomError("status cannot be changed here; use POST /student/:id/change-status (ADMIN only, reason required)", 400);
            }
            const validatedData = (0, validator_1.validateStudentUpdate)(req.body);
            const userId = res.locals.context?.userId;
            const student = await service_1.StudentService.update(id, validatedData, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student updated successfully",
                data: student,
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
            await service_1.StudentService.delete(id, userId);
            return response_1.ResponseHandler.success({
                res,
                code: 200,
                message: "Student deleted successfully",
                data: null,
            });
        }
        catch (error) {
            return error_1.ErrorHandler.handleError(res, error);
        }
    },
};
