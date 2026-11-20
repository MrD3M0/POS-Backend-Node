-- Approval workflow for one subject of one exam.
--
-- Approval used to live on every Result row (per student), which made the
-- principal approve students one by one and lost the "which subject did the
-- teacher submit" context. The approval state now lives on exam_subjects:
--
--   DRAFT -> PENDING (teacher submitted the marks)
--         -> APPROVED | REJECTED (principal)
--   REJECTED -> PENDING (teacher corrected and re-submitted)
--
-- Publishing stays at exam level (batch + term): once every subject of the
-- exam is APPROVED, the principal publishes and every Result of that exam is
-- flipped to PUBLISHED with publishedAt set.
--
-- The statements are guarded so the migration is safe on both the Prisma
-- schema and the normalised dev database.

ALTER TABLE "exam_subjects"
  ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "submittedBy" UUID,
  ADD COLUMN IF NOT EXISTS "approvedBy" UUID,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

CREATE INDEX IF NOT EXISTS "exam_subjects_status_idx"
  ON "exam_subjects" ("status");
