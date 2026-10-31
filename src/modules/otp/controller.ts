import { Request, Response } from "express";
import { OtpService } from "./service";
import { ResponseHandler } from "@/utils/response";
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { validateOtpCreate } from "./validator";

export const OtpController = {
  index: async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await OtpService.index({
        page: pageNumber,
        limit: limitNumber,
        search,
      });

      return ResponseHandler.success({
        res,
        code: 200,
        message: "OTPs fetched successfully!",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const validatedData = validateOtpCreate(req.body);
      const userId = res.locals.context?.userId;

      const otp = await OtpService.create(validatedData, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "OTP created successfully",
        data: otp,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  retrieve: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const otp = await OtpService.getById(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "OTP retrieved successfully",
        data: otp,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      await OtpService.delete(id);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "OTP deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};
