"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSalaryStructureUpdate = exports.validateSalaryStructureCreate = exports.salaryStructureUpdateInputSchema = exports.salaryStructureCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.salaryStructureCreateInputSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid("Invalid Employee ID format"),
    basicSalary: zod_1.z.number().min(0, "Basic salary must be >= 0"),
    effectiveFromBs: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    effectiveToBs: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
        .optional()
        .nullable(),
    remarks: zod_1.z.string().max(1000, "Remarks too long").optional().nullable(),
});
exports.salaryStructureUpdateInputSchema = exports.salaryStructureCreateInputSchema.partial();
const validateSalaryStructureCreate = (data) => {
    return exports.salaryStructureCreateInputSchema.parse(data);
};
exports.validateSalaryStructureCreate = validateSalaryStructureCreate;
const validateSalaryStructureUpdate = (data) => {
    return exports.salaryStructureUpdateInputSchema.parse(data);
};
exports.validateSalaryStructureUpdate = validateSalaryStructureUpdate;
