import { Request, Response } from "express";
import { AttendanceSessionService, Actor } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateAttendanceSessionCreate, validateAttendanceSessionUpdate } from "./validator";

const getActor = (res: Response): Actor => ({
  userId: res.locals.context?.userId as string | undefined,
  role: res.locals.context?.role as string | undefined,
});

export const AttendanceSessionController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const result = await AttendanceSessionService.index({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
      });
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Attendance sessions fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateAttendanceSessionCreate(req.body);
      const session = await AttendanceSessionService.create(validatedData, getActor(res));
      return ResponseHandler.success({
        res,
        code: 201,
        message: "Attendance session created successfully",
        data: session,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const session = await AttendanceSessionService.getById(req.params.id as string);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Attendance session retrieved successfully",
        data: session,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  roster: async (req: Request, res: Response) => {
    try {
      const roster = await AttendanceSessionService.roster(req.params.id as string);
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Attendance roster retrieved successfully",
        data: roster,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const validatedData = validateAttendanceSessionUpdate(req.body);
      const session = await AttendanceSessionService.update(
        req.params.id as string,
        validatedData,
        getActor(res),
      );
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Attendance session updated successfully",
        data: session,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  unlock: async (req: Request, res: Response) => {
    try {
      const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
      const session = await AttendanceSessionService.unlock(req.params.id as string, reason, getActor(res));
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Attendance session unlocked successfully",
        data: session,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await AttendanceSessionService.delete(req.params.id as string, getActor(res));
      return ResponseHandler.success({
        res,
        code: 200,
        message: "Attendance session deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
