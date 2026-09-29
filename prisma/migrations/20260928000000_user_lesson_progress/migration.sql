-- Tiến độ chép chính tả của user cho một video YouTube (Dictation Lab)

CREATE TABLE IF NOT EXISTS "UserLessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'de',
    "clipsDone" INTEGER NOT NULL DEFAULT 0,
    "totalClips" INTEGER NOT NULL DEFAULT 0,
    "maxUnlockedIdx" INTEGER NOT NULL DEFAULT 0,
    "clipStates" JSONB NOT NULL DEFAULT '{}',
    "lastClipIdx" INTEGER NOT NULL DEFAULT 0,
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLessonProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserLessonProgress_userId_youtubeId_key" ON "UserLessonProgress"("userId", "youtubeId");

CREATE INDEX IF NOT EXISTS "UserLessonProgress_userId_idx" ON "UserLessonProgress"("userId");

CREATE INDEX IF NOT EXISTS "UserLessonProgress_userId_language_idx" ON "UserLessonProgress"("userId", "language");

ALTER TABLE "UserLessonProgress" DROP CONSTRAINT IF EXISTS "UserLessonProgress_userId_fkey";
ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
