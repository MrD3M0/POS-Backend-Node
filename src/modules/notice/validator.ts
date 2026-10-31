import { z } from "zod";

export const noticeCreateInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  attachmentUrl: z.string().url("Invalid URL format").optional(),
  isPinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().datetime().optional(),
  expiresOnBs: z.string().datetime().optional(),
});

export type NoticeCreateInput = z.infer<typeof noticeCreateInputSchema>;
export type NoticeUpdateInput = z.infer<typeof noticeCreateInputSchema>;

export const validateNoticeCreate = (data: unknown) => {
  return noticeCreateInputSchema.parse(data);
};