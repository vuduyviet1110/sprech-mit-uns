<script lang="ts" setup>
definePageMeta({ layout: 'page' })

useHead({
  title: 'Giới thiệu về Sprech Mit Uns - Nền tảng học tiếng Đức',
})
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageHeader>
      <LayoutPageTitle text="Giới thiệu về Sprech Mit Uns" class="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white" />
      <p class="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl text-base">
        Nền tảng học tiếng Đức thông minh, cá nhân hóa trải nghiệm ghi nhớ từ vựng và chủ đề giao tiếp thực tế.
      </p>
    </LayoutPageHeader>

    <LayoutPageSection>
      <div class="space-y-12 max-w-4xl">
        <!-- Mission Section -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Icon name="uil:rocket" class="w-6 h-6 text-primary-500" />
            Sứ mệnh của dự án
          </h3>
          <p class="text-slate-600 dark:text-slate-300 leading-relaxed">
            Tiếng Đức nổi tiếng là một ngôn ngữ có ngữ pháp phức tạp và kho từ vựng đồ sộ. **Sprech Mit Uns** ra đời với mục tiêu giản đơn hóa hành trình chinh phục tiếng Đức (từ trình độ A1 đến B2+) thông qua phương pháp học theo ngữ cảnh và theo dõi tiến trình thông minh.
          </p>
        </div>

        <!-- Features Highlights -->
        <div>
          <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">Tính năng nổi bật</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 hover:border-primary-500/50 transition-all">
              <div class="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-primary-500 flex items-center justify-center mb-4">
                <Icon name="uil:brain" class="w-6 h-6" />
              </div>
              <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Ghi nhớ khoa học</h4>
              <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Áp dụng nguyên lý lặp lại ngắt quãng (Spaced Repetition) giúp đánh giá chính xác độ thành thạo của từng từ vựng.
              </p>
            </div>

            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 hover:border-primary-500/50 transition-all">
              <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center mb-4">
                <Icon name="uil:books" class="w-6 h-6" />
              </div>
              <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Học qua Ngữ cảnh</h4>
              <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Mỗi từ vựng đều đi kèm đoạn văn ngắn tiếng Đức, ví dụ thực tế và phát âm chuẩn bản xứ.
              </p>
            </div>

            <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 hover:border-primary-500/50 transition-all">
              <div class="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-500 flex items-center justify-center mb-4">
                <Icon name="uil:trophy" class="w-6 h-6" />
              </div>
              <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Thử thách Quiz</h4>
              <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Hệ thống câu hỏi trắc nghiệm tương tác tức thì, tạo động lực duy trì chuỗi ngày học (Streak).
              </p>
            </div>
          </div>
        </div>

        <!-- Tech Stack & Version -->
        <div class="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h4 class="text-base font-bold text-slate-900 dark:text-white">Phiên bản hệ thống v2.0</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">Xây dựng trên nền tảng Nuxt 3, Tailwind CSS & Prisma ORM</p>
          </div>
          <NuxtLink
            to="/dictionary"
            class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            Bắt đầu học ngay
          </NuxtLink>
        </div>
      </div>
    </LayoutPageSection>

    <!-- Sample Interactive Flashcards Demo -->
    <LayoutPageSectionFlashCardSection
      :flashcards="[
        { id: '1', word: 'Hallo', meaning: 'Xin chào', pronunciation: '/haˈloː/', language: 'de', difficulty: 'easy', type: 'Thán từ', synonyms: [], antonyms: [], topics: ['General'] },
        { id: '2', word: 'Děkuji', meaning: 'Cảm ơn', pronunciation: '/ɟɛkujɪ/', language: 'cs', difficulty: 'easy', type: 'Thán từ', synonyms: [], antonyms: [], topics: ['General'] },
        { id: '3', word: 'Lernen', meaning: 'Học tập', pronunciation: '/ˈlɛʁnən/', language: 'de', difficulty: 'medium', type: 'Động từ', synonyms: [], antonyms: [], topics: ['Education'] }
      ]"
    />
  </LayoutPageWrapper>
</template>
