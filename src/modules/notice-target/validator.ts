import { z } from "zod";

export const noticeTargetCreateInputSchema = z.object({
  noticeId: z.string().uuid("Invalid Notice ID format"),
  role: z.enum(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "STAFF", "STUDENT"]).optional(),
  batchId: z.string().uuid("Invalid Batch ID format").optional(),
});

export type NoticeTargetCreateInput = z.infer<typeof noticeTargetCreateInputSchema>;
export type NoticeTargetUpdateInput = z.infer<typeof noticeTargetCreateInputSchema>;

export const validateNoticeTargetCreate = (data: unknown) => {
  return noticeTargetCreateInputSchema.parse(data);
};