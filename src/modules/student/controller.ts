import { Request, Response } from "express";
import { StudentService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  validateStudentBulkImport,
  validateStudentCreate,
  validateStudentReject,
  validateStudentStatusChange,
  validateStudentUpdate,
} from "./validator";
import { CustomError } from "@/errors/CustomError";

export const StudentController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await StudentService.index({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        status: req.query.status as string | undefined,
        approvalStatus: req.query.approvalStatus as string | undefined,
        batchId: req.query.batchId as string | undefined,
        courseId: req.query.courseId as string | undefined,
        includeDeleted: req.query.includeDeleted === "true",
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Students fetched successfully!",
        data: {
          data: result.students,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateStudentCreate(req.body);
      const userId = res.locals.context?.userId;

      const student = await StudentService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Student created successfully",
        data: student,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const student = await StudentService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student retrieved successfully",
        data: student,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  dues: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const dues = await StudentService.getDues(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student dues fetched successfully",
        data: dues,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  approve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      const student = await StudentService.approve(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student approved successfully",
        data: student,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  reject: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validated = validateStudentReject(req.body ?? {});
      const reason = (validated.rejectionReason ?? validated.reason) as string;
      const userId = res.locals.context?.userId;

      const student = await StudentService.reject(id, reason, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student rejected successfully",
        data: student,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  resubmit: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      const student = await StudentService.resubmit(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student resubmitted successfully",
        data: student,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  changeStatus: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validated = validateStudentStatusChange(req.body ?? {});
      const userId = res.locals.context?.userId;

      const result = await StudentService.changeStatus(id, validated.status, validated.reason, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student status changed successfully",
        data: result,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  bulkApprove: async (req: Request, res: Response) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id: unknown) => typeof id === "string") : [];
      const result = await StudentService.bulkApprove(ids, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Bulk approval completed", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  bulkImport: async (req: Request, res: Response) => {
    try {
      const validated = validateStudentBulkImport(req.body ?? {});
      const userId = res.locals.context?.userId;

      const result = await StudentService.bulkImport(validated, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: `Bulk import finished: ${result.imported} imported, ${result.failed} failed`,
        data: result,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      // approvalStatus/status changes must use the dedicated endpoints.
      if (req.body?.approvalStatus !== undefined) {
        throw new CustomError(
          "approvalStatus cannot be changed here; use POST /student/:id/approve, /reject or /resubmit",
          400,
        );
      }
      if (req.body?.status !== undefined) {
        throw new CustomError(
          "status cannot be changed here; use POST /student/:id/change-status (ADMIN only, reason required)",
          400,
        );
      }
      const validatedData = validateStudentUpdate(req.body);
      const userId = res.locals.context?.userId;

      const student = await StudentService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student updated successfully",
        data: student,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await StudentService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};