-- =====================================================================
-- docs/constraints.sql — DB-level guards for double-entry accounting
-- (feature 7). The service layer enforces these in code too
-- (src/lib/accounting.ts); this file is the second line of defence.
--
-- Run manually AFTER `prisma migrate deploy` / `prisma migrate dev`:
--   psql "$DATABASE_URL" -f docs/constraints.sql
-- Safe to re-run (each statement is skipped if it already exists).
-- NOTE: Prisma does not set @map on columns, so identifiers are camelCase.
-- =====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'journal_lines_debit_non_negative'
  ) THEN
    ALTER TABLE journal_lines
      ADD CONSTRAINT journal_lines_debit_non_negative CHECK ("debit" >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'journal_lines_credit_non_negative'
  ) THEN
    ALTER TABLE journal_lines
      ADD CONSTRAINT journal_lines_credit_non_negative CHECK ("credit" >= 0);
  END IF;

  -- Every line is exactly one of debit or credit: one side carries the
  -- amount, the other stays 0.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'journal_lines_debit_xor_credit'
  ) THEN
    ALTER TABLE journal_lines
      ADD CONSTRAINT journal_lines_debit_xor_credit CHECK (
        ("debit" > 0 AND "credit" = 0) OR ("credit" > 0 AND "debit" = 0)
      );
  END IF;

  -- Fee flow: money columns never go negative.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fee_payments_total_amount_positive'
  ) THEN
    ALTER TABLE fee_payments
      ADD CONSTRAINT fee_payments_total_amount_positive CHECK ("totalAmount" > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_fee_items_net_non_negative'
  ) THEN
    ALTER TABLE student_fee_items
      ADD CONSTRAINT student_fee_items_net_non_negative CHECK ("netAmount" >= 0);
  END IF;
END
$$;

-- One-time fee structure rows use termNumber NULL, which the Prisma
-- @@unique([feeStructureId, feeHeadId, termNumber]) cannot enforce
-- (Postgres treats NULLs as distinct). The service checks duplicates for
-- NULL terms; this partial unique index closes the gap at DB level.
CREATE UNIQUE INDEX IF NOT EXISTS fee_structure_items_once_unique
  ON fee_structure_items ("feeStructureId", "feeHeadId")
  WHERE "termNumber" IS NULL AND "deletedAt" IS NULL;

-- Exactly one current fiscal year.
CREATE UNIQUE INDEX IF NOT EXISTS fiscal_years_single_current
  ON fiscal_years (("isCurrent"))
  WHERE "isCurrent" = TRUE AND "deletedAt" IS NULL;
