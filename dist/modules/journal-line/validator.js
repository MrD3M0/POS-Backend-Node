"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJournalLineCreate = exports.journalLineCreateInputSchema = void 0;
const zod_1 = require("zod");
const money_1 = require("@/lib/money");
exports.journalLineCreateInputSchema = zod_1.z.object({
    journalEntryId: zod_1.z.string().uuid("Invalid Journal Entry ID format"),
    accountId: zod_1.z.string().uuid("Invalid Account ID format"),
    debit: money_1.nonNegativeMoneySchema.optional(),
    credit: money_1.nonNegativeMoneySchema.optional(),
    description: zod_1.z.string().max(500).optional(),
    studentId: zod_1.z.string().uuid("Invalid Student ID format").optional().nullable(),
    employeeId: zod_1.z.string().uuid("Invalid Employee ID format").optional().nullable(),
});
const validateJournalLineCreate = (data) => {
    return exports.journalLineCreateInputSchema.parse(data);
};
exports.validateJournalLineCreate = validateJournalLineCreate;
