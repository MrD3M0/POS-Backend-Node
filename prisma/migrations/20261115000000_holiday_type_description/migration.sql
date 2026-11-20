-- Holidays can now be categorized (e.g. PUBLIC / SCHOOL / WEEKLY) and carry a
-- shared description when created as a multi-day batch.
ALTER TABLE "holidays" ADD COLUMN "type" TEXT;
ALTER TABLE "holidays" ADD COLUMN "description" TEXT;
