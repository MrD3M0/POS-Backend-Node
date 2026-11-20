"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNoticeTargetCreate = exports.noticeTargetCreateInputSchema = void 0;
const zod_1 = require("zod");
exports.noticeTargetCreateInputSchema = zod_1.z.object({
    noticeId: zod_1.z.string().uuid("Invalid Notice ID format"),
    role: zod_1.z.enum(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF", "STUDENT"]).optional(),
    batchId: zod_1.z.string().uuid("Invalid Batch ID format").optional(),
});
const validateNoticeTargetCreate = (data) => {
    return exports.noticeTargetCreateInputSchema.parse(data);
};
exports.validateNoticeTargetCreate = validateNoticeTargetCreate;
