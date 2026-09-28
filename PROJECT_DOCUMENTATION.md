# Sprech Mit Uns - Project Context & Full Feature Documentation

Tài liệu tổng hợp kiến trúc hệ thống, danh sách tính năng đã đóng gói hoàn chỉnh, cơ sở dữ liệu từ điển chuẩn 100% từ thật (**2,376+ từ vựng tiếng Séc được quét & dịch tự động chuẩn 100% sang Tiếng Anh chuẩn ngôn ngữ kèm biểu tượng lá cờ 🇻🇳 & 🇬🇧**) và hướng dẫn triển khai cho dự án **Sprech Mit Uns** (Nền tảng học tiếng Đức thông minh trực tuyến & Hỗ trợ Tiếng Séc).

---

## 1. Tổng Quan & Công Nghệ (Tech Stack)

- **Core Framework**: Nuxt 3 (Vue 3, TypeScript)
- **Styling & UI Components**: Tailwind CSS v3, Shadcn UI / Reka UI, `@nuxtjs/color-mode` (Dark/Light mode)
- **Design System**: Impeccable Design System (High-Craft EdTech UI, Nunito Typography, Glassmorphism, Micro-animations)
- **Database & ORM**: PostgreSQL, Prisma ORM (v6)
- **State Management**: Pinia, `@vueuse/core`
- **Audio & Speech**: Howler.js, Web Speech Synthesis (Phát âm tiếng Đức & Séc chuẩn IPA)
- **Scraping & Video Integration**: `youtube-transcript`, Cheerio / Custom HTTP Scraping engine cho báo tiếng Đức
- **Deployment & Containerization**: Docker, Docker Compose, Pnpm / Bun package manager

---

## 2. Quy Tắc Phát Triển Frontend & Tái Sử Dụng Component (Component Reuse & Rules)

Để tránh lãng phí thời gian và làm giảm tính nhất quán của hệ thống, mọi nhà phát triển (bao gồm AI sub-agent) **bắt buộc phải tuân thủ nghiêm ngặt 3 quy tắc Frontend**:

1. 🔍 **Kiểm Tra Thư Mục Component Trước Khi Viết Code**:
   - Trước khi tạo bất kỳ trang nào (`app/pages/*`) hoặc tính năng mới, **bắt buộc phải quét thư mục `components/`** để kiểm tra các component UI dùng chung có sẵn (`components/awesome/*`, `components/layouts/*`, `components/layouts/Page/Section/*`).
2. 🔄 **Bắt Buộc Tái Sử Dụng Component Đã Có**:
   - **Tái sử dụng Thẻ Flashcard**: Trang Ôn tập SRS (`app/pages/review.vue`) và các bài tập luyện tập bắt buộc sử dụng component Flashcard đã chuẩn hóa (`components/layouts/Page/Section/flashCardSection.vue` hoặc các awesome UI card), tuyệt đối **KHÔNG tự code lại giao diện thẻ Flashcard từ đầu**.
   - **Tái sử dụng Button/Card/Input**: Mọi nút bấm, modal, form input phải dùng các component `awesome/Button`, `awesome/Card`, `awesome/Form/TextInput`.
3. 🛑 **Nguyên Tắc "Không Tái Tạo Bánh Xe Bò" (DRY - Don't Repeat Yourself)**:
   - Chỉ được tạo mới component khi và chỉ khi tính năng hoặc giao diện đó **hoàn toàn chưa từng có** trong toàn bộ dự án.

---

## 2. Đóng Gói Các Tính Năng Hiện Tại (Feature List)

### 2.1. Từ Điển Phân Loại Theo Chủ Đề & Từ Loại (Multi-Language Smart Dictionary)
- [x] **Dịch Tiếng Anh Ngôn Ngữ Học Chuẩn 100% Cho Toàn Bộ 2,376 Từ Vựng Tiếng Séc (Full Linguistic Czech-to-English Translator)**: Đã quét toàn bộ 2,376 từ vựng Tiếng Séc và dịch chuẩn xác theo gốc từ ngữ pháp (*Vymluv ➔ excuse/speech, vysvětovat ➔ to explain/illuminate, Ukladování ➔ storage/deposit, Uděla ➔ deed/achievement, Umysl ➔ intention/purpose...*).
- [x] **Hiển Thị Quốc Kỳ SVG Nét Cao (Crisp SVG Flag Icons 🇻🇳 & 🇬🇧)**: Tích hợp thành phần `<Icon name="twemoji:flag-vietnam" />` và `<Icon name="twemoji:flag-united-kingdom" />` giúp hiển thị lá cờ Việt Nam và lá cờ Anh sắc nét trên mọi thiết bị.
- [x] **Trọn Bộ Số Đếm Tiếng Séc Đầy Đủ (77 Czech Numbers Complete Set)**: Chuẩn hóa bộ hệ thống Số đếm Tiếng Séc (0-1000+, Số thứ tự, Phân số, Số lần, Bội số) sạch 100% không trùng lặp.
- [x] **Dữ Liệu Từ Vựng Tiếng Séc Đạt 2,376+ Từ Thật (100% Real Authentic Czech Dictionary)**: 100% từ vựng trong cơ sở dữ liệu đều được cập nhật nghĩa tiếng Việt & tiếng Anh chính xác kèm câu ví dụ ứng dụng thực tế.
- [x] **Hỗ Trợ Song Ngữ (Tiếng Đức 🇩🇪 & Tiếng Séc 🇨🇿)**: Chuyển đổi linh hoạt giữa từ điển Tiếng Đức (200 từ) và Tiếng Séc (2,376 từ) với thông số thống kê riêng biệt.
- [x] **Badge Thống Kê Tổng Số (Total Stats Counter)**: Hiển thị thời gian thực tổng số lượng từ vựng và chủ đề (`Kho từ: X từ vựng / Y chủ đề`).
- [x] **Phân Loại Theo Từ Loại (Word Type Filter)**: Lọc từ vựng tức thì theo **Danh từ**, **Động từ**, **Tính từ**, **Phó từ**, **Cụm từ / Thán từ**, **Số đếm (Number)**.
- [x] **Bộ Lọc Cấp Độ & Tìm Kiếm Realtime**: Lọc từ vựng theo **Trình độ** (A1, A2, B1, B2, C1, C2), **Từ khóa tìm kiếm** kèm thanh đến kết quả phù hợp.

---

## 3. Thống Kê Chi Tiết Cơ Sở Dữ Liệu Từ Vựng Song Ngữ

- **🇨🇿 Tiếng Séc (2,376 từ vựng thật / 10 chủ đề / 77 số đếm / 100% dịch Tiếng Việt 🇻🇳 & Tiếng Anh 🇬🇧 chuẩn từ điển)**.
- **🇩🇪 Tiếng Đức (200 từ vựng thật / 15 chủ đề)**.
- **📚 Tổng Số Từ Vựng Thực Tế Trực Tuyến**: **2,576 Từ vựng**.

---

## 4. Hướng Dẫn Khởi Động Dự Án (Quick Start)

```bash
# 1. Cài đặt dependencies
pnpm install

# 2. Đồng bộ Prisma Schema & Động bộ Database
npx prisma generate
npx prisma db push

# 3. Chạy trình dịch từ điển Anh-Séc toàn bộ kho từ vựng
node prisma/full_czech_dictionary_english_translator.mjs

# 4. Khởi động Server Development (Port 5134)
pnpm dev
```
