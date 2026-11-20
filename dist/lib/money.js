"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nonNegativeMoneySchema = exports.positiveMoneySchema = void 0;
exports.dec = dec;
exports.round2 = round2;
exports.sumMoney = sumMoney;
exports.moneyEq = moneyEq;
exports.isMoneyZero = isMoneyZero;
exports.moneyStr = moneyStr;
// Money helpers — ALL money math goes through Prisma.Decimal (decimal.js),
// never Number/float. See DECISIONS.md cross-cutting rules.
const client_js_1 = require("../generated/prisma/client.js");
const CustomError_1 = require("@/errors/CustomError");
const zod_1 = require("zod");
function dec(value, field = "amount") {
    if (value === null || value === undefined) {
        throw new CustomError_1.CustomError(`${field} is required`, 400);
    }
    let parsed;
    try {
        parsed =
            value instanceof client_js_1.Prisma.Decimal
                ? value
                : new client_js_1.Prisma.Decimal(String(value));
    }
    catch {
        throw new CustomError_1.CustomError(`${field} must be a valid decimal number`, 400);
    }
    if (!parsed.isFinite()) {
        throw new CustomError_1.CustomError(`${field} must be a finite number`, 400);
    }
    return parsed;
}
/** Round to 2 decimal places (ROUND_HALF_UP) — money is stored as Decimal(14,2). */
function round2(value) {
    return value.toDecimalPlaces(2, client_js_1.Prisma.Decimal.ROUND_HALF_UP);
}
function sumMoney(values) {
    return values.reduce((accumulator, value) => accumulator.plus(value), new client_js_1.Prisma.Decimal(0));
}
function moneyEq(left, right) {
    return round2(left).eq(round2(right));
}
function isMoneyZero(value) {
    return round2(value).isZero();
}
/** Fixed 2-decimal string for JSON responses / journal comparisons. */
function moneyStr(value) {
    return round2(value).toFixed(2);
}
function moneyShape(options = {}) {
    const message = options.message ?? "Amount must be a valid money value (e.g. 1234 or 1234.56)";
    const stringSchema = zod_1.z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, message);
    const numberSchema = options.positive
        ? zod_1.z.number().positive(message).finite(message)
        : zod_1.z.number().nonnegative(message).finite(message);
    return zod_1.z.union([stringSchema, numberSchema]);
}
/** Money amounts that must be > 0 (payments, installments, allocations). */
exports.positiveMoneySchema = moneyShape({ positive: true });
/** Money amounts that may be zero (journal debit/credit, discounts). */
exports.nonNegativeMoneySchema = moneyShape();
