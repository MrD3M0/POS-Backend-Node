// Money helpers — ALL money math goes through Prisma.Decimal (decimal.js),
// never Number/float. See DECISIONS.md cross-cutting rules.
import { Prisma } from "../generated/prisma/client.js";
import { CustomError } from "@/errors/CustomError";
import { z } from "zod";

export type MoneyInput = string | number | Prisma.Decimal;

export function dec(
  value: MoneyInput | null | undefined,
  field = "amount",
): Prisma.Decimal {
  if (value === null || value === undefined) {
    throw new CustomError(`${field} is required`, 400);
  }
  let parsed: Prisma.Decimal;
  try {
    parsed =
      value instanceof Prisma.Decimal
        ? value
        : new Prisma.Decimal(String(value));
  } catch {
    throw new CustomError(`${field} must be a valid decimal number`, 400);
  }
  if (!parsed.isFinite()) {
    throw new CustomError(`${field} must be a finite number`, 400);
  }
  return parsed;
}

/** Round to 2 decimal places (ROUND_HALF_UP) — money is stored as Decimal(14,2). */
export function round2(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export function sumMoney(values: Prisma.Decimal[]): Prisma.Decimal {
  return values.reduce(
    (accumulator, value) => accumulator.plus(value),
    new Prisma.Decimal(0),
  );
}

export function moneyEq(left: Prisma.Decimal, right: Prisma.Decimal): boolean {
  return round2(left).eq(round2(right));
}

export function isMoneyZero(value: Prisma.Decimal): boolean {
  return round2(value).isZero();
}

/** Fixed 2-decimal string for JSON responses / journal comparisons. */
export function moneyStr(value: Prisma.Decimal): string {
  return round2(value).toFixed(2);
}

function moneyShape(
  options: { positive?: boolean; message?: string } = {},
): z.ZodType<string | number> {
  const message = options.message ?? "Amount must be a valid money value (e.g. 1234 or 1234.56)";
  const stringSchema = z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, message);
  const numberSchema = options.positive
    ? z.number().positive(message).finite(message)
    : z.number().nonnegative(message).finite(message);
  return z.union([stringSchema, numberSchema]);
}

/** Money amounts that must be > 0 (payments, installments, allocations). */
export const positiveMoneySchema: z.ZodType<string | number> =
  moneyShape({ positive: true });

/** Money amounts that may be zero (journal debit/credit, discounts). */
export const nonNegativeMoneySchema: z.ZodType<string | number> =
  moneyShape();
