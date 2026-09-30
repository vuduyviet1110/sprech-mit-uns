export default defineNuxtPlugin(async () => {
  const { fetchMe, hydrated } = useSession()
  if (hydrated.value) return
  try {
    const me = await fetchMe()
    // Máy mới chưa chọn ngôn ngữ thì lấy theo hồ sơ. Không chặn khởi động:
    // hỏng thì vẫn vào app với mặc định.
    if (me?.authenticated) {
      const { hydrateFromProfile } = useLanguage()
      void hydrateFromProfile()
    }
  } catch {
    // Offline / API down — leave unauthenticated
  }
})
