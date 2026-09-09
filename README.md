# Sprech Mit Uns - Nền Tảng Học Tiếng Đức Trực Tuyến & Hỗ Trợ Tiếng Séc

> **Sprech Mit Uns** là ứng dụng web học ngoại ngữ thông minh tích hợp từ điển song ngữ (Đức - Séc) quy mô lớn chuẩn 100% từ vựng thực tế (**2,376+ từ tiếng Séc thông dụng hỗ trợ dịch song ngữ Tiếng Việt & Tiếng Anh 🇬🇧 & 200+ từ tiếng Đức**), ôn tập Spaced Repetition (SRS Flashcards), luyện gõ chính tả YouTube Dictation, cào tin tức báo tiếng Đức và hệ thống trắc nghiệm ngữ cảnh.

---

## 🚀 Các Tính Năng Nổi Bật (Features Summary)

- 📖 **Từ Điển Tiếng Séc Đa Ngữ (2,376+ Từ Thật Dịch Tiếng Việt & Tiếng Anh 🇬🇧)**: Tra cứu từ điển tiếng Séc chuẩn từ vựng thực tế hỗ trợ song ngữ Tiếng Việt & Tiếng Anh (Danh từ, Động từ, Tính từ, Số đếm, Số thứ tự, Phân số) và tiếng Đức.
- 🧠 **Thuật Toán Spaced Repetition (SRS SuperMemo-2)**: Hệ thống Flashcard tự động tính toán lịch ôn tập ngắt quãng cá nhân hóa giúp nhớ từ lâu.
- 🎬 **Luyện Gõ Chính Tả YouTube (YouTube Dictation)**: Tự động bóc tách phụ đề tiếng Đức từ video YouTube, phát từng câu để người học chép chính tả và tự kiểm tra.
- 📰 **Báo Tiếng Đức & Scraper Tin Tức**: Cào báo tiếng Đức (Tagesschau, DW), phân tích cấp độ từ vựng và hỗ trợ đọc báo với giọng đọc Text-to-Speech.
- 🎯 **Interactive Quiz Suite**: Hệ thống bài tập 3 dạng: Trắc nghiệm (Multiple Choice), Sắp xếp câu (Sentence Builder) và Nghe gõ chính tả (Dictation) kèm hiệu ứng Confetti.
- 📊 **Thống Kê Tiến Trình (Progress Analytics)**: Theo dõi số từ đã học, từ đã thành thạo, chuỗi Streak học liên tục và phân bổ theo trình độ.
- 🌙 **Giao Diện Đỉnh Cao (Impeccable Design)**: Hỗ trợ Chế độ Sáng / Tối (Dark / Light Mode) với font Nunito và hiệu ứng micro-animations mượt mà.

---

## 🛠️ Hướng Dẫn Chạy Dự Án (Quick Start)

### 1. Cài Đặt & Chạy Môi Trường Dev

```bash
# 1. Cài đặt các gói phụ thuộc
pnpm install

# 2. Sinh Prisma Client & Đồng bộ Database PostgreSQL
npx prisma generate
npx prisma db push

# 3. Nạp dữ liệu bản dịch Tiếng Anh
node prisma/update_czech_english_translations.mjs

# 4. Chạy dự án ở môi trường Dev (Port 5134)
pnpm dev
```

---

## 📑 Tài Liệu Hệ Thống

Chi tiết kiến trúc hệ thống và hướng dẫn phát triển được ghi nhận tại:
👉 [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)
