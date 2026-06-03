import { CustomError, ValidationError } from "@/errors/CustomError";
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/client";
import { AxiosError } from "axios";
import { Response } from "express";
import { ZodError } from "zod";
import { ResponseHandler } from "./response";
type PrismaError =
  | PrismaClientInitializationError
  | PrismaClientKnownRequestError
  | PrismaClientRustPanicError
  | PrismaClientValidationError
  | PrismaClientUnknownRequestError;

export const ErrorHandler = {
  // Handle error
  handleError: function (res: Response, error: unknown) {
    if (error instanceof ValidationError)
      return this.handleValidationError(res, error);
    else if (error instanceof CustomError)
      return this.handleCustomError(res, error);
    else if (error instanceof ZodError) return this.handleZodError(res, error);
    else if (error instanceof AxiosError)
      return this.handleAxiosError(res, error);

    // Handle standard Error instances
    if (error instanceof Error) {
      return ResponseHandler.error({
        res,
        code: 500,
        message: "Internal Server Error",
        error: error.message,
      });
    }

    return ResponseHandler.error({
      res,
      code: 500,
      message: "Internal Server Error",
      error: null,
    });
  },

  // Handle custom error
  handleCustomError: function (res: Response, error: CustomError) {
    return ResponseHandler.error({
      res,
      code: error.status || 500,
      message: error.message || "Internal Server Error",
      error: null,
    });
  },

  // Handle validation error
  handleValidationError: function (res: Response, error: ValidationError) {
    return res.status(422).send({
      success: false,
      status: 422,
      message: "Validation Error",
      data: error.fields,
    });
  },

  handlePrismaError: function (error: PrismaError) {
    switch (error.name) {
      case "PrismaClientInitializationError":
        // Return the error response json
        return {
          success: false,
          status: 500,
          message: "Server error occured. Our engineers are already notified.",
          data: null,
        };
      default:
        // Return the error response json
        return {
          success: false,
          status: 500,
          message: "Server error occured. Our engineers are already notified.",
          data: null,
        };
    }
  },

  handleZodError: function (res: Response, error: ZodError) {
    // Flatten the errors
    const flattenedErrors: Record<string, unknown> =
      error.flatten().fieldErrors;
    /**
     * In case a custom data is thrown from zod object via params object
     * That needs to be respected. Simply flattening the errors
     * Will only return message and not the custom data
     * Hence we need to check if params exists and if it does
     * We need to replace the message with the custom data
     * To see the usage of params, see validation of invoiceEmails in client validation (clients/validator.tsx) file
     */
    // for each issue
    for (const issue of error.issues) {
      const issuePaths = issue.path;
      // for each path, check if issue.params exists
      for (const path of issuePaths) {
        // if issue.params exists, check if errors exists
        if ("params" in issue && issue.params) {
          // if errors exists, add it to flattenedErrors
          flattenedErrors[String(path)] = issue.params;
        }
      }
    }

    return res.status(422).send({
      success: false,
      status: 422,
      message: "Validation Error",
      data: { ...flattenedErrors, _deepErrors: error },
    });
  },

  // handleJWTError: function (error: JsonWebTokenError) {
  //   // Return the error response json
  //   return { success: false, status: 401, message: 'Invalid Authorization Token', data: [] };
  // },

  handleAxiosError: function (res: Response, error: AxiosError) {
    const status = error.response?.status || 500;
    const responseData = error.response?.data as
      | { message?: string }
      | undefined;
    const message = responseData?.message || error.message || "Request failed";
    return ResponseHandler.error({ res, code: status, message, error: null });
  },
};
