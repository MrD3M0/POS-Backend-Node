"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSalaryComponentUpdate = exports.validateSalaryComponentCreate = exports.salaryComponentUpdateInputSchema = exports.salaryComponentCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.salaryComponentCreateInputSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "Component code is required").max(50, "Component code is too long"),
    name: zod_1.z.string().min(1, "Component name is required").max(100, "Component name is too long"),
    isDeduction: zod_1.z.boolean().default(false),
    isEmployerContribution: zod_1.z.boolean().default(false),
    isTaxable: zod_1.z.boolean().default(true),
    isActive: zod_1.z.boolean().default(true),
});
exports.salaryComponentUpdateInputSchema = exports.salaryComponentCreateInputSchema.partial();
const validateSalaryComponentCreate = (data) => {
    return exports.salaryComponentCreateInputSchema.parse(data);
};
exports.validateSalaryComponentCreate = validateSalaryComponentCreate;
const validateSalaryComponentUpdate = (data) => {
    return exports.salaryComponentUpdateInputSchema.parse(data);
};
exports.validateSalaryComponentUpdate = validateSalaryComponentUpdate;
