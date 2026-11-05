import { Request, Response } from "express";

import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import {
  validateStudentAttendanceBulk,
  validateStudentAttendanceCreate,
  validateStudentAttendanceUpdate,
} from "./validator";
import { StudentAttendanceService } from "./service";

const getActor = (res: Response) => ({
  userId: res.locals.context?.userId as string | undefined,
  role: res.locals.context?.role as string | undefined,
});

const asString = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export const StudentAttendanceController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await StudentAttendanceService.index(
        {
          page: pageNumber,
          limit: limitNumber,
          search,
          sessionId: asString(req.query.sessionId),
          studentId: asString(req.query.studentId),
          status: asString(req.query.status),
          batchId: asString(req.query.batchId),
          dateBs: asString(req.query.dateBs),
        },
        getActor(res),
      );

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student attendances fetched successfully!",
        data: {
          data: result.data,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateStudentAttendanceCreate(req.body);

      const record = await StudentAttendanceService.create(
        validatedData,
        getActor(res),
      );

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Student attendance created successfully",
        data: record,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  bulkMark: async (req: Request, res: Response) => {
    try {
      const validatedData = validateStudentAttendanceBulk(req.body);

      const records = await StudentAttendanceService.bulkMark(
        validatedData,
        getActor(res),
      );

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student attendance marked successfully",
        data: records,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const record = await StudentAttendanceService.getById(id, getActor(res));

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student attendance retrieved successfully",
        data: record,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  summary: async (req: Request, res: Response) => {
    try {
      const studentId = req.params.studentId as string;

      const result = await StudentAttendanceService.summary(
        studentId,
        { fromBs: asString(req.query.fromBs), toBs: asString(req.query.toBs) },
        getActor(res),
      );

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student attendance summary retrieved successfully",
        data: result,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = validateStudentAttendanceUpdate(req.body);

      const record = await StudentAttendanceService.update(
        id,
        validatedData,
        getActor(res),
      );

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student attendance updated successfully",
        data: record,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      await StudentAttendanceService.delete(id, getActor(res));

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Student attendance deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
