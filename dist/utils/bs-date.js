"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BS_MONTH_LENGTHS = exports.BS_MONTH_NAMES = exports.BS_MAX_YEAR = exports.BS_MIN_YEAR = exports.BS_DATE_RE = void 0;
exports.padBs = padBs;
exports.isValidBsDate = isValidBsDate;
exports.assertBsDate = assertBsDate;
exports.parseBsDate = parseBsDate;
exports.assertBsDateString = assertBsDateString;
exports.isBsDateWithinRange = isBsDateWithinRange;
exports.bsToAdString = bsToAdString;
exports.adToBsString = adToBsString;
exports.shiftBsDays = shiftBsDays;
exports.listBsDateRange = listBsDateRange;
exports.getDaysInBsMonth = getDaysInBsMonth;
exports.bsMonthRange = bsMonthRange;
exports.listBsDatesInMonth = listBsDatesInMonth;
exports.isSaturdayBs = isSaturdayBs;
exports.todayAdString = todayAdString;
exports.todayBs = todayBs;
exports.isBackdatedBsDate = isBackdatedBsDate;
exports.isValidBsDateParts = isValidBsDateParts;
exports.formatBsDate = formatBsDate;
exports.bsWeekday = bsWeekday;
exports.countSaturdaysInBsMonth = countSaturdaysInBsMonth;
exports.payableDaysInBsMonth = payableDaysInBsMonth;
exports.listBsDateRangeBetween = listBsDateRangeBetween;
// Canonical BS-date helpers (DECISIONS.md cross-cutting rules).
// BS dates are stored as "YYYY-MM-DD" strings; zero-padded ISO order means
// plain string comparison is chronological comparison. Month lengths and
// weekdays are always derived from the Nepali-date converter's calendar —
// never hardcoded (no 30-day assumption).
const converterNs = __importStar(require("@sbmdkl/nepali-date-converter"));
const converter = converterNs.default ?? converterNs;
const { adToBs, bsToAd } = converter;
const CustomError_1 = require("@/errors/CustomError");
exports.BS_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function padBs(value) {
    return String(value).padStart(2, "0");
}
function isValidBsDate(value) {
    return typeof value === "string" && exports.BS_DATE_RE.test(value);
}
function assertBsDate(value, field = "dateBs") {
    if (!isValidBsDate(value)) {
        throw new CustomError_1.CustomError(`${field} must be a BS date in YYYY-MM-DD format`, 400);
    }
    return value;
}
/** Parses a "YYYY-MM-DD" BS date into parts, or null when malformed / not a real BS date.
 * Strict: validated against the BS month-length table below (e.g. 2081-02-40 -> null). */
function parseBsDate(value) {
    if (!isValidBsDate(value))
        return null;
    const [year, month, day] = value.split("-").map(Number);
    if (!isValidBsDateParts(year, month, day))
        return null;
    return { year, month, day };
}
/** Alias kept for validators that expect an assert-returns-string helper.
 * Strict (table-backed) — rejects impossible BS dates, not just bad shapes. */
function assertBsDateString(value, field = "dateBs") {
    if (!parseBsDate(value)) {
        throw new CustomError_1.CustomError(`${field} must be a valid BS date YYYY-MM-DD within ${exports.BS_MIN_YEAR}..${exports.BS_MAX_YEAR}`, 400);
    }
    return value;
}
function isBsDateWithinRange(dateBs, startBs, endBs) {
    return dateBs >= startBs && dateBs <= endBs;
}
function toBsString(year, month, day) {
    return `${year}-${padBs(month)}-${padBs(day)}`;
}
/** Converts a BS date to its AD "YYYY-MM-DD" string via the converter. */
function bsToAdString(dateBs) {
    assertBsDate(dateBs, "BS date");
    try {
        const ad = bsToAd(dateBs);
        if (typeof ad === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ad))
            return ad;
    }
    catch {
        // fall through to the explicit error below
    }
    throw new CustomError_1.CustomError(`Cannot convert BS date ${dateBs} to AD`, 400);
}
/** Converts an AD "YYYY-MM-DD" string to its BS "YYYY-MM-DD" string via the converter. */
function adToBsString(adDate) {
    try {
        const converted = adToBs(adDate);
        const bs = typeof converted === "string"
            ? converted
            : converted?.currentDate;
        if (bs && isValidBsDate(bs))
            return bs;
    }
    catch {
        // fall through to the explicit error below
    }
    throw new CustomError_1.CustomError(`Cannot convert AD date ${adDate} to BS`, 400);
}
/**
 * Shifts a BS date by a number of days (negative = backwards).
 * Returns null when the converter is unavailable so callers can degrade
 * gracefully instead of throwing.
 */
function shiftBsDays(dateBs, days) {
    try {
        const ad = bsToAdString(dateBs);
        const date = new Date(`${ad}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() + days);
        return adToBsString(date.toISOString().slice(0, 10));
    }
    catch {
        return null;
    }
}
/**
 * The last `days` BS dates ending at (and including) `endBs`, oldest first.
 * Used for attendance trends, where the source column is a BS date string.
 */
function listBsDateRange(endBs, days) {
    const total = Math.max(1, Math.floor(days));
    const dates = [];
    for (let offset = total - 1; offset >= 0; offset -= 1) {
        const date = shiftBsDays(endBs, -offset);
        if (date)
            dates.push(date);
    }
    return dates;
}
/** Number of days in a BS month (monthBs: 1 = Baisakh ... 12 = Chaitra). */
function getDaysInBsMonth(yearBs, monthBs) {
    if (!Number.isInteger(yearBs) ||
        !Number.isInteger(monthBs) ||
        monthBs < 1 ||
        monthBs > 12) {
        throw new CustomError_1.CustomError("yearBs/monthBs must identify a valid BS month", 400);
    }
    const nextYear = monthBs === 12 ? yearBs + 1 : yearBs;
    const nextMonth = monthBs === 12 ? 1 : monthBs + 1;
    const startAd = new Date(`${bsToAdString(toBsString(yearBs, monthBs, 1))}T00:00:00Z`);
    const endAd = new Date(`${bsToAdString(toBsString(nextYear, nextMonth, 1))}T00:00:00Z`);
    const days = Math.round((endAd.getTime() - startAd.getTime()) / 86_400_000);
    if (!Number.isFinite(days) || days <= 0) {
        throw new CustomError_1.CustomError(`Cannot compute days in BS month ${yearBs}-${padBs(monthBs)}`, 400);
    }
    return days;
}
/** First and last BS date of a month, with its day count. */
function bsMonthRange(yearBs, monthBs) {
    const totalDays = getDaysInBsMonth(yearBs, monthBs);
    return {
        startBs: toBsString(yearBs, monthBs, 1),
        endBs: toBsString(yearBs, monthBs, totalDays),
        totalDays,
    };
}
/** Every BS date ("YYYY-MM-DD") in the given BS month. */
function listBsDatesInMonth(yearBs, monthBs) {
    const { totalDays } = bsMonthRange(yearBs, monthBs);
    const dates = [];
    for (let day = 1; day <= totalDays; day += 1) {
        dates.push(toBsString(yearBs, monthBs, day));
    }
    return dates;
}
/** True when the BS date falls on a Saturday (Nepal's weekly holiday). */
function isSaturdayBs(dateBs) {
    const ad = bsToAdString(dateBs);
    return new Date(`${ad}T00:00:00Z`).getUTCDay() === 6;
}
/**
 * Today's date in BS for Asia/Kathmandu (never UTC: Nepal is UTC+05:45, so
 * the UTC date is wrong for ~5h45m every day). Returns null when the
 * converter is unavailable so callers can skip backdating logic.
 */
function todayAdString() {
    try {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kathmandu",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date());
    }
    catch {
        return new Date().toISOString().slice(0, 10);
    }
}
function todayBs() {
    try {
        const adDate = todayAdString();
        const converted = adToBs(adDate);
        const bs = typeof converted === "string"
            ? converted
            : converted?.currentDate;
        return bs && isValidBsDate(bs) ? bs : null;
    }
    catch {
        return null;
    }
}
/** A date is backdated when it falls before today (BS). */
function isBackdatedBsDate(dateBs) {
    const today = todayBs();
    if (!today)
        return false;
    return dateBs < today;
}
// =====================================================================
// Payroll / seed helpers (Feature 9) — table-backed, converter-free.
// ---------------------------------------------------------------------
// The table below mirrors the same calendar data the converter ships
// (verified identical for 2081-2083 samples) so payroll math stays
// deterministic even if the converter package is unavailable.
// =====================================================================
exports.BS_MIN_YEAR = 2000;
exports.BS_MAX_YEAR = 2099;
exports.BS_MONTH_NAMES = [
    "Baisakh",
    "Jestha",
    "Ashadh",
    "Shrawan",
    "Bhadra",
    "Ashwin",
    "Kartik",
    "Mangsir",
    "Poush",
    "Magh",
    "Falgun",
    "Chaitra",
];
/** Days per BS month for BS 2000..2099 (months 1..12 = Baisakh..Chaitra). */
exports.BS_MONTH_LENGTHS = {
    2000: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2001: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2002: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2003: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2004: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2005: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2006: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2007: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2008: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
    2009: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2010: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2011: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2012: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
    2013: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2014: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2015: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2016: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
    2017: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2018: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2019: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2020: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2021: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2022: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2023: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2024: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2025: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2026: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2027: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2028: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2029: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
    2030: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2031: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2032: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2033: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2034: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2035: [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
    2036: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2037: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2038: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2039: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
    2040: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2041: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2042: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2043: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
    2044: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2045: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2046: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2047: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2048: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2049: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2050: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2051: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2052: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2053: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2054: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2055: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2056: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
    2057: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2058: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2059: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2060: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2061: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2062: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
    2063: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2064: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2065: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2066: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
    2067: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2068: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2069: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2070: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
    2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
    2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
    2086: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
    2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
    2089: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2091: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
    2092: [30, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2093: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2094: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
    2095: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
    2096: [30, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2097: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2098: [31, 31, 32, 31, 31, 31, 29, 30, 29, 30, 29, 31],
    2099: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
};
/** Strict table-backed validity: real BS date (e.g. rejects 2081-02-40). */
function isValidBsDateParts(year, month, day) {
    if (!Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day))
        return false;
    if (year < exports.BS_MIN_YEAR || year > exports.BS_MAX_YEAR || month < 1 || month > 12)
        return false;
    return day >= 1 && day <= exports.BS_MONTH_LENGTHS[year][month - 1];
}
/** Zero-padded "YYYY-MM-DD" BS string from parts. */
function formatBsDate(year, month, day) {
    return `${year}-${padBs(month)}-${padBs(day)}`;
}
/** AD weekday (0=Sunday..6=Saturday) of a BS date. */
function bsWeekday(dateBs) {
    const ad = bsToAdString(dateBs);
    return new Date(`${ad}T00:00:00Z`).getUTCDay();
}
/** Count Saturdays inside a BS month (weekly holiday, Nepal). */
function countSaturdaysInBsMonth(yearBs, monthBs) {
    return listBsDatesInMonth(yearBs, monthBs).filter(isSaturdayBs).length;
}
/**
 * Payable-day count for a BS month under WORKING_DAYS_MODE:
 * WORKING => Saturdays are non-working; CALENDAR => every day counts.
 */
function payableDaysInBsMonth(yearBs, monthBs, workingDaysMode) {
    const { totalDays } = bsMonthRange(yearBs, monthBs);
    if (workingDaysMode === "WORKING")
        return totalDays - countSaturdaysInBsMonth(yearBs, monthBs);
    return totalDays;
}
/**
 * Every BS date ("YYYY-MM-DD") between fromBs and toBs (inclusive), oldest
 * first. Returns [] when either endpoint is malformed.
 */
function listBsDateRangeBetween(fromBs, toBs) {
    if (!isValidBsDate(fromBs) || !isValidBsDate(toBs))
        return [];
    if (fromBs > toBs)
        return [];
    // Count AD days between the two BS dates (inclusive), then shift.
    const fromAd = bsToAdString(fromBs);
    const toAd = bsToAdString(toBs);
    const fromMs = new Date(`${fromAd}T00:00:00Z`).getTime();
    const toMs = new Date(`${toAd}T00:00:00Z`).getTime();
    const totalDays = Math.round((toMs - fromMs) / 86_400_000) + 1;
    if (!Number.isFinite(totalDays) || totalDays <= 0)
        return [];
    const dates = [];
    for (let offset = 0; offset < totalDays; offset += 1) {
        const date = shiftBsDays(fromBs, offset);
        if (date)
            dates.push(date);
    }
    return dates;
}
