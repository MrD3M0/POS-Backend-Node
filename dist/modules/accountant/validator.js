"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccountantCreate = exports.accountantCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.accountantCreateInputSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid("Invalid Employee ID format"),
});
const validateAccountantCreate = (data) => {
    return exports.accountantCreateInputSchema.parse(data);
};
exports.validateAccountantCreate = validateAccountantCreate;
