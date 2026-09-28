# Sprech Mit Uns - Design System & High-Craft Guidelines (Impeccable & Taste Edition)

> **Enforced:** `DESIGN.md` + `PRODUCT.md` + `.cursor/rules/design-system.mdc` + Impeccable (`npx impeccable`, `/impeccable`).  
> Shared CSS tokens: `.smu-page`, `.smu-surface`, `.smu-btn`, `.smu-btn-ghost`, `.smu-label` in `assets/scss/app.scss`.

Tài liệu quy định tiêu chuẩn về **Style, Taste, Iconography, Typography, Palette màu, Layout, Animation và Anti-Patterns** chung cho dự án **Sprech Mit Uns**. Tài liệu này được nâng cấp dựa trên bộ triết lý thiết kế cao cấp **Impeccable System (bởi Paul Bakaus)** và **Taste Skill Architecture** nhằm loại bỏ hoàn toàn tình trạng giao diện AI rập khuôn ("AI Slop"), đảm bảo 100% component mới tạo ra đều nhất quán về thẩm mỹ.

---

## 🛑 1. Anti-Pattern Protocol (Các quy tắc cấm dùng - Anti AI Slop)

Để giữ cho giao diện luôn tinh tế, độc đáo và giàu tính tương tác, **tuyệt đối KHÔNG** vi phạm các lỗi thiết kế rập khuôn sau:

1. ❌ **Cấm dùng Gradient Tím - Xanh (Purple-to-Blue Slop)**: Tránh dùng các gradient `from-indigo-500 to-purple-600` phổ biến. Dự án sử dụng bảng màu thương hiệu chuẩn **Emerald Green & Deep Slate**.
2. ❌ **Cấm dùng Font mặc định Inter hoặc Font chữ quá nhỏ (`text-xs`, `text-[10px]`)**: Hệ thống thống nhất 100% sử dụng font **`Nunito`** (bo tròn thân thiện). Kích thước chữ phải dễ đọc: từ vựng chính `text-xl`/`text-2xl`, dịch nghĩa/ví dụ `text-base`/`text-lg`.
3. ❌ **Cấm Icon không đồng bộ / Icon mặc định**: Cấm pha trộn emoji vô nghĩa hoặc các bộ icon khác nhau. Hệ thống thống nhất **100% dùng Lucide Icons** (`lucide:*`) thông qua `<Icon name="lucide:name" />`.
4. ❌ **Cấm bóp hẹp giao diện (`max-w-7xl` tạo khoảng trống 2 bên quá rộng)**: Tránh bóp giao diện vào giữa tạo 2 mảng lề trống trải trên màn hình desktop rộng. Sử dụng Layout **Full-width tối ưu (`w-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12`)** giống như Facebook / YouTube.
5. ❌ **Cấm lồng Card quá nhiều tầng (Nested Cards Overload)**: Tránh tình trạng Card nằm trong Card nằm trong Container. Ưu tiên phân tách khoảng trắng (`gap`, `padding`) hoặc viền phẳng siêu mảnh (`border-slate-200/80 dark:border-slate-800`).
6. ❌ **Cấm Glassmorphism quá đà**: Tránh hiệu ứng mờ nhòe kính (`backdrop-blur`) trên bề mặt phẳng lớn gây rối mắt hoặc giảm hiệu năng render.
7. ❌ **Cấm tự tạo UI trùng lặp (Strict Component Reuse Protocol)**: **TUYỆT ĐỐI KHÔNG** tự mã hóa (hardcode) lại các component UI hoặc hiệu ứng/thẻ flashcard nếu trong dự án đã có sẵn component dùng chung (`components/awesome/*`, `components/layouts/*`, vv.). Phải luôn kiểm tra danh sách component hiện có trong cây thư mục `components/` trước khi xây dựng trang mới. Chỉ được phép tạo component mới khi tính năng hoàn toàn chưa tồn tại.

---

## 🎯 2. Mandatory Product Taste: `Playful & High-Craft EdTech`

Mọi trang và component trong dự án phải bắt buộc tuân theo Taste Spec sau:

- **Vibe tổng thể**: **Friendly & High-Craft EdTech** (Thân thiện, Tinh xảo, Rõ ràng & Trực quan).
- **Mục tiêu sản phẩm**: Giúp người học ngôn ngữ (Séc 🇨🇿 & Đức 🇩🇪) cảm thấy thư thái, chữ to rõ ràng, không mỏi mắt, duy trì động lực học hàng ngày qua các tương tác xúc giác (*tactile micro-interactions*).
- **Bộ thông số Taste (Taste Matrix)**:
  - **Layout Surface**: Layout tràn lề linh hoạt `w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10`
  - **Surface Style**: Bề mặt đơn lớp phẳng `bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl`
  - **Corner Radius**: Chuẩn `rounded-xl` cho nút/input và `rounded-2xl` cho surface container.
  - **Tactile Feedback**: Tất cả các nút bấm & thẻ có tương tác PHẢI có class `active:scale-95 transition-all duration-200 cursor-pointer`.
  - **Color Intent**: Emerald Green (`#3BA676`) đại diện cho động lực & đáp án đúng. Amber đại diện cho Streak & High Score. Red đại diện cho thách thức. Slate neutrals cho nền & container.

---

## 💎 3. Iconography Protocol (Chuẩn Icon Nhất Quán)

Dự án sử dụng module `nuxt-icon` tích hợp bộ thư viện **Lucide Icons** cho toàn bộ giao diện:

- **Cú pháp sử dụng**: `<Icon name="lucide:icon-name" class="w-5 h-5" />`
- **Kích thước chuẩn**:
  - Icon trong Nút bấm / Badge: `w-5 h-5` hoặc `w-6 h-6`
  - Icon đại diện Feature Container: `w-7 h-7`
- **Quy tắc phối màu Icon**:
  - Icon Primary: `text-primary-500`
  - Icon Neutral: `text-slate-400 dark:text-slate-500`
  - Icon State: `text-emerald-500` (Thành công), `text-red-500` (Lỗi), `text-amber-500` (Thưởng)

---

## 🅰️ 4. Typography & Hierarchy (`Nunito` Font Family - Cỡ chữ to rõ)

Font chữ chính thức: **`Nunito`** (Google Fonts)

| Cấp độ | Class Tailwind | Ứng dụng |
| :--- | :--- | :--- |
| **Display H1** | `text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white` | Tiêu đề trang chính (`dictionary`, `vocabulary`, `review`) |
| **Section H2** | `text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white` | Tiêu đề chủ đề từ vựng, danh mục học |
| **Word Title H3** | `text-xl md:text-2xl font-black text-slate-900 dark:text-white` | Từ vựng tiếng Đức / Séc chính |
| **Body Standard** | `text-base md:text-lg font-bold text-slate-700 dark:text-slate-200 leading-relaxed` | Nghĩa tiếng Việt, câu ví dụ |
| **Caption / Subtext**| `text-sm font-semibold text-slate-400 dark:text-slate-500` | Phiên âm IPA, ghi chú, ngữ cảnh |

---

## 🌈 5. Color Palette System

Dựa trên cấu hình `tailwind.config.ts` đã khai báo:

### 5.1. Primary Brand Color (Emerald Green `#3BA676`)
Tượng trưng cho sự chính xác, động lực và sự tiến bộ học tập:
- `primary-50` (`#B4E4CF`): Background highlight từ vựng, badge đã thuộc.
- `primary-500` (`#3BA676`): Màu nút bấm chính, câu trả lời đúng, chuỗi streak.
- `primary-600` (`#2C7D59`): State Hover nút bấm chính.

### 5.2. Functional Accent Colors
- **Interactive Blue (`#0096FF`)**: Dùng cho nút phát âm audio từ vựng, hành động khám phá.
- **Error / Correct Feedback**:
  - Đúng (`Success`): `bg-emerald-500 text-white` hoặc `text-emerald-600 dark:text-emerald-400`
  - Sai (`Error`): `bg-red-500 text-white` hoặc `text-red-500 dark:text-red-400` (`#FF6464`)
- **Neutral Container & Surfaces**:
  - Light Mode: Trang `bg-slate-50`, Surface Card `bg-white border-slate-200/80 shadow-sm`
  - Dark Mode: Trang `dark:bg-slate-950`, Surface Card `dark:bg-slate-900 dark:border-slate-800`

---

## 🧱 6. Standard Component Specifications

### 6.1. Primary Action Button
```html
<button class="px-6 py-3 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-extrabold rounded-xl shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-base">
  <Icon name="lucide:check" class="w-5 h-5" />
  <span>Lưu tiến trình</span>
</button>
```

### 6.2. High-Craft Surface Card
```html
<div class="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 transition-all duration-200 hover:border-primary-500/50 hover:shadow-md">
  <!-- Content -->
</div>
```

---

## 📌 7. Quy trình áp dụng bắt buộc (Strict Enforcement)

Mọi file Vue / Component bắt buộc tuân theo layout tràn lề `w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10` và font chữ to rõ ràng (`text-base`, `text-lg`, `text-xl`, `text-2xl`), không bóp hẹp lề vô lý làm xuất hiện khoảng trống chết 2 bên trên màn hình rộng.
