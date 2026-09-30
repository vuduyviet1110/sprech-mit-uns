/**
 * Route greetings for the study fox companion.
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const route = useRoute()
  const { greetForPath, hydrateCollapsed, welcomeBack } = useStudyMascot()

  hydrateCollapsed()
  // Chào lại trước khi có lời chào theo trang đầu tiên.
  void welcomeBack()

  watch(
    () => route.path,
    (path) => {
      greetForPath(path)
    },
    { immediate: true },
  )
})
