-- Scholarships: a scheme the accountant grants to a student, and the grant
-- records (audit trail of the money given).
--
-- `type` is a plain text column ("PERCENT" | "FIXED") on purpose: the dev
-- database normalises enum columns into lookup tables, so every statement
-- below is guarded and the migration is a no-op where the tables already exist.

CREATE TABLE IF NOT EXISTS "scholarships" (
  "id" UUID PRIMARY KEY,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "type" VARCHAR(20) NOT NULL DEFAULT 'PERCENT',
  "value" DECIMAL(14,2) NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" UUID,
  "updatedBy" UUID,
  "deletedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "scholarship_grants" (
  "id" UUID PRIMARY KEY,
  "scholarshipId" UUID NOT NULL,
  "studentId" UUID NOT NULL,
  "studentFeeId" UUID,
  "studentFeeItemId" UUID,
  "amount" DECIMAL(14,2) NOT NULL,
  "note" TEXT,
  "grantedBy" UUID,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "revokedBy" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" UUID,
  "updatedBy" UUID,
  "deletedAt" TIMESTAMP(3)
);

CREATE UNIQUE INDEX IF NOT EXISTS "scholarships_code_key" ON "scholarships"("code");
CREATE INDEX IF NOT EXISTS "scholarships_isActive_idx" ON "scholarships"("isActive");
CREATE INDEX IF NOT EXISTS "scholarship_grants_studentId_idx" ON "scholarship_grants"("studentId");
CREATE INDEX IF NOT EXISTS "scholarship_grants_scholarshipId_idx" ON "scholarship_grants"("scholarshipId");
CREATE INDEX IF NOT EXISTS "scholarship_grants_studentFeeItemId_idx" ON "scholarship_grants"("studentFeeItemId");

-- All rows of one "grant" action share a group id, so the scholarship can be
-- taken back as a whole.
ALTER TABLE "scholarship_grants"
  ADD COLUMN IF NOT EXISTS "grantGroupId" UUID;

UPDATE "scholarship_grants"
  SET "grantGroupId" = "id"
  WHERE "grantGroupId" IS NULL;

ALTER TABLE "scholarship_grants"
  ALTER COLUMN "grantGroupId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "scholarship_grants_grantGroupId_idx" ON "scholarship_grants"("grantGroupId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scholarship_grants_scholarshipId_fkey'
  ) THEN
    ALTER TABLE "scholarship_grants"
      ADD CONSTRAINT "scholarship_grants_scholarshipId_fkey"
      FOREIGN KEY ("scholarshipId") REFERENCES "scholarships"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scholarship_grants_studentId_fkey'
  ) THEN
    ALTER TABLE "scholarship_grants"
      ADD CONSTRAINT "scholarship_grants_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "students"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scholarship_grants_studentFeeId_fkey'
  ) THEN
    ALTER TABLE "scholarship_grants"
      ADD CONSTRAINT "scholarship_grants_studentFeeId_fkey"
      FOREIGN KEY ("studentFeeId") REFERENCES "student_fees"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scholarship_grants_studentFeeItemId_fkey'
  ) THEN
    ALTER TABLE "scholarship_grants"
      ADD CONSTRAINT "scholarship_grants_studentFeeItemId_fkey"
      FOREIGN KEY ("studentFeeItemId") REFERENCES "student_fee_items"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
