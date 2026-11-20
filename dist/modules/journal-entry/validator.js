"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJournalEntryReverse = exports.validateJournalEntryCreate = exports.journalEntryReverseInputSchema = exports.journalEntryCreateInputSchema = exports.journalLineInputSchema = void 0;
const zod_1 = require("zod");
const money_1 = require("@/lib/money");
exports.journalLineInputSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid("Invalid Account ID format"),
    debit: money_1.nonNegativeMoneySchema.optional(),
    credit: money_1.nonNegativeMoneySchema.optional(),
    description: zod_1.z.string().max(500).optional(),
    studentId: zod_1.z.string().uuid("Invalid Student ID format").optional().nullable(),
    employeeId: zod_1.z.string().uuid("Invalid Employee ID format").optional().nullable(),
});
exports.journalEntryCreateInputSchema = zod_1.z.object({
    fiscalYearId: zod_1.z.string().uuid("Invalid Fiscal Year ID format"),
    dateBs: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "dateBs must be a BS date YYYY-MM-DD"),
    description: zod_1.z
        .string()
        .trim()
        .min(1, "Description is required")
        .max(1000, "Description is too long"),
    source: zod_1.z
        .enum([
        "MANUAL",
        "FEE_PAYMENT",
        "FEE_PAYMENT_CANCEL",
        "PAYROLL",
        "OPENING",
        "REVERSAL",
        "CLOSING",
    ])
        .optional()
        .default("MANUAL"),
    // entryNo is generated server-side as JV-<fiscalYear>-<6-digit seq>.
    lines: zod_1.z
        .array(exports.journalLineInputSchema)
        .min(2, "A journal entry requires at least 2 lines"),
});
exports.journalEntryReverseInputSchema = zod_1.z.object({
    description: zod_1.z.string().trim().max(1000).optional(),
    dateBs: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "dateBs must be a BS date YYYY-MM-DD")
        .optional(),
});
const validateJournalEntryCreate = (data) => {
    return exports.journalEntryCreateInputSchema.parse(data);
};
exports.validateJournalEntryCreate = validateJournalEntryCreate;
const validateJournalEntryReverse = (data) => {
    return exports.journalEntryReverseInputSchema.parse(data ?? {});
};
exports.validateJournalEntryReverse = validateJournalEntryReverse;
