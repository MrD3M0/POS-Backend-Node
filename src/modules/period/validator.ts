import { z } from "zod";

export const periodCreateInputSchema = z.object({
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
});

export const periodUpdateInputSchema = periodCreateInputSchema.partial();

export type PeriodCreateInput = z.infer<typeof periodCreateInputSchema>;
export type PeriodUpdateInput = z.infer<typeof periodUpdateInputSchema>;

export const validatePeriodCreate = (data: unknown) => {
  return periodCreateInputSchema.parse(data);
};

export const validatePeriodUpdate = (data: unknown) => {
  return periodUpdateInputSchema.parse(data);
};
