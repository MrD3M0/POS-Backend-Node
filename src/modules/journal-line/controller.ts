import { Request, Response } from "express";
import { JournalLineService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateJournalLineCreate } from "./validator";

export const JournalLineController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await JournalLineService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Journal lines fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateJournalLineCreate(req.body);
      const userId = res.locals.context?.userId;

      const line = await JournalLineService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Journal line created successfully",
        data: line,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const line = await JournalLineService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Journal line retrieved successfully",
        data: line,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await JournalLineService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Journal line deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
