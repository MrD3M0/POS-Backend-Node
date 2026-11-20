"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyOffSchema = exports.holidayBulkSchema = exports.holidayBulkCreateSchema = exports.holidayUpdateSchema = exports.holidayCreateSchema = exports.HOLIDAY_BULK_MAX_DATES = exports.HOLIDAY_TYPES = void 0;
const zod_1 = __importDefault(require("zod"));
const bs_date_1 = require("@/utils/bs-date");
const bsDate = zod_1.default
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dateBs must be a BS date YYYY-MM-DD")
    .refine((value) => (0, bs_date_1.parseBsDate)(value) !== null, "dateBs must be a real BS date (year 2000-2099)");
exports.HOLIDAY_TYPES = ["PUBLIC", "SCHOOL", "WEEKLY"];
/** Hard cap per bulk request — one request can never cover more than a year+2. */
exports.HOLIDAY_BULK_MAX_DATES = 366;
exports.holidayCreateSchema = zod_1.default.object({
    dateBs: bsDate,
    name: zod_1.default.string().trim().min(1, "Holiday name is required").max(150),
    type: zod_1.default.enum(exports.HOLIDAY_TYPES).optional(),
    description: zod_1.default.string().trim().max(500).optional(),
    appliesToEmployees: zod_1.default.boolean().default(true),
    appliesToStudents: zod_1.default.boolean().default(true),
});
exports.holidayUpdateSchema = exports.holidayCreateSchema.partial();
/** One shared name/type/description applied to many dates in a single transaction. */
exports.holidayBulkCreateSchema = zod_1.default
    .object({
    name: zod_1.default.string().trim().min(1, "Holiday name is required").max(150),
    type: zod_1.default.enum(exports.HOLIDAY_TYPES).default("PUBLIC"),
    description: zod_1.default.string().trim().max(500).optional(),
    dates: zod_1.default
        .array(bsDate)
        .min(1, "At least one date is required")
        .max(exports.HOLIDAY_BULK_MAX_DATES, `A bulk request is limited to ${exports.HOLIDAY_BULK_MAX_DATES} dates`),
    appliesToEmployees: zod_1.default.boolean().default(true),
    appliesToStudents: zod_1.default.boolean().default(true),
})
    .refine((value) => new Set(value.dates).size === value.dates.length, {
    message: "dates must not contain duplicates",
});
exports.holidayBulkSchema = zod_1.default.object({
    holidays: zod_1.default.array(exports.holidayCreateSchema).min(1, "At least one holiday is required").max(500),
});
exports.weeklyOffSchema = zod_1.default.object({
    yearBs: zod_1.default.number().int().min(2000).max(2099),
    name: zod_1.default.string().trim().min(1).max(150).default("Weekly off"),
});
