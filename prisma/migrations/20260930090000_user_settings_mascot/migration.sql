-- Cho phép tắt hẳn cáo đồng hành (overlay cố định góc trái dưới).
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "mascot" BOOLEAN NOT NULL DEFAULT true;
