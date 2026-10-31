import { Request, Response } from "express";
import { JournalEntryService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateJournalEntryCreate } from "./validator";

export const JournalEntryController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await JournalEntryService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Journal entries fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateJournalEntryCreate(req.body);
      const userId = res.locals.context?.userId;

      const entry = await JournalEntryService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Journal entry created successfully",
        data: entry,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const entry = await JournalEntryService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Journal entry retrieved successfully",
        data: entry,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = res.locals.context?.userId;

      await JournalEntryService.delete(id, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Journal entry deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
