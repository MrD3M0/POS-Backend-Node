-- AttendanceStatus: replace HALF_DAY with LATE.
--
-- The Prisma schema now declares exactly: PRESENT, ABSENT, LEAVE, LATE.
-- Some databases (e.g. the local dev DB) use a normalized `statusId` FK to
-- `attendance_statuses` and have no `AttendanceStatus` enum type at all, so
-- every step below is guarded and the migration is a no-op there.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttendanceStatus') THEN
    -- Rename the existing enum value when the old label is still present.
    IF EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'AttendanceStatus' AND e.enumlabel = 'HALF_DAY'
    ) THEN
      ALTER TYPE "AttendanceStatus" RENAME VALUE 'HALF_DAY' TO 'LATE';
    END IF;

    -- Add LATE if the enum exists but was created without it.
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'AttendanceStatus' AND e.enumlabel = 'LATE'
    ) THEN
      ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'LATE';
    END IF;
  END IF;
END $$;

-- Normalized lookup table used by the dev DB: make sure LATE exists next to
-- PRESENT / ABSENT / LEAVE so the raw-SQL fallbacks can resolve it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance_statuses') THEN
    INSERT INTO attendance_statuses (id, code, name, "salaryFactor", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'LATE', 'Late', 1, true, now(), now())
    ON CONFLICT (code) DO NOTHING;
  END IF;
END $$;
