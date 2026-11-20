-- Add ClassSchedule model and DayOfWeek enum
-- Weekly class routine: which teacher+subject assignment meets which period on which day, in which room, for what effective date range.

CREATE TYPE "DayOfWeek" AS ENUM ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

CREATE TABLE "class_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "teachingAssignmentId" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "room" TEXT,
    "effectiveFromBs" VARCHAR(10) NOT NULL,
    "effectiveToBs" VARCHAR(10),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("id")
);

-- Unique: one schedule per assignment+period+day+effectiveFrom (allows history when re-scheduled).
CREATE UNIQUE INDEX "class_schedules_teachingAssignmentId_periodId_dayOfWeek_effe_key" ON "class_schedules"("teachingAssignmentId", "periodId", "dayOfWeek", "effectiveFromBs");

-- Lookup for the weekly grid (day column x period row).
CREATE INDEX "class_schedules_dayOfWeek_periodId_idx" ON "class_schedules"("dayOfWeek", "periodId");

-- Index for teacher routine queries.
CREATE INDEX "class_schedules_teachingAssignmentId_idx" ON "class_schedules"("teachingAssignmentId");

ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_teachingAssignmentId_fkey" FOREIGN KEY ("teachingAssignmentId") REFERENCES "teaching_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;