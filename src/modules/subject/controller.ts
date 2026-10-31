import { Request, Response } from "express";
import { SubjectService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateSubjectCreate, validateSubjectUpdate } from "./validator";

export const SubjectController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await SubjectService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
        isActive,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Subjects fetched successfully!",
        data: {
          data: result.subjects,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateSubjectCreate(req.body);
      const userId = res.locals.context?.userId;

      const subject = await SubjectService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Subject created successfully",
        data: subject,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const subject = await SubjectService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Subject retrieved successfully",
        data: subject,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateSubjectUpdate(req.body);
      const userId = res.locals.context?.userId;

      const subject = await SubjectService.update(id, validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Subject updated successfully",
        data: subject,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await SubjectService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Subject deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};