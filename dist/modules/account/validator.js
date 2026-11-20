"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccountUpdate = exports.validateAccountCreate = exports.accountUpdateInputSchema = exports.accountCreateInputSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.accountCreateInputSchema = zod_1.default.object({
    code: zod_1.default.string().trim().min(1, "Code is required").max(30),
    name: zod_1.default.string().trim().min(1, "Name is required").max(120),
    type: zod_1.default.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"], {
        message: "Type must be ASSET, LIABILITY, EQUITY, INCOME, or EXPENSE",
    }),
    parentId: zod_1.default.string().uuid("Invalid Parent ID format").optional().nullable(),
    isGroup: zod_1.default.boolean().optional(),
    isActive: zod_1.default.boolean().optional(),
    // isSystem is intentionally NOT client-settable.
});
exports.accountUpdateInputSchema = zod_1.default.object({
    name: zod_1.default.string().trim().min(1).max(120).optional(),
    parentId: zod_1.default.string().uuid("Invalid Parent ID format").optional().nullable(),
    isActive: zod_1.default.boolean().optional(),
});
const validateAccountCreate = (data) => exports.accountCreateInputSchema.parse(data);
exports.validateAccountCreate = validateAccountCreate;
const validateAccountUpdate = (data) => exports.accountUpdateInputSchema.parse(data);
exports.validateAccountUpdate = validateAccountUpdate;
