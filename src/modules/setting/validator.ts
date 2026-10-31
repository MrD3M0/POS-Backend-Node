import { z } from "zod";

export const settingCreateInputSchema = z.object({
  key: z.string().min(1, "Setting key is required").max(100, "Setting key is too long"),
  value: z.string().min(1, "Setting value is required").max(5000, "Setting value is too long"),
  description: z.string().max(500, "Description too long").optional().nullable(),
});

export const settingUpdateInputSchema = settingCreateInputSchema.partial();

export type SettingCreateInput = z.infer<typeof settingCreateInputSchema>;
export type SettingUpdateInput = z.infer<typeof settingUpdateInputSchema>;

export const validateSettingCreate = (data: unknown) => {
  return settingCreateInputSchema.parse(data);
};

export const validateSettingUpdate = (data: unknown) => {
  return settingUpdateInputSchema.parse(data);
};
