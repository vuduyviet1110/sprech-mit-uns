<script lang="ts" setup>
definePageMeta({ layout: 'page' })

useHead({
  title: 'Điều khoản sử dụng - Sprech Mit Uns',
})
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageHeader>
      <LayoutPageTitle
        text="Điều khoản sử dụng"
        class="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
      />
      <p class="mt-2 max-w-2xl text-base text-slate-600 dark:text-slate-400">
        Cập nhật: tháng 9/2026. Dùng Sprech Mit Uns đồng nghĩa bạn đồng ý các điều dưới đây.
      </p>
    </LayoutPageHeader>

    <LayoutPageSection>
      <div class="mx-auto max-w-3xl space-y-6 text-base leading-relaxed text-slate-700 dark:text-slate-300">
        <section class="smu-surface rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <Icon name="lucide:book-open" class="h-5 w-5 text-primary-500" />
            Mục đích dịch vụ
          </h2>
          <p>
            Sprech Mit Uns là công cụ học tiếng Đức và tiếng Séc (A1–B1): flashcard, SRS,
            shadowing, dictation và lộ trình chủ đề. Không phải marketplace khóa học hay
            tư vấn nhập cư / pháp lý.
          </p>
        </section>

        <section class="smu-surface rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <Icon name="lucide:user-check" class="h-5 w-5 text-primary-500" />
            Tài khoản
          </h2>
          <ul class="list-disc space-y-2 pl-5">
            <li>Bạn chịu trách nhiệm bảo mật mật khẩu và hoạt động trên tài khoản.</li>
            <li>Không được phá hoại hệ thống, scrape ồ ạt, hoặc giả mạo người khác.</li>
            <li>Tài khoản demo chỉ dùng để thử nghiệm — có thể bị reset hoặc tắt trên production.</li>
          </ul>
        </section>

        <section class="smu-surface rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <Icon name="lucide:circle-alert" class="h-5 w-5 text-amber-500" />
            Giới hạn trách nhiệm
          </h2>
          <p>
            Nội dung học mang tính hỗ trợ tự học. Chúng tôi không đảm bảo kết quả thi cử
            hay độ chính xác tuyệt đối của dịch máy / transcript YouTube / tin scrape.
            Dịch vụ có thể gián đoạn khi bảo trì hoặc khi nhà cung cấp bên thứ ba lỗi.
          </p>
        </section>

        <section class="smu-surface rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <Icon name="lucide:scale" class="h-5 w-5 text-primary-500" />
            Thay đổi điều khoản
          </h2>
          <p>
            Điều khoản có thể cập nhật; phiên bản mới sẽ ghi ngày trên trang này.
            Tiếp tục dùng sau khi cập nhật được xem là chấp nhận điều khoản mới.
          </p>
        </section>

        <p class="text-sm text-slate-500">
          Xem thêm
          <NuxtLink to="/privacy" class="font-semibold text-primary-600 hover:underline">Chính sách quyền riêng tư</NuxtLink>
          ·
          <NuxtLink to="/about" class="font-semibold text-primary-600 hover:underline">Giới thiệu</NuxtLink>
        </p>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>
