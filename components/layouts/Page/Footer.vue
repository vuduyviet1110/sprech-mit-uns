<script lang="ts" setup>
const { awesome } = useAppConfig()
</script>

<template>
  <footer
    class="border-t border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 py-12 px-4 transition-colors duration-300"
  >
    <div class="container mx-auto">
      <!-- Footer Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand Column -->
        <div>
          <div class="flex items-center space-x-2 mb-4">
            <BookOpen class="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span class="text-xl font-bold text-gray-900 dark:text-white">{{
              awesome?.name
            }}</span>
          </div>
          <p class="text-gray-600 dark:text-gray-400">
            {{ awesome?.description || 'Learn German with ease and fun!' }}
          </p>
        </div>

        <!-- Learning Section -->
        <div>
          <h4 class="font-semibold mb-4 text-gray-800 dark:text-white">
            Learning
          </h4>
          <ul class="space-y-2 text-gray-600 dark:text-gray-400">
            <li>Lessons</li>
            <li>Vocabulary</li>
            <li>Grammar</li>
            <li>Pronunciation</li>
          </ul>
        </div>

        <!-- Tools Section -->
        <div>
          <h4 class="font-semibold mb-4 text-gray-800 dark:text-white">
            Tools
          </h4>
          <ul class="space-y-2 text-gray-600 dark:text-gray-400">
            <li>Flashcards</li>
            <li>Dictionary</li>
            <li>Progress Tracker</li>
            <li>Quizzes</li>
          </ul>
        </div>

        <!-- Support Section -->
        <div>
          <h4 class="font-semibold mb-4 text-gray-800 dark:text-white">
            Support
          </h4>
          <ul class="space-y-2 text-gray-600 dark:text-gray-400">
            <li>Help Center</li>
            <li>Community</li>
            <li>Contact</li>
            <li>Feedback</li>
          </ul>
        </div>
      </div>

      <!-- Footer Bottom -->
      <div
        class="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400"
      >
        <p>&copy; 2024 {{ awesome.name }}. Made with ❤️ for German learners.</p>
      </div>
    </div>
  </footer>
</template>
