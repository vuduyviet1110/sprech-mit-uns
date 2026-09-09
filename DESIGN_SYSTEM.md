# Sprech Mit Uns - Design System & High-Craft Guidelines (Impeccable Edition)

Tài liệu quy định tiêu chuẩn về **Style, Typography, Palette màu, Layout, Animation và Anti-Patterns** chung cho dự án **Sprech Mit Uns**. Tài liệu này được nâng cấp dựa trên bộ triết lý thiết kế cao cấp **Impeccable System (bởi Paul Bakaus)** nhằm loại bỏ hoàn toàn tình trạng giao diện AI rập khuôn ("AI Slop"), nâng tầm trải nghiệm người dùng học tiếng Đức.

---

## 🛑 1. Anti-Pattern Protocol (Các quy tắc cấm dùng - Anti AI Slop)

Để giữ cho giao diện luôn tinh tế, độc đáo và giàu tính tương tác, **tuyệt đối KHÔNG** vi phạm các lỗi thiết kế rập khuôn sau:

1. ❌ **Cấm dùng Gradient Tím - Xanh (Purple-to-Blue Slop)**: Tránh dùng các gradient `from-indigo-500 to-purple-600` phổ biến. Dự án sử dụng bảng màu thương hiệu chuẩn **Emerald Green & Deep Slate**.
2. ❌ **Cấm dùng Font mặc định Inter**: Hệ thống thống nhất 100% sử dụng font **`Nunito`** (bo tròn thân thiện, lý tưởng cho Edu-Tech).
3. ❌ **Cấm lồng Card quá nhiều tầng (Nested Cards Overload)**: Tránh tình trạng Card nằm trong Card nằm trong Container. Ưu tiên phân tách khoảng trắng (`gap`, `padding`) hoặc viền phẳng siêu mảnh (`border-slate-100 dark:border-slate-800`).
4. ❌ **Cấm Icon đứng cô đơn trên Heading**: Tránh đặt 1 icon to đùng nằm lơ lửng ngay trên tiêu đề H1/H2 một cách vô nghĩa. Icon phải đi kèm nhãn (label) hoặc đặt trong Badge có ngữ cảnh.
5. ❌ **Cấm Glassmorphism quá đà**: Tránh hiệu ứng mờ nhòe kính (`backdrop-blur`) trên bề mặt phẳng lớn gây rối mắt hoặc giảm hiệu năng render.

---

## 🎨 2. Theme Vibe & Product Intent

- **Vibe tổng thể**: **Friendly & High-Craft EdTech** (Thân thiện, Hiện đại, Tinh xảo & Tối giản).
- **Cảm xúc mang lại**: Khơi gợi cảm hứng học tập, không gây áp lực. Đơn giản nhưng sinh động nhờ hiệu ứng chuyển động có ý đồ.
- **Trải nghiệm Dark Mode**: Đồng bộ Dark/Light mode chuẩn xác đến từng thành tố qua Tailwind `dark:` và `@nuxtjs/color-mode`.

---

## 🅰️ 3. Typography & Hierarchy (`Nunito` Font Family)

Font chữ chính thức: **`Nunito`** (Google Fonts)

| Cấp độ | Class Tailwind | Ứng dụng |
| :--- | :--- | :--- |
| **Display H1** | `text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white` | Tiêu đề trang chính (`dictionary`, `vocabulary`, `lesson`) |
| **Section H2** | `text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100` | Tiêu đề khu vực, nhóm bài học |
| **Card Title H3** | `text-lg font-bold text-slate-900 dark:text-slate-100` | Tên từ vựng, tên câu hỏi quiz |
| **Body Standard** | `text-base font-normal text-slate-600 dark:text-slate-300 leading-relaxed` | Đoạn văn bản dịch, ví dụ minh họa |
| **Caption / Subtext**| `text-xs font-semibold text-slate-400 dark:text-slate-500` | Ghi chú, phiên âm, lịch ôn tập |

---

## 🌈 4. Color Palette System

Dựa trên cấu hình `tailwind.config.ts` đã khai báo:

### 4.1. Primary Brand Color (Emerald Green `#3BA676`)
Tượng trưng cho sự chính xác, động lực và sự tiến bộ học tập:
- `primary-50` (`#B4E4CF`): Background highlight từ vựng, badge đã thuộc.
- `primary-500` (`#3BA676`): Màu nút bấm chính, câu trả lời đúng, chuỗi streak.
- `primary-600` (`#2C7D59`): State Hover nút bấm chính.

### 4.2. Functional Accent Colors
- **Interactive Blue (`#0096FF`)**: Dùng cho nút phát âm audio từ vựng, hành động khám phá.
- **Error / Correct Feedback**:
  - Đúng (`Success`): `bg-emerald-500 text-white` hoặc `text-emerald-600 dark:text-emerald-400`
  - Sai (`Error`): `bg-red-500 text-white` hoặc `text-red-500 dark:text-red-400` (`#FF6464`)
- **Neutral Container & Surfaces**:
  - Light Mode: Trang `bg-slate-50`, Surface Card `bg-white border-slate-200/80 shadow-sm`
  - Dark Mode: Trang `dark:bg-slate-950`, Surface Card `dark:bg-slate-900 dark:border-slate-800`

---

## 📐 5. Layout & Steering Commands (Impeccable Vocabulary)

Khi phát triển giao diện mới hoặc điều chỉnh UI/UX, AI sẽ vận hành theo bộ từ khóa steering command của Impeccable:

- **`/simplify`**: Giảm bớt các đường viền thừa, gom nhóm thông tin trùng lặp, dùng khoảng trắng thay cho khung hộp.
- **`/bolder`**: Tăng tính tương phản cho từ vựng trọng tâm, hiển thị font cỡ lớn cho các từ tiếng Đức cần ghi nhớ.
- **`/quieter`**: Giảm bớt màu sắc sặc sỡ ở phần phụ, tập trung sự chú ý của mắt người học vào nội dung chính.
- **`/animate`**: Thêm micro-animation phản hồi khi chọn đáp án (nhún nút `active:scale-95`, hiệu ứng rung lắc `shake` khi chọn sai, hiệu ứng nảy `bounce/confetti` khi đúng).
- **`/harden`**: Xử lý mượt mà các case chữ quá dài, câu từ vựng tiếng Đức nhiều ký tự (đặc thù tiếng Đức) không bị rách layout trên Mobile.

---

## 🧱 6. Standard Component Design Specifications

### 6.1. Action Buttons
```html
<!-- Primary Button -->
<button class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2">
  <Icon name="uil:check" class="w-5 h-5" />
  <span>Lưu tiến trình</span>
</button>
```

### 6.2. High-Craft Word Flashcard
```html
<div class="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:border-primary-500/50 hover:shadow-lg hover:-translate-y-0.5">
  <!-- Content -->
</div>
```

---

## 📌 7. Tích hợp trong workflow phát triển
Mọi file Vue / Component mới được sinh ra từ đây phải được tự động đối chiếu với các nguyên tắc anti-pattern và chuẩn typography/color trong file này.
