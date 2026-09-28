# Sprech Mit Uns — Học tiếng Đức & tiếng Séc

Ứng dụng web học ngoại ngữ cho người Việt: bài học theo chủ đề A1–B1 (Đức + Séc), SRS SM-2, shadowing, dictation YouTube, đọc báo và quiz.

## Nội dung seed (MVP)

Sau khi chạy seed, catalog đếm từ database (không hardcode marketing):

- **12 chủ đề DE A1–B1** (+ vài topic cũ nếu DB đã có) và **12 chủ đề CS A1–B1** có `sortOrder` / `prerequisiteSlug`
- Seed thêm **~432 từ/ngôn ngữ**; catalog landing đếm số thật từ DB
- Quiz tự generate ≥5 câu/chủ đề
- User demo: `demo@sprech.local` / `demo123`

## Chạy local

```bash
pnpm install
cp .env.example .env   # set NUXT_SESSION_PASSWORD (≥32 chars)
npx prisma generate
npx prisma migrate deploy   # applies init + later migrations
npx prisma db seed
pnpm dev
```

Nếu DB cũ đã `db push` / chỉ có migration streak trong `_prisma_migrations`, đánh dấu baseline rồi deploy:

```bash
npx prisma migrate resolve --applied 20260917000000_init
npx prisma migrate deploy
```

App chạy tại `http://localhost:5134`.

Đăng ký tài khoản mới, hoặc đăng nhập demo (chỉ khi không phải production / có `SMU_ALLOW_DEMO`). Các route học yêu cầu đăng nhập (session httpOnly).

```bash
pnpm test          # Vitest unit tests
pnpm build && pnpm test:e2e   # Playwright smoke (cần DB đã seed + build)

# Docker production (cần NUXT_SESSION_PASSWORD trong .env)
pnpm docker:build      # build image trước
pnpm docker:up         # chạy image đã build
pnpm docker:up:build   # build + chạy một lệnh
```

## Tính năng chính

- Lộ trình hôm nay (SRS → Shadowing → Active Recall) + bài tiếp theo theo curriculum
- Lesson: flashcard → đoạn văn → practice (sai/đúng ghi vào SRS)
- Từ điển / sổ từ vựng / ôn SRS (SM-2 duy nhất)
- YouTube dictation, news scraper (DE/CS) — cần đăng nhập
- Quiz solo; phòng nhóm là **demo** (tắt mặc định khi `NODE_ENV=production`)

## TTS & Sentry

- TTS mặc định: proxy Google (cache + retry) → fallback Web Speech. CI/local ổn định: `SMU_TTS_PROVIDER=off` và `NUXT_PUBLIC_TTS_MODE=browser`.
- Sentry tùy chọn qua `NUXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` (scrub cookie & password).
- Pháp lý: `/privacy`, `/terms` (link footer).

## Tài liệu

- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
