"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateScholarshipGrant = exports.validateScholarshipUpdate = exports.validateScholarshipCreate = exports.scholarshipGrantInputSchema = exports.scholarshipUpdateInputSchema = exports.scholarshipCreateInputSchema = void 0;
const zod_1 = require("zod");
const money_1 = require("@/lib/money");
const scholarshipTypeSchema = zod_1.z.enum(["PERCENT", "FIXED"]);
const scholarshipShape = {
    name: zod_1.z.string().trim().min(1, "Name is required").max(150),
    code: zod_1.z.string().trim().max(50).optional().nullable(),
    type: scholarshipTypeSchema,
    value: money_1.positiveMoneySchema,
    description: zod_1.z.string().trim().max(500).optional().nullable(),
    isActive: zod_1.z.boolean().optional(),
};
exports.scholarshipCreateInputSchema = zod_1.z.object(scholarshipShape);
exports.scholarshipUpdateInputSchema = zod_1.z.object(scholarshipShape).partial();
exports.scholarshipGrantInputSchema = zod_1.z.object({
    scholarshipId: zod_1.z.string().uuid("Invalid Scholarship ID format"),
    studentId: zod_1.z.string().uuid("Invalid Student ID format"),
    /** Which student fee to discount (default: the student's active fee). */
    studentFeeId: zod_1.z.string().uuid("Invalid Student Fee ID format").optional(),
    /** Which fee items to discount (default: every not-skipped item). */
    feeItemIds: zod_1.z.array(zod_1.z.string().uuid("Invalid Fee Item ID format")).optional(),
    note: zod_1.z.string().trim().max(500).optional().nullable(),
});
const validateScholarshipCreate = (data) => exports.scholarshipCreateInputSchema.parse(data);
exports.validateScholarshipCreate = validateScholarshipCreate;
const validateScholarshipUpdate = (data) => exports.scholarshipUpdateInputSchema.parse(data);
exports.validateScholarshipUpdate = validateScholarshipUpdate;
const validateScholarshipGrant = (data) => exports.scholarshipGrantInputSchema.parse(data);
exports.validateScholarshipGrant = validateScholarshipGrant;
