-- Luyện phát âm ngắt quãng + bài báo đã lưu: chuyển từ localStorage sang DB.
-- Thuần thêm mới, không ALTER bảng cũ, không đụng dữ liệu đang có.

CREATE TABLE IF NOT EXISTS "UserPronunciationDrill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'de',
    "tip" TEXT,
    "failCount" INTEGER NOT NULL DEFAULT 1,
    "successStreak" INTEGER NOT NULL DEFAULT 0,
    "lastFailedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextDueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPronunciationDrill_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserPronunciationDrill_userId_itemKey_key" ON "UserPronunciationDrill"("userId", "itemKey");

CREATE INDEX IF NOT EXISTS "UserPronunciationDrill_userId_idx" ON "UserPronunciationDrill"("userId");

CREATE INDEX IF NOT EXISTS "UserPronunciationDrill_userId_nextDueAt_idx" ON "UserPronunciationDrill"("userId", "nextDueAt");

CREATE INDEX IF NOT EXISTS "UserPronunciationDrill_userId_language_idx" ON "UserPronunciationDrill"("userId", "language");

ALTER TABLE "UserPronunciationDrill" DROP CONSTRAINT IF EXISTS "UserPronunciationDrill_userId_fkey";
ALTER TABLE "UserPronunciationDrill" ADD CONSTRAINT "UserPronunciationDrill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "UserSavedArticle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT 'A2',
    "summary" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "language" TEXT NOT NULL DEFAULT 'de',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSavedArticle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserSavedArticle_userId_articleId_key" ON "UserSavedArticle"("userId", "articleId");

CREATE INDEX IF NOT EXISTS "UserSavedArticle_userId_idx" ON "UserSavedArticle"("userId");

CREATE INDEX IF NOT EXISTS "UserSavedArticle_userId_language_idx" ON "UserSavedArticle"("userId", "language");

CREATE INDEX IF NOT EXISTS "UserSavedArticle_userId_createdAt_idx" ON "UserSavedArticle"("userId", "createdAt");

ALTER TABLE "UserSavedArticle" DROP CONSTRAINT IF EXISTS "UserSavedArticle_userId_fkey";
ALTER TABLE "UserSavedArticle" ADD CONSTRAINT "UserSavedArticle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
