-- Chuỗi ngày học liên tiếp trên bảng User.
-- Hai cột này đã có trong 20260917000000_init nên ở đây là no-op; giữ lại để
-- DB nào từng `db push` trước khi có migration vẫn bắt kịp.
--
-- LƯU Ý: dòng đầu file này từng là `#` — không phải cú pháp comment của Postgres
-- (`--`), nên `migrate deploy` trên DB sạch báo `syntax error at or near "#"`.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "studyStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastStudyDate" TEXT;
