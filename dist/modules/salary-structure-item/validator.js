"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSalaryStructureItemUpdate = exports.validateSalaryStructureItemCreate = exports.salaryStructureItemUpdateInputSchema = exports.salaryStructureItemCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.salaryStructureItemCreateInputSchema = zod_1.z.object({
    salaryStructureId: zod_1.z.string().uuid("Invalid Salary Structure ID format"),
    componentId: zod_1.z.string().uuid("Invalid Salary Component ID format"),
    amount: zod_1.z.number().min(0, "Amount must be >= 0"),
    isPercentOfBasic: zod_1.z.boolean().default(false),
});
exports.salaryStructureItemUpdateInputSchema = exports.salaryStructureItemCreateInputSchema.partial();
const validateSalaryStructureItemCreate = (data) => {
    return exports.salaryStructureItemCreateInputSchema.parse(data);
};
exports.validateSalaryStructureItemCreate = validateSalaryStructureItemCreate;
const validateSalaryStructureItemUpdate = (data) => {
    return exports.salaryStructureItemUpdateInputSchema.parse(data);
};
exports.validateSalaryStructureItemUpdate = validateSalaryStructureItemUpdate;
