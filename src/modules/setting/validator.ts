import { z } from "zod";

export const settingCreateInputSchema = z.object({
  key: z.string().min(1, "Setting key is required").max(100, "Setting key is too long"),
  // String settings may be cleared (e.g. an empty college phone). Number and
  // enum values are still required by the registry validation.
  value: z.string().max(5000, "Setting value is too long"),
  description: z.string().max(500, "Description too long").optional().nullable(),
});

export const settingUpdateInputSchema = settingCreateInputSchema.partial();

/** Body for PUT /settings/key/:key — the registry validates the value against the key. */
export const settingValueSchema = z.object({
  value: z.string().max(5000, "Setting value is too long"),
});

export type SettingCreateInput = z.infer<typeof settingCreateInputSchema>;
export type SettingUpdateInput = z.infer<typeof settingUpdateInputSchema>;

export const validateSettingCreate = (data: unknown) => {
  return settingCreateInputSchema.parse(data);
};

export const validateSettingUpdate = (data: unknown) => {
  return settingUpdateInputSchema.parse(data);
};

export const validateSettingValueBody = (data: unknown) => {
  return settingValueSchema.parse(data);
};
