import { z } from "zod";

const periodShape = {
  periodNumber: z.number().int().min(1, "Period number must be a positive integer"),
  name: z.string().min(1, "Period name is required").max(100, "Period name is too long"),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format")
    .max(5, "Time must be in HH:mm format")
    .refine((t: string) => t.length === 5, "Time must be in HH:mm format"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format")
    .max(5, "Time must be in HH:mm format")
    .refine((t: string) => t.length === 5, "Time must be in HH:mm format"),
  isActive: z.boolean().default(true),
};

export const periodCreateInputSchema = z.object(periodShape).superRefine((data, ctx) => {
  if (data.endTime <= data.startTime) {
    ctx.addIssue({
      code: "custom",
      path: ["endTime"],
      message: "endTime must be after startTime",
    });
  }
});

// NOTE: .partial() cannot be applied to a schema with object refinements
// (zod throws at import time), so the update schema reuses the base shape.
export const periodUpdateInputSchema = z.object(periodShape).partial();

export type PeriodCreateInput = z.infer<typeof periodCreateInputSchema>;
export type PeriodUpdateInput = z.infer<typeof periodUpdateInputSchema>;

export const validatePeriodCreate = (data: unknown) => {
  return periodCreateInputSchema.parse(data);
};

export const validatePeriodUpdate = (data: unknown) => {
  return periodUpdateInputSchema.parse(data);
};
