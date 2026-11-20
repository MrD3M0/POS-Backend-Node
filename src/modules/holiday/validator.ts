import z from "zod";
import { parseBsDate } from "@/utils/bs-date";

const bsDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "dateBs must be a BS date YYYY-MM-DD")
  .refine((value) => parseBsDate(value) !== null, "dateBs must be a real BS date (year 2000-2099)");

export const HOLIDAY_TYPES = ["PUBLIC", "SCHOOL", "WEEKLY"] as const;

/** Hard cap per bulk request — one request can never cover more than a year+2. */
export const HOLIDAY_BULK_MAX_DATES = 366;

export const holidayCreateSchema = z.object({
  dateBs: bsDate,
  name: z.string().trim().min(1, "Holiday name is required").max(150),
  type: z.enum(HOLIDAY_TYPES).optional(),
  description: z.string().trim().max(500).optional(),
  appliesToEmployees: z.boolean().default(true),
  appliesToStudents: z.boolean().default(true),
});

export const holidayUpdateSchema = holidayCreateSchema.partial();

/** One shared name/type/description applied to many dates in a single transaction. */
export const holidayBulkCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Holiday name is required").max(150),
    type: z.enum(HOLIDAY_TYPES).default("PUBLIC"),
    description: z.string().trim().max(500).optional(),
    dates: z
      .array(bsDate)
      .min(1, "At least one date is required")
      .max(HOLIDAY_BULK_MAX_DATES, `A bulk request is limited to ${HOLIDAY_BULK_MAX_DATES} dates`),
    appliesToEmployees: z.boolean().default(true),
    appliesToStudents: z.boolean().default(true),
  })
  .refine((value) => new Set(value.dates).size === value.dates.length, {
    message: "dates must not contain duplicates",
  });

export const holidayBulkSchema = z.object({
  holidays: z.array(holidayCreateSchema).min(1, "At least one holiday is required").max(500),
});

export const weeklyOffSchema = z.object({
  yearBs: z.number().int().min(2000).max(2099),
  name: z.string().trim().min(1).max(150).default("Weekly off"),
});

export type HolidayCreateInput = z.infer<typeof holidayCreateSchema>;
export type HolidayUpdateInput = z.infer<typeof holidayUpdateSchema>;
export type HolidayBulkCreateInput = z.infer<typeof holidayBulkCreateSchema>;
export type HolidayBulkInput = z.infer<typeof holidayBulkSchema>;
export type WeeklyOffInput = z.infer<typeof weeklyOffSchema>;
export type HolidayType = (typeof HOLIDAY_TYPES)[number];
