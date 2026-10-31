import { Request, Response } from "express";
import { StudentService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateStudentCreate, validateStudentUpdate } from "./validator";

export const StudentController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const status = req.query.status as string | undefined;
      const approvalStatus = req.query.approvalStatus as string | undefined;
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await StudentService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        status,
        approvalStatus,
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

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
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