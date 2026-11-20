-- Align the legacy (normalised lookup-table) database with prisma/schema.prisma.
--
-- The original `20261001000000_init` migration was created from the legacy
-- model: status/role columns are UUID FKs into lookup tables and `users` has
-- an `isAdmin` flag. prisma/schema.prisma moved to real Postgres enums long
-- ago, but no migration ever converted the database, which is why the
-- services carried `isLegacySchemaError()` raw-SQL fallbacks.
--
-- This migration is data-preserving: every lookup id is mapped to its `code`
-- and cast to the matching enum before the lookup column/table is dropped.
-- Only `otps` is cleared (codes are short-lived, and the new shape stores a
-- bcrypt hash + purpose which cannot be derived from the old plain code).

-- ---------------------------------------------------------------------------
-- 1. Enum types (Gender / Role already exist from init).
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "OtpPurpose" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET', 'LOGIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "GuardianRelation" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CourseSystem" AS ENUM ('SEMESTER', 'YEARLY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'DROPPED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StudentApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ResultStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PUBLISHED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAID');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LEAVE', 'LATE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "JournalSource" AS ENUM ('MANUAL', 'FEE_PAYMENT', 'FEE_PAYMENT_CANCEL', 'PAYROLL', 'OPENING', 'REVERSAL', 'CLOSING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. accounts.accountTypeId -> accounts.type (AccountType)
-- ---------------------------------------------------------------------------
ALTER TABLE "accounts" ADD COLUMN "type" "AccountType";
UPDATE "accounts" a
   SET "type" = at."code"::"AccountType"
  FROM "account_types" at
 WHERE at."id" = a."accountTypeId";
UPDATE "accounts" SET "type" = 'ASSET' WHERE "type" IS NULL;
ALTER TABLE "accounts" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_accountTypeId_fkey";
DROP INDEX IF EXISTS "accounts_accountTypeId_idx";
ALTER TABLE "accounts" DROP COLUMN "accountTypeId";

-- ---------------------------------------------------------------------------
-- 3. courses.courseSystemId -> courses.system (CourseSystem)
-- ---------------------------------------------------------------------------
ALTER TABLE "courses" ADD COLUMN "system" "CourseSystem";
UPDATE "courses" c
   SET "system" = cs."code"::"CourseSystem"
  FROM "course_systems" cs
 WHERE cs."id" = c."courseSystemId";
UPDATE "courses" SET "system" = 'SEMESTER' WHERE "system" IS NULL;
ALTER TABLE "courses" ALTER COLUMN "system" SET NOT NULL;
ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_courseSystemId_fkey";
DROP INDEX IF EXISTS "courses_courseSystemId_idx";
ALTER TABLE "courses" DROP COLUMN "courseSystemId";

-- ---------------------------------------------------------------------------
-- 4. employee_attendances.statusId -> status (AttendanceStatus)
-- ---------------------------------------------------------------------------
ALTER TABLE "employee_attendances" ADD COLUMN "status" "AttendanceStatus";
UPDATE "employee_attendances" ea
   SET "status" = s."code"::"AttendanceStatus"
  FROM "attendance_statuses" s
 WHERE s."id" = ea."statusId";
UPDATE "employee_attendances" SET "status" = 'PRESENT' WHERE "status" IS NULL;
ALTER TABLE "employee_attendances" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "employee_attendances" DROP CONSTRAINT IF EXISTS "employee_attendances_statusId_fkey";
DROP INDEX IF EXISTS "employee_attendances_statusId_idx";
ALTER TABLE "employee_attendances" DROP COLUMN "statusId";

-- ---------------------------------------------------------------------------
-- 5. student_attendances.statusId -> status (AttendanceStatus)
-- ---------------------------------------------------------------------------
ALTER TABLE "student_attendances" ADD COLUMN "status" "AttendanceStatus";
UPDATE "student_attendances" sa
   SET "status" = s."code"::"AttendanceStatus"
  FROM "attendance_statuses" s
 WHERE s."id" = sa."statusId";
UPDATE "student_attendances" SET "status" = 'PRESENT' WHERE "status" IS NULL;
ALTER TABLE "student_attendances" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "student_attendances" DROP CONSTRAINT IF EXISTS "student_attendances_statusId_fkey";
DROP INDEX IF EXISTS "student_attendances_statusId_idx";
ALTER TABLE "student_attendances" DROP COLUMN "statusId";

-- ---------------------------------------------------------------------------
-- 6. guardians.relationId -> relation (GuardianRelation)
-- ---------------------------------------------------------------------------
ALTER TABLE "guardians" ADD COLUMN "relation" "GuardianRelation";
UPDATE "guardians" g
   SET "relation" = r."code"::"GuardianRelation"
  FROM "guardian_relations" r
 WHERE r."id" = g."relationId";
UPDATE "guardians" SET "relation" = 'GUARDIAN' WHERE "relation" IS NULL;
ALTER TABLE "guardians" ALTER COLUMN "relation" SET NOT NULL;
ALTER TABLE "guardians" DROP CONSTRAINT IF EXISTS "guardians_relationId_fkey";
DROP INDEX IF EXISTS "guardians_relationId_idx";
ALTER TABLE "guardians" DROP COLUMN "relationId";

-- ---------------------------------------------------------------------------
-- 7. journal_entries.sourceId -> source (JournalSource)
-- ---------------------------------------------------------------------------
ALTER TABLE "journal_entries" ADD COLUMN "source" "JournalSource";
UPDATE "journal_entries" je
   SET "source" = js."code"::"JournalSource"
  FROM "journal_sources" js
 WHERE js."id" = je."sourceId";
UPDATE "journal_entries" SET "source" = 'MANUAL' WHERE "source" IS NULL;
ALTER TABLE "journal_entries" ALTER COLUMN "source" SET NOT NULL;
ALTER TABLE "journal_entries" DROP CONSTRAINT IF EXISTS "journal_entries_sourceId_fkey";
DROP INDEX IF EXISTS "journal_entries_sourceId_idx";
ALTER TABLE "journal_entries" DROP COLUMN "sourceId";

-- ---------------------------------------------------------------------------
-- 8. payrolls.workflowStatusId -> status (PayrollStatus)
-- ---------------------------------------------------------------------------
ALTER TABLE "payrolls" ADD COLUMN "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT';
UPDATE "payrolls" p
   SET "status" = ws."code"::"PayrollStatus"
  FROM "workflow_statuses" ws
 WHERE ws."id" = p."workflowStatusId"
   AND ws."code" IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAID');
ALTER TABLE "payrolls" DROP CONSTRAINT IF EXISTS "payrolls_workflowStatusId_fkey";
DROP INDEX IF EXISTS "payrolls_workflowStatusId_idx";
ALTER TABLE "payrolls" DROP COLUMN "workflowStatusId";

-- ---------------------------------------------------------------------------
-- 9. results.workflowStatusId -> status (ResultStatus)
-- ---------------------------------------------------------------------------
ALTER TABLE "results" ADD COLUMN "status" "ResultStatus" NOT NULL DEFAULT 'PENDING';
UPDATE "results" r
   SET "status" = ws."code"::"ResultStatus"
  FROM "workflow_statuses" ws
 WHERE ws."id" = r."workflowStatusId"
   AND ws."code" IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PUBLISHED');
ALTER TABLE "results" DROP CONSTRAINT IF EXISTS "results_workflowStatusId_fkey";
DROP INDEX IF EXISTS "results_workflowStatusId_idx";
ALTER TABLE "results" DROP COLUMN "workflowStatusId";

-- ---------------------------------------------------------------------------
-- 10. students.studentStatusId / approvalStatusId -> enums
-- ---------------------------------------------------------------------------
ALTER TABLE "students" ADD COLUMN "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "students" ADD COLUMN "approvalStatus" "StudentApprovalStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "students" s
   SET "status" = ss."code"::"StudentStatus"
  FROM "student_statuses" ss
 WHERE ss."id" = s."studentStatusId";

UPDATE "students" s
   SET "approvalStatus" = ws."code"::"StudentApprovalStatus"
  FROM "workflow_statuses" ws
 WHERE ws."id" = s."approvalStatusId"
   AND ws."code" IN ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_studentStatusId_fkey";
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_approvalStatusId_fkey";
DROP INDEX IF EXISTS "students_studentStatusId_idx";
DROP INDEX IF EXISTS "students_approvalStatusId_idx";
ALTER TABLE "students" DROP COLUMN "studentStatusId", DROP COLUMN "approvalStatusId";

-- ---------------------------------------------------------------------------
-- 11. otps: plain `code` -> codeHash + purpose (ephemeral rows are cleared).
-- ---------------------------------------------------------------------------
DELETE FROM "otps";
ALTER TABLE "otps" DROP COLUMN "code";
ALTER TABLE "otps" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "otps" ADD COLUMN "codeHash" TEXT NOT NULL;
ALTER TABLE "otps" ADD COLUMN "consumedAt" TIMESTAMP(3);
ALTER TABLE "otps" ADD COLUMN "purpose" "OtpPurpose" NOT NULL;

-- ---------------------------------------------------------------------------
-- 12. users: `isAdmin` is derived from `role` in the schema.
-- ---------------------------------------------------------------------------
ALTER TABLE "users" DROP COLUMN "isAdmin";

-- ---------------------------------------------------------------------------
-- 13. Lookup tables are no longer referenced.
-- ---------------------------------------------------------------------------
DROP TABLE "account_types";
DROP TABLE "attendance_statuses";
DROP TABLE "course_systems";
DROP TABLE "guardian_relations";
DROP TABLE "journal_sources";
DROP TABLE "student_statuses";
DROP TABLE "workflow_statuses";

-- ---------------------------------------------------------------------------
-- 14. Holidays (model exists in schema, never migrated).
-- ---------------------------------------------------------------------------
CREATE TABLE "holidays" (
    "id" UUID NOT NULL,
    "dateBs" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "appliesToEmployees" BOOLEAN NOT NULL DEFAULT true,
    "appliesToStudents" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "holidays_dateBs_key" ON "holidays"("dateBs");

-- ---------------------------------------------------------------------------
-- 15. Indexes required by the schema (hot filters/orderings).
-- ---------------------------------------------------------------------------
CREATE INDEX "accounts_type_idx" ON "accounts"("type");
CREATE INDEX "attendance_sessions_teacherId_dateBs_idx" ON "attendance_sessions"("teacherId", "dateBs");
DROP INDEX IF EXISTS "attendance_sessions_teacherId_idx";
CREATE INDEX "employee_attendances_status_idx" ON "employee_attendances"("status");
CREATE UNIQUE INDEX "employees_panNo_key" ON "employees"("panNo");
CREATE UNIQUE INDEX "employees_ssfNo_key" ON "employees"("ssfNo");
CREATE INDEX "fee_installments_dueDateBs_idx" ON "fee_installments"("dueDateBs");
CREATE UNIQUE INDEX "fee_structure_items_feeStructureId_feeHeadId_termNumber_key"
  ON "fee_structure_items"("feeStructureId", "feeHeadId", "termNumber");
DROP INDEX IF EXISTS "fee_structure_items_feeStructureId_idx";
CREATE INDEX "journal_entries_source_sourceRefId_idx" ON "journal_entries"("source", "sourceRefId");
DROP INDEX IF EXISTS "journal_entries_sourceRefId_idx";
CREATE INDEX "notices_isPublished_publishedAt_idx" ON "notices"("isPublished", "publishedAt");
CREATE INDEX "otps_userId_purpose_idx" ON "otps"("userId", "purpose");
DROP INDEX IF EXISTS "otps_userId_idx";
CREATE INDEX "otps_expiresAt_idx" ON "otps"("expiresAt");
CREATE INDEX "payrolls_status_idx" ON "payrolls"("status");
CREATE INDEX "results_status_idx" ON "results"("status");
CREATE INDEX "student_attendances_status_idx" ON "student_attendances"("status");
CREATE UNIQUE INDEX "student_fee_items_studentFeeId_feeStructureItemId_key"
  ON "student_fee_items"("studentFeeId", "feeStructureItemId");
DROP INDEX IF EXISTS "student_fee_items_studentFeeId_idx";
CREATE INDEX "students_approvalStatus_idx" ON "students"("approvalStatus");
CREATE INDEX "students_status_idx" ON "students"("status");
CREATE UNIQUE INDEX "tax_slabs_fiscalYearId_isCouple_fromAmount_key"
  ON "tax_slabs"("fiscalYearId", "isCouple", "fromAmount");
DROP INDEX IF EXISTS "tax_slabs_fiscalYearId_idx";
DROP INDEX IF EXISTS "users_id_idx";

-- ---------------------------------------------------------------------------
-- 16. Foreign keys whose delete/update behaviour is declared in the schema.
-- ---------------------------------------------------------------------------
ALTER TABLE "otps" DROP CONSTRAINT IF EXISTS "otps_userId_fkey";
ALTER TABLE "otps" ADD CONSTRAINT "otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_methods" DROP CONSTRAINT IF EXISTS "payment_methods_accountId_fkey";
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employee_attendances" DROP CONSTRAINT IF EXISTS "employee_attendances_leaveTypeId_fkey";
ALTER TABLE "employee_attendances" ADD CONSTRAINT "employee_attendances_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fee_structures" DROP CONSTRAINT IF EXISTS "fee_structures_batchId_fkey";
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fee_payments" DROP CONSTRAINT IF EXISTS "fee_payments_journalEntryId_fkey";
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fee_payment_allocations" DROP CONSTRAINT IF EXISTS "fee_payment_allocations_feeInstallmentId_fkey";
ALTER TABLE "fee_payment_allocations" ADD CONSTRAINT "fee_payment_allocations_feeInstallmentId_fkey" FOREIGN KEY ("feeInstallmentId") REFERENCES "fee_installments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_parentId_fkey";
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "journal_entries" DROP CONSTRAINT IF EXISTS "journal_entries_reversalOfId_fkey";
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "journal_lines" DROP CONSTRAINT IF EXISTS "journal_lines_studentId_fkey";
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "journal_lines" DROP CONSTRAINT IF EXISTS "journal_lines_employeeId_fkey";
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payrolls" DROP CONSTRAINT IF EXISTS "payrolls_journalEntryId_fkey";
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payslips" DROP CONSTRAINT IF EXISTS "payslips_paymentMethodId_fkey";
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payslip_items" DROP CONSTRAINT IF EXISTS "payslip_items_componentId_fkey";
ALTER TABLE "payslip_items" ADD CONSTRAINT "payslip_items_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "salary_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notice_targets" DROP CONSTRAINT IF EXISTS "notice_targets_noticeId_fkey";
ALTER TABLE "notice_targets" ADD CONSTRAINT "notice_targets_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "notices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notice_targets" DROP CONSTRAINT IF EXISTS "notice_targets_batchId_fkey";
ALTER TABLE "notice_targets" ADD CONSTRAINT "notice_targets_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
