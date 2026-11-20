"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SETTING_KEYS = exports.SETTING_REGISTRY = exports.WORKING_DAYS_MODES = void 0;
exports.isKnownSettingKey = isKnownSettingKey;
exports.assertKnownSettingKey = assertKnownSettingKey;
exports.getSettingDefinition = getSettingDefinition;
exports.validateSettingValue = validateSettingValue;
exports.listEffectiveSettings = listEffectiveSettings;
exports.invalidateSettingCache = invalidateSettingCache;
exports.getSettingValue = getSettingValue;
exports.getAttendanceEditHours = getAttendanceEditHours;
exports.normalizeWorkingDaysMode = normalizeWorkingDaysMode;
exports.getWorkingDaysMode = getWorkingDaysMode;
exports.isAutoAssignFeesOnAdmission = isAutoAssignFeesOnAdmission;
// =====================================================================
// Typed settings registry — ONE place for keys, defaults and validation.
// Unknown keys are hidden from the typed UI and rejected by the API.
// Reads go through a small in-memory cache (60s TTL) invalidated on update.
// =====================================================================
const prismaClient_1 = require("@/lib/prismaClient");
const CustomError_1 = require("@/errors/CustomError");
exports.WORKING_DAYS_MODES = [
    "CALENDAR",
    "EXCLUDE_HOLIDAYS",
    "EXCLUDE_HOLIDAYS_AND_WEEKLY_OFF",
];
exports.SETTING_REGISTRY = {
    ATTENDANCE_EDIT_HOURS: {
        type: "number",
        defaultValue: "24",
        min: 0,
        max: 720,
        label: "Attendance edit window (hours)",
        group: "attendance",
        description: "Hours an attendance session stays editable after creation before it is locked (0 = lock immediately)",
    },
    AUTO_ASSIGN_FEES_ON_ADMISSION: {
        type: "enum",
        defaultValue: "true",
        values: ["true", "false"],
        label: "Assign fees automatically on admission",
        group: "fees",
        description: "When a student is approved, the fee structure of their batch (or the course default) is assigned to them automatically. Turn it off to assign fees by hand.",
    },
    WORKING_DAYS_MODE: {
        type: "enum",
        defaultValue: "CALENDAR",
        values: [...exports.WORKING_DAYS_MODES],
        legacyValues: ["WORKING"],
        label: "Working days mode",
        group: "payroll",
        description: "How payroll counts total days: all calendar days, minus holidays, or minus holidays and Saturdays",
    },
    COLLEGE_NAME: {
        type: "string",
        defaultValue: "College",
        maxLength: 120,
        label: "College name",
        group: "college",
        description: "Printed on receipts, payslips, reports and student ID cards",
    },
    COLLEGE_ADDRESS: {
        type: "string",
        defaultValue: "",
        maxLength: 255,
        label: "College address",
        group: "college",
        description: "Printed on receipts, payslips and student ID cards",
    },
    COLLEGE_AFFILIATION: {
        type: "string",
        defaultValue: "",
        maxLength: 160,
        label: "Affiliation line",
        group: "college",
        description: "Shown at the top of a student ID card, e.g. Affiliated to Purbanchal University",
    },
    COLLEGE_EMAIL: {
        type: "string",
        defaultValue: "",
        maxLength: 120,
        label: "College email",
        group: "college",
        description: "Contact email printed on student ID cards",
    },
    COLLEGE_PHONE: {
        type: "string",
        defaultValue: "",
        maxLength: 60,
        label: "College phone / contact",
        group: "college",
        description: "Contact number(s) printed on student ID cards",
    },
    COLLEGE_WEBSITE: {
        type: "string",
        defaultValue: "",
        maxLength: 120,
        label: "College website",
        group: "college",
        description: "Website printed on student ID cards",
    },
    COLLEGE_SINCE: {
        type: "string",
        defaultValue: "",
        maxLength: 40,
        label: "Established / since",
        group: "college",
        description: "Optional line shown under the logo, e.g. Since 2000",
    },
    COLLEGE_PROGRAMMES: {
        type: "string",
        defaultValue: "",
        maxLength: 255,
        label: "Programmes line",
        group: "college",
        description: "Comma-separated programmes printed in the ID card footer, e.g. BCA, BIT, BBA",
    },
    COLLEGE_PAN: {
        type: "string",
        defaultValue: "",
        maxLength: 40,
        label: "College PAN/VAT number",
        group: "college",
        description: "Printed on receipts",
    },
    COLLEGE_LOGO_URL: {
        type: "string",
        defaultValue: "",
        maxLength: 500,
        label: "College logo URL",
        group: "college",
        description: "Logo used on printed documents and student ID cards",
    },
    COLLEGE_SIGNATURE_URL: {
        type: "string",
        defaultValue: "",
        maxLength: 500,
        label: "Principal signature image URL",
        group: "college",
        description: "Optional signature image printed on student ID cards",
    },
    COLLEGE_SIGNATURE_LABEL: {
        type: "string",
        defaultValue: "Principal",
        maxLength: 60,
        label: "Signature label",
        group: "college",
        description: "Name or title printed below the signature on student ID cards",
    },
    RECEIPT_PREFIX: {
        type: "string",
        defaultValue: "RC",
        maxLength: 12,
        label: "Receipt number prefix",
        group: "fees",
        description: "Prefix for generated fee receipt numbers",
    },
    CURRENCY_LABEL: {
        type: "string",
        defaultValue: "NPR",
        maxLength: 12,
        label: "Currency label",
        group: "fees",
        description: "Currency label shown on money screens",
    },
    FEE_DUE_OFFSET_DAYS: {
        type: "number",
        defaultValue: "30",
        min: 0,
        max: 365,
        label: "Default fee due-date offset (days)",
        group: "fees",
        description: "Days after assignment that a fee item becomes due",
    },
};
exports.SETTING_KEYS = Object.keys(exports.SETTING_REGISTRY);
function isKnownSettingKey(key) {
    return Object.prototype.hasOwnProperty.call(exports.SETTING_REGISTRY, key);
}
function assertKnownSettingKey(key) {
    if (!isKnownSettingKey(key)) {
        throw new CustomError_1.CustomError(`Unknown setting key: ${key}`, 400);
    }
}
function getSettingDefinition(key) {
    assertKnownSettingKey(key);
    return exports.SETTING_REGISTRY[key];
}
function validateSettingValue(key, value) {
    const def = getSettingDefinition(key);
    if (value === undefined || value === null) {
        throw new CustomError_1.CustomError(`Setting ${key} value is required`, 400);
    }
    // String settings may be cleared (an empty college email/phone is valid).
    // Number and enum settings still require a concrete value.
    if (value === "" && def.type !== "string") {
        throw new CustomError_1.CustomError(`Setting ${key} value is required`, 400);
    }
    if (def.type === "number") {
        const n = Number(value);
        if (!Number.isFinite(n)) {
            throw new CustomError_1.CustomError(`Setting ${key} must be a number`, 400);
        }
        if (def.min !== undefined && n < def.min) {
            throw new CustomError_1.CustomError(`Setting ${key} must be >= ${def.min}`, 400);
        }
        if (def.max !== undefined && n > def.max) {
            throw new CustomError_1.CustomError(`Setting ${key} must be <= ${def.max}`, 400);
        }
    }
    else if (def.type === "enum") {
        const allowed = [...(def.values ?? []), ...(def.legacyValues ?? [])];
        if (!allowed.includes(value)) {
            throw new CustomError_1.CustomError(`Setting ${key} must be one of: ${(def.values ?? []).join(", ")}`, 400);
        }
    }
    else if (def.type === "string") {
        if (def.maxLength && value.length > def.maxLength) {
            throw new CustomError_1.CustomError(`Setting ${key} must be at most ${def.maxLength} characters`, 400);
        }
    }
}
/** Typed defaults merged with stored rows (used by the settings screen). */
async function listEffectiveSettings() {
    const rows = await prismaClient_1.prismaMain.setting.findMany({ where: { deletedAt: null } });
    const stored = new Map(rows.map((row) => [row.key, row]));
    return exports.SETTING_KEYS.map((key) => {
        const def = exports.SETTING_REGISTRY[key];
        const row = stored.get(key);
        return {
            id: row?.id ?? null,
            key,
            value: row?.value ?? def.defaultValue,
            description: row?.description ?? def.description,
            isDefault: row === undefined,
            updatedAt: row?.updatedAt ?? null,
            definition: def,
        };
    });
}
// --- in-memory cache -------------------------------------------------------
const CACHE_TTL_MS = 60_000;
const cache = new Map();
function invalidateSettingCache(key) {
    if (key)
        cache.delete(key);
    else
        cache.clear();
}
/** Returns the stored value, or the registry default when unset. Always a string. */
async function getSettingValue(key) {
    assertKnownSettingKey(key);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now())
        return cached.value;
    const row = await prismaClient_1.prismaMain.setting.findFirst({
        where: { key, deletedAt: null },
        select: { value: true },
    });
    const value = row?.value ?? exports.SETTING_REGISTRY[key].defaultValue;
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
}
/** ATTENDANCE_EDIT_HOURS as a number (0 is valid = lock immediately). */
async function getAttendanceEditHours() {
    const raw = await getSettingValue("ATTENDANCE_EDIT_HOURS");
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 24;
}
/** Normalizes legacy WORKING to the explicit mode. */
function normalizeWorkingDaysMode(value) {
    if (value === "WORKING")
        return "EXCLUDE_HOLIDAYS_AND_WEEKLY_OFF";
    if (exports.WORKING_DAYS_MODES.includes(value)) {
        return value;
    }
    return "CALENDAR";
}
async function getWorkingDaysMode() {
    return normalizeWorkingDaysMode(await getSettingValue("WORKING_DAYS_MODE"));
}
/** True when a student gets their fee assigned automatically on approval. */
async function isAutoAssignFeesOnAdmission() {
    return (await getSettingValue("AUTO_ASSIGN_FEES_ON_ADMISSION")) !== "false";
}
