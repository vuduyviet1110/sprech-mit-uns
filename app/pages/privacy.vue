<script lang="ts" setup>
definePageMeta({ layout: 'page' })

useHead({
  title: 'Chính sách quyền riêng tư - Sprech Mit Uns',
})
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageHeader>
      <LayoutPageTitle
        text="Chính sách quyền riêng tư"
        class="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
      />
      <p class="mt-2 max-w-2xl text-base text-slate-600 dark:text-slate-400">
        Cập nhật: tháng 9/2026. Sprech Mit Uns tôn trọng dữ liệu học tập của bạn.
      </p>
    </LayoutPageHeader>

    <LayoutPageSection>
      <div class="mx-auto max-w-3xl space-y-6 text-base leading-relaxed text-slate-700 dark:text-slate-300">
        <section class="smu-surface rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <Icon name="lucide:database" class="h-5 w-5 text-primary-500" />
            Dữ liệu chúng tôi lưu
          </h2>
          <ul class="list-disc space-y-2 pl-5">
            <li>Email và mật khẩu đã băm (bcrypt) để đăng nhập.</li>
            <li>Tiến trình học: SRS, streak, bài học YouTube bạn lưu, sổ từ, cài đặt.</li>
            <li>Cookie phiên httpOnly (<code class="text-sm">smu_session</code>) — không lưu mật khẩu dạng plaintext.</li>
          </ul>
        </section>

        <section class="smu-surface rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <Icon name="lucide:mic" class="h-5 w-5 text-blue-500" />
            Âm thanh &amp; dịch vụ bên thứ ba
          </h2>
          <p>
            Phát âm có thể dùng proxy TTS hoặc Web Speech trên trình duyệt của bạn.
            Tính năng tin tức / dịch có thể gọi dịch vụ dịch thuật bên ngoài khi bạn chủ động dùng.
            Không bán dữ liệu cá nhân cho bên thứ ba.
          </p>
        </section>

        <section class="smu-surface rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <Icon name="lucide:activity" class="h-5 w-5 text-amber-500" />
            Theo dõi lỗi (Sentry)
          </h2>
          <p>
            Nếu bật Sentry (DSN cấu hình trên máy chủ), chúng tôi nhận báo cáo lỗi kỹ thuật
            để sửa bug. Cookie và mật khẩu được loại khỏi sự kiện trước khi gửi.
          </p>
        </section>

        <section class="smu-surface rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <Icon name="lucide:shield" class="h-5 w-5 text-primary-500" />
            Quyền của bạn
          </h2>
          <p>
            Bạn có thể yêu cầu xem / xóa tài khoản bằng cách liên hệ chủ dự án.
            Xóa tài khoản sẽ gỡ tiến trình học gắn với user đó.
          </p>
        </section>

        <p class="text-sm text-slate-500">
          Xem thêm
          <NuxtLink to="/terms" class="font-semibold text-primary-600 hover:underline">Điều khoản sử dụng</NuxtLink>
          ·
          <NuxtLink to="/about" class="font-semibold text-primary-600 hover:underline">Giới thiệu</NuxtLink>
        </p>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>
