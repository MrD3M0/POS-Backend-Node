"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHandler = void 0;
const moment_1 = __importDefault(require("moment"));
exports.ResponseHandler = {
    success: (args) => {
        const { res, code, message, data } = args;
        return res.status(code).json({
            success: true,
            code,
            message,
            data,
            meta: exports.ResponseHandler.meta({ res }),
        });
    },
    error: (args) => {
        const { res, code, message, error } = args;
        return res.status(code).send({
            success: false,
            code,
            message,
            error,
            meta: exports.ResponseHandler.meta({ res }),
        });
    },
    notfound: (args) => {
        const { res } = args;
        return res.status(404).json({
            success: false,
            code: 404,
            message: "Not Found",
            data: null,
            meta: exports.ResponseHandler.meta({ res }),
        });
    },
    meta: (args) => {
        const { res } = args;
        return {
            requestId: res.locals.requestId,
            timestamp: (0, moment_1.default)().toISOString(),
            unix: (0, moment_1.default)().unix(),
        };
    },
};
