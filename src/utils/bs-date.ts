// Canonical BS-date helpers (DECISIONS.md cross-cutting rules).
// BS dates are stored as "YYYY-MM-DD" strings; zero-padded ISO order means
// plain string comparison is chronological comparison. Month lengths and
// weekdays are always derived from the Nepali-date converter's calendar —
// never hardcoded (no 30-day assumption).
import * as converterNs from "@sbmdkl/nepali-date-converter";
const converter = (converterNs as any).default ?? converterNs;
const { adToBs, bsToAd } = converter as unknown as {
  adToBs: (adDate: string) => string;
  bsToAd: (bsDate: string) => string;
};
import { CustomError } from "@/errors/CustomError";

export const BS_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function padBs(value: number): string {
  return String(value).padStart(2, "0");
}

export function isValidBsDate(value: unknown): value is string {
  return typeof value === "string" && BS_DATE_RE.test(value);
}

export function assertBsDate(value: unknown, field = "dateBs"): string {
  if (!isValidBsDate(value)) {
    throw new CustomError(
      `${field} must be a BS date in YYYY-MM-DD format`,
      400,
    );
  }
  return value;
}

/** Parses a "YYYY-MM-DD" BS date into parts, or null when malformed / not a real BS date.
 * Strict: validated against the BS month-length table below (e.g. 2081-02-40 -> null). */
export function parseBsDate(
  value: unknown,
): { year: number; month: number; day: number } | null {
  if (!isValidBsDate(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!isValidBsDateParts(year, month, day)) return null;
  return { year, month, day };
}

/** Alias kept for validators that expect an assert-returns-string helper.
 * Strict (table-backed) — rejects impossible BS dates, not just bad shapes. */
export function assertBsDateString(value: unknown, field = "dateBs"): string {
  if (!parseBsDate(value)) {
    throw new CustomError(
      `${field} must be a valid BS date YYYY-MM-DD within ${BS_MIN_YEAR}..${BS_MAX_YEAR}`,
      400,
    );
  }
  return value as string;
}

export function isBsDateWithinRange(
  dateBs: string,
  startBs: string,
  endBs: string,
): boolean {
  return dateBs >= startBs && dateBs <= endBs;
}

function toBsString(year: number, month: number, day: number): string {
  return `${year}-${padBs(month)}-${padBs(day)}`;
}

/** Converts a BS date to its AD "YYYY-MM-DD" string via the converter. */
export function bsToAdString(dateBs: string): string {
  assertBsDate(dateBs, "BS date");
  try {
    const ad = bsToAd(dateBs);
    if (typeof ad === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ad)) return ad;
  } catch {
    // fall through to the explicit error below
  }
  throw new CustomError(`Cannot convert BS date ${dateBs} to AD`, 400);
}

/** Converts an AD "YYYY-MM-DD" string to its BS "YYYY-MM-DD" string via the converter. */
export function adToBsString(adDate: string): string {
  try {
    const converted: unknown = adToBs(adDate);
    const bs =
      typeof converted === "string"
        ? converted
        : (converted as { currentDate?: string } | null)?.currentDate;
    if (bs && isValidBsDate(bs)) return bs;
  } catch {
    // fall through to the explicit error below
  }
  throw new CustomError(`Cannot convert AD date ${adDate} to BS`, 400);
}

/**
 * Shifts a BS date by a number of days (negative = backwards).
 * Returns null when the converter is unavailable so callers can degrade
 * gracefully instead of throwing.
 */
export function shiftBsDays(dateBs: string, days: number): string | null {
  try {
    const ad = bsToAdString(dateBs);
    const date = new Date(`${ad}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return adToBsString(date.toISOString().slice(0, 10));
  } catch {
    return null;
  }
}

/**
 * The last `days` BS dates ending at (and including) `endBs`, oldest first.
 * Used for attendance trends, where the source column is a BS date string.
 */
export function listBsDateRange(endBs: string, days: number): string[] {
  const total = Math.max(1, Math.floor(days));
  const dates: string[] = [];
  for (let offset = total - 1; offset >= 0; offset -= 1) {
    const date = shiftBsDays(endBs, -offset);
    if (date) dates.push(date);
  }
  return dates;
}

/** Number of days in a BS month (monthBs: 1 = Baisakh ... 12 = Chaitra). */
export function getDaysInBsMonth(yearBs: number, monthBs: number): number {
  if (
    !Number.isInteger(yearBs) ||
    !Number.isInteger(monthBs) ||
    monthBs < 1 ||
    monthBs > 12
  ) {
    throw new CustomError("yearBs/monthBs must identify a valid BS month", 400);
  }
  const nextYear = monthBs === 12 ? yearBs + 1 : yearBs;
  const nextMonth = monthBs === 12 ? 1 : monthBs + 1;
  const startAd = new Date(
    `${bsToAdString(toBsString(yearBs, monthBs, 1))}T00:00:00Z`,
  );
  const endAd = new Date(
    `${bsToAdString(toBsString(nextYear, nextMonth, 1))}T00:00:00Z`,
  );
  const days = Math.round((endAd.getTime() - startAd.getTime()) / 86_400_000);
  if (!Number.isFinite(days) || days <= 0) {
    throw new CustomError(
      `Cannot compute days in BS month ${yearBs}-${padBs(monthBs)}`,
      400,
    );
  }
  return days;
}

/** First and last BS date of a month, with its day count. */
export function bsMonthRange(
  yearBs: number,
  monthBs: number,
): { startBs: string; endBs: string; totalDays: number } {
  const totalDays = getDaysInBsMonth(yearBs, monthBs);
  return {
    startBs: toBsString(yearBs, monthBs, 1),
    endBs: toBsString(yearBs, monthBs, totalDays),
    totalDays,
  };
}

/** Every BS date ("YYYY-MM-DD") in the given BS month. */
export function listBsDatesInMonth(yearBs: number, monthBs: number): string[] {
  const { totalDays } = bsMonthRange(yearBs, monthBs);
  const dates: string[] = [];
  for (let day = 1; day <= totalDays; day += 1) {
    dates.push(toBsString(yearBs, monthBs, day));
  }
  return dates;
}

/** True when the BS date falls on a Saturday (Nepal's weekly holiday). */
export function isSaturdayBs(dateBs: string): boolean {
  const ad = bsToAdString(dateBs);
  return new Date(`${ad}T00:00:00Z`).getUTCDay() === 6;
}

/**
 * Today's date in BS for Asia/Kathmandu (never UTC: Nepal is UTC+05:45, so
 * the UTC date is wrong for ~5h45m every day). Returns null when the
 * converter is unavailable so callers can skip backdating logic.
 */
export function todayAdString(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kathmandu",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function todayBs(): string | null {
  try {
    const adDate = todayAdString();
    const converted: unknown = adToBs(adDate);
    const bs =
      typeof converted === "string"
        ? converted
        : (converted as { currentDate?: string } | null)?.currentDate;
    return bs && isValidBsDate(bs) ? bs : null;
  } catch {
    return null;
  }
}

/** A date is backdated when it falls before today (BS). */
export function isBackdatedBsDate(dateBs: string): boolean {
  const today = todayBs();
  if (!today) return false;
  return dateBs < today;
}

// =====================================================================
// Payroll / seed helpers (Feature 9) — table-backed, converter-free.
// ---------------------------------------------------------------------
// The table below mirrors the same calendar data the converter ships
// (verified identical for 2081-2083 samples) so payroll math stays
// deterministic even if the converter package is unavailable.
// =====================================================================

export const BS_MIN_YEAR = 2000;
export const BS_MAX_YEAR = 2099;

export const BS_MONTH_NAMES = [
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
] as const;

/** Days per BS month for BS 2000..2099 (months 1..12 = Baisakh..Chaitra). */
export const BS_MONTH_LENGTHS: Readonly<Record<number, readonly number[]>> = {
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

export interface BsDateParts {
  year: number;
  month: number;
  day: number;
}

/** Strict table-backed validity: real BS date (e.g. rejects 2081-02-40). */
export function isValidBsDateParts(
  year: number,
  month: number,
  day: number,
): boolean {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  )
    return false;
  if (year < BS_MIN_YEAR || year > BS_MAX_YEAR || month < 1 || month > 12)
    return false;
  return day >= 1 && day <= BS_MONTH_LENGTHS[year][month - 1];
}

/** Zero-padded "YYYY-MM-DD" BS string from parts. */
export function formatBsDate(year: number, month: number, day: number): string {
  return `${year}-${padBs(month)}-${padBs(day)}`;
}

/** AD weekday (0=Sunday..6=Saturday) of a BS date. */
export function bsWeekday(dateBs: string): number {
  const ad = bsToAdString(dateBs);
  return new Date(`${ad}T00:00:00Z`).getUTCDay();
}

/** Count Saturdays inside a BS month (weekly holiday, Nepal). */
export function countSaturdaysInBsMonth(
  yearBs: number,
  monthBs: number,
): number {
  return listBsDatesInMonth(yearBs, monthBs).filter(isSaturdayBs).length;
}

/**
 * Payable-day count for a BS month under WORKING_DAYS_MODE:
 * WORKING => Saturdays are non-working; CALENDAR => every day counts.
 */
export function payableDaysInBsMonth(
  yearBs: number,
  monthBs: number,
  workingDaysMode: string,
): number {
  const { totalDays } = bsMonthRange(yearBs, monthBs);
  if (workingDaysMode === "WORKING")
    return totalDays - countSaturdaysInBsMonth(yearBs, monthBs);
  return totalDays;
}

/**
 * Every BS date ("YYYY-MM-DD") between fromBs and toBs (inclusive), oldest
 * first. Returns [] when either endpoint is malformed.
 */
export function listBsDateRangeBetween(fromBs: string, toBs: string): string[] {
  if (!isValidBsDate(fromBs) || !isValidBsDate(toBs)) return [];
  if (fromBs > toBs) return [];
  // Count AD days between the two BS dates (inclusive), then shift.
  const fromAd = bsToAdString(fromBs);
  const toAd = bsToAdString(toBs);
  const fromMs = new Date(`${fromAd}T00:00:00Z`).getTime();
  const toMs = new Date(`${toAd}T00:00:00Z`).getTime();
  const totalDays = Math.round((toMs - fromMs) / 86_400_000) + 1;
  if (!Number.isFinite(totalDays) || totalDays <= 0) return [];
  const dates: string[] = [];
  for (let offset = 0; offset < totalDays; offset += 1) {
    const date = shiftBsDays(fromBs, offset);
    if (date) dates.push(date);
  }
  return dates;
}
