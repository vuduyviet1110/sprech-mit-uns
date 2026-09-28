# Migration checklist (manual if migrate deploy not used)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "studyStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastStudyDate" TEXT;
