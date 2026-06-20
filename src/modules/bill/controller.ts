// bill/controller.ts
import { ErrorHandler } from "@/utils/error";
import { queryFilters } from "@/utils/queryFilters";
import { ResponseHandler } from "@/utils/response";
import { Request, Response } from "express";
import { validateBillCreate } from "./validator";
import { BillService } from "./service";

const BillController = {
  index: async (req: Request, res: Response) => {
    try {
      const context = res.locals.context;
      const userId = context.userId;

      const { limit, page } = queryFilters(req);
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await BillService.index(pageNumber, limitNumber, userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Bills fetched successfully!",
        data: {
          data: result.bills,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const context = res.locals.context;
      const userId = context.userId;

      const data = validateBillCreate(req.body);

      const bill = await BillService.create(data, userId);

      return ResponseHandler.success({
        res,
        code: 201,
        message: "Bill created successfully",
        data: bill,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const billId = req.params.id as string;

      const bill = await BillService.getById(billId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Bill fetched successfully",
        data: bill,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const billId = req.params.id as string;
      const data = validateBillCreate(req.body);

      const bill = await BillService.update(billId, data);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Bill updated successfully",
        data: bill,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const billId = req.params.id as string;

      await BillService.delete(billId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Bill deleted successfully",
        data: null,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  getBillsByDateRange: async (req: Request, res: Response) => {
    try {
      const context = res.locals.context;
      const userId = context.userId;

      const { startDate, endDate, page, limit } = req.query;

      if (!startDate || !endDate) {
        return ResponseHandler.error({
          res,
          code: 400,
          message: "startDate and endDate are required",
          error: null,
        });
      }

      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await BillService.getBillsByDateRange(
        userId,
        new Date(startDate as string),
        new Date(endDate as string),
        pageNumber,
        limitNumber,
      );

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Bills fetched successfully!",
        data: {
          data: result.bills,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  getTotalSales: async (req: Request, res: Response) => {
    try {
      const context = res.locals.context;
      const userId = context.userId;

      const result = await BillService.getTotalSales(userId);

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Total sales fetched successfully",
        data: result,
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },

  getBillsByCategory: async (req: Request, res: Response) => {
    try {
      const context = res.locals.context;
      const userId = context.userId;

      const { categoryId, page, limit } = req.query;

      if (!categoryId) {
        return ResponseHandler.error({
          res,
          code: 400,
          message: "categoryId is required",
          error: null,
        });
      }

      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 10;

      const result = await BillService.getBillsByCategory(
        userId,
        categoryId as string,
        pageNumber,
        limitNumber,
      );

      return ResponseHandler.success({
        res,
        code: 200,
        message: "Bills fetched successfully!",
        data: {
          data: result.bills,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(res, error);
    }
  },
};

export default BillController;
