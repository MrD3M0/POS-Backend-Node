import { Request, Response } from "express";
import { HolidayService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  holidayBulkCreateSchema,
  holidayBulkSchema,
  holidayCreateSchema,
  holidayUpdateSchema,
  weeklyOffSchema,
} from "./validator";

const parseBool = (value: unknown): boolean | undefined =>
  value === undefined ? undefined : value === "true";

export const HolidayController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await HolidayService.index({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        yearBs: req.query.yearBs ? Number(req.query.yearBs) : undefined,
        monthBs: req.query.monthBs ? Number(req.query.monthBs) : undefined,
        appliesToStudents: parseBool(req.query.appliesToStudents),
        appliesToEmployees: parseBool(req.query.appliesToEmployees),
        includeDeleted: req.query.includeDeleted === "true",
        sort: req.query.sort as "dateBs" | "name" | "createdAt" | undefined,
        order: req.query.order as "asc" | "desc" | undefined,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Holidays fetched successfully",
        data: result,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const holiday = await HolidayService.getById(req.params.id as string);
      return ResponseHandler.success({ res, code: 200, message: "Holiday retrieved", data: holiday });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const data = holidayCreateSchema.parse(req.body);
      const holiday = await HolidayService.create(data, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 201, message: "Holiday created", data: holiday });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const data = holidayUpdateSchema.parse(req.body);
      const holiday = await HolidayService.update(
        req.params.id as string,
        data,
        res.locals.context?.userId,
      );
      return ResponseHandler.success({ res, code: 200, message: "Holiday updated", data: holiday });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await HolidayService.delete(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Holiday deleted", data: null });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  restore: async (req: Request, res: Response) => {
    try {
      const holiday = await HolidayService.restore(req.params.id as string, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Holiday restored", data: holiday });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  bulkImport: async (req: Request, res: Response) => {
    try {
      const data = holidayBulkSchema.parse(req.body);
      const result = await HolidayService.bulkImport(data, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Holiday import completed", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  bulkCreate: async (req: Request, res: Response) => {
    try {
      const data = holidayBulkCreateSchema.parse(req.body);
      const result = await HolidayService.bulkCreate(data, res.locals.context?.userId);
      return ResponseHandler.success({
        res,
        code: 200,
        message: `${result.created} holiday(s) created, ${result.skipped} skipped`,
        data: result,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  weeklyOffs: async (req: Request, res: Response) => {
    try {
      const data = weeklyOffSchema.parse(req.body);
      const result = await HolidayService.generateWeeklyOffs(data, res.locals.context?.userId);
      return ResponseHandler.success({ res, code: 200, message: "Weekly off days generated", data: result });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
