"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFiscalYearUpdate = exports.validateFiscalYearCreate = exports.fiscalYearUpdateInputSchema = exports.fiscalYearCreateInputSchema = void 0;
const zod_1 = require("zod");
const bsDateSchema = (field) => zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${field} must be a BS date YYYY-MM-DD`);
exports.fiscalYearCreateInputSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .regex(/^\d{4}\/\d{2}$/, "Fiscal year name must look like 2081/82"),
    startDateBs: bsDateSchema("Start date"),
    endDateBs: bsDateSchema("End date"),
    isCurrent: zod_1.z.boolean().optional(),
    isClosed: zod_1.z.boolean().optional(),
});
exports.fiscalYearUpdateInputSchema = exports.fiscalYearCreateInputSchema.partial();
const validateFiscalYearCreate = (data) => {
    return exports.fiscalYearCreateInputSchema.parse(data);
};
exports.validateFiscalYearCreate = validateFiscalYearCreate;
const validateFiscalYearUpdate = (data) => {
    return exports.fiscalYearUpdateInputSchema.parse(data);
};
exports.validateFiscalYearUpdate = validateFiscalYearUpdate;
