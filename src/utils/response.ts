import type { Request, Response } from "express";
import moment from "moment";

export const ResponseHandler = {
  success: (args: {
    res: Response;
    code: number;
    message: string;
    data: unknown;
  }) => {
    const { res, code, message, data } = args;
    return res.status(code).json({
      success: true,
      code,
      message,
      data,
      meta: ResponseHandler.meta({ res }),
    });
  },

  error: (args: {
    res: Response;
    code: number;
    message: string;
    error: unknown;
  }) => {
    const { res, code, message, error } = args;
    return res.status(code).send({
      success: false,
      code,
      message,
      error,
      meta: ResponseHandler.meta({ res }),
    });
  },

  notfound: (args: { res: Response }) => {
    const { res } = args;
    return res.status(404).json({
      success: false,
      code: 404,
      message: "Not Found",
      data: null,
      meta: ResponseHandler.meta({ res }),
    });
  },

  meta: (args: { res: Response }) => {
    const { res } = args;
    return {
      requestId: res.locals.requestId,
      timestamp: moment().toISOString(),
      unix: moment().unix(),
    };
  },
};
