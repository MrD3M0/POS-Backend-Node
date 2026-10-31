import { Request, Response } from "express";
import { StudentFeeService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateStudentFeeCreate } from "./validator";

export const StudentFeeController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await StudentFeeService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student fees fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateStudentFeeCreate(req.body);
      const userId = res.locals.context?.userId;

      const fee = await StudentFeeService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Student fee created successfully",
        data: fee,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const fee = await StudentFeeService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student fee retrieved successfully",
        data: fee,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await StudentFeeService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student fee deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
