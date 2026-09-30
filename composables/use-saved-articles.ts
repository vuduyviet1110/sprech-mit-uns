import { ref } from 'vue'
import { useSession } from '~/composables/use-session'

export interface SavedArticle {
  id: string
  title: string
  date: string
  level: string
  summary: string
  content: string
  sourceUrl?: string
  sourceName?: string
  lang?: 'de' | 'cs'
  isSaved?: boolean
}

const STORAGE_KEY = 'sprech_saved_news_articles'
/** Đánh dấu đã đẩy dữ liệu localStorage cũ lên server, để chỉ làm một lần. */
const MIGRATED_KEY = 'smu_news_migrated_v1'

/**
 * Bài báo đã lưu. Trước đây toàn văn nằm trong localStorage, không giới hạn —
 * xoá cache là mất sạch bài tự cào. Giờ DB là nguồn sự thật, localStorage chỉ
 * còn là bộ đệm cho trạng thái chưa đăng nhập.
 */
export function useSavedArticles() {
  const { userId } = useSession()
  const savedArticles = ref<SavedArticle[]>([])
  /** Số bài bị bỏ do vượt hạn mức ở lần ghi gần nhất. */
  const lastDropped = ref(0)

  const readLocal = (): SavedArticle[] => {
    if (!import.meta.client) return []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as SavedArticle[]) : []
    } catch {
      return []
    }
  }

  const writeLocal = (list: SavedArticle[]) => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    } catch {
      /* hết dung lượng: DB vẫn giữ bản thật */
    }
  }

  const apply = (list: unknown) => {
    if (!Array.isArray(list)) return
    savedArticles.value = list as SavedArticle[]
    writeLocal(savedArticles.value)
  }

  /** Nạp từ server; nếu còn dữ liệu cũ chưa đẩy lên thì import một lần. */
  const loadSaved = async () => {
    const local = readLocal()
    savedArticles.value = local

    if (!import.meta.client || !userId.value) return

    try {
      const migrated = localStorage.getItem(MIGRATED_KEY) === '1'
      if (!migrated && local.length > 0) {
        const res: any = await $fetch('/api/news/saved', {
          method: 'POST',
          body: { mode: 'import', articles: local },
        })
        apply(res?.articles)
        localStorage.setItem(MIGRATED_KEY, '1')
      } else {
        const res: any = await $fetch('/api/news/saved')
        apply(res?.articles)
      }
    } catch {
      /* ngoại tuyến: giữ bản cục bộ */
    }
  }

  const saveArticle = async (article: SavedArticle) => {
    const next = savedArticles.value.filter((a) => a.id !== article.id)
    next.unshift({ ...article, isSaved: true })
    savedArticles.value = next
    writeLocal(next)

    if (!import.meta.client || !userId.value) return
    try {
      const res: any = await $fetch('/api/news/saved', {
        method: 'POST',
        body: { article },
      })
      lastDropped.value = Number(res?.dropped) || 0
      apply(res?.articles)
    } catch {
      /* giữ bản cục bộ */
    }
  }

  const unsaveArticle = async (articleId: string) => {
    savedArticles.value = savedArticles.value.filter((a) => a.id !== articleId)
    writeLocal(savedArticles.value)

    if (!import.meta.client || !userId.value) return
    try {
      const res: any = await $fetch('/api/news/saved', {
        method: 'DELETE',
        body: { articleId },
      })
      apply(res?.articles)
    } catch {
      /* giữ bản cục bộ */
    }
  }

  return {
    savedArticles,
    lastDropped,
    loadSaved,
    saveArticle,
    unsaveArticle,
  }
}
