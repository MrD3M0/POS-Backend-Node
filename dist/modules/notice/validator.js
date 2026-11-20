"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNoticeUpdate = exports.validateNoticeCreate = exports.noticeUpdateInputSchema = exports.noticeCreateInputSchema = void 0;
const zod_1 = require("zod");
const bs_date_1 = require("@/utils/bs-date");
const bsDate = (field) => zod_1.z
    .string()
    .refine((v) => (0, bs_date_1.parseBsDate)(v) !== null, `${field} must be a valid BS date YYYY-MM-DD`);
const noticeTargetSchema = zod_1.z.object({
    role: zod_1.z
        .enum(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF", "STUDENT"])
        .optional()
        .nullable(),
    batchId: zod_1.z.string().uuid("Invalid Batch ID format").optional().nullable(),
});
const noticeShape = {
    title: zod_1.z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
    body: zod_1.z.string().trim().min(1, "Body is required"),
    attachmentUrl: zod_1.z.string().url("Invalid URL format").optional().nullable(),
    isPinned: zod_1.z.boolean().optional().default(false),
    isPublished: zod_1.z.boolean().optional().default(false),
    expiresOnBs: bsDate("expiresOnBs").optional().nullable(),
    targets: zod_1.z.array(noticeTargetSchema).max(100).optional().nullable(),
};
exports.noticeCreateInputSchema = zod_1.z
    .object(noticeShape)
    .superRefine((data, ctx) => {
    if (data.targets) {
        data.targets.forEach((target, i) => {
            if (!target.role && !target.batchId) {
                ctx.addIssue({
                    code: "custom",
                    path: ["targets", i],
                    message: "Each target must specify role and/or batchId",
                });
            }
        });
    }
});
// NOTE: .partial() cannot be applied to a schema with object refinements
// (zod throws at import time), so the update schema reuses the base shape.
exports.noticeUpdateInputSchema = zod_1.z.object(noticeShape).partial();
const validateNoticeCreate = (data) => {
    return exports.noticeCreateInputSchema.parse(data);
};
exports.validateNoticeCreate = validateNoticeCreate;
const validateNoticeUpdate = (data) => {
    return exports.noticeUpdateInputSchema.parse(data);
};
exports.validateNoticeUpdate = validateNoticeUpdate;
