"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCategoryCreate = exports.categoryCreateInputSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.categoryCreateInputSchema = zod_1.default.object({
    name: zod_1.default
        .string({ message: "Name is required" })
        .min(1, "Name is required")
        .max(100, "Name must be at most 100 characters"),
    shortName: zod_1.default
        .string({ message: "Short name is required" })
        .min(1, "Short name is required")
        .max(3, "Short name must be at most 3 characters"),
});
const validateCategoryCreate = (data) => {
    return exports.categoryCreateInputSchema.parse(data);
};
exports.validateCategoryCreate = validateCategoryCreate;
