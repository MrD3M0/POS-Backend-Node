import { z } from "zod";
import { parseBsDate } from "@/utils/bs-date";

const bsDate = (field: string) =>
  z
    .string()
    .refine((v) => parseBsDate(v) !== null, `${field} must be a valid BS date YYYY-MM-DD`);

const noticeTargetSchema = z.object({
  role: z
    .enum(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF", "STUDENT"])
    .optional()
    .nullable(),
  batchId: z.string().uuid("Invalid Batch ID format").optional().nullable(),
});

const noticeShape = {
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  body: z.string().trim().min(1, "Body is required"),
  attachmentUrl: z.string().url("Invalid URL format").optional().nullable(),
  isPinned: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),
  expiresOnBs: bsDate("expiresOnBs").optional().nullable(),
  targets: z.array(noticeTargetSchema).max(100).optional().nullable(),
};

export const noticeCreateInputSchema = z
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
export const noticeUpdateInputSchema = z.object(noticeShape).partial();

export type NoticeCreateInput = z.infer<typeof noticeCreateInputSchema>;
export type NoticeUpdateInput = z.infer<typeof noticeUpdateInputSchema>;

export const validateNoticeCreate = (data: unknown) => {
  return noticeCreateInputSchema.parse(data);
};

export const validateNoticeUpdate = (data: unknown) => {
  return noticeUpdateInputSchema.parse(data);
};
