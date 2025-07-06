import { useLoadingStore } from '~/stores/loading'

export async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
  const loading = useLoadingStore()
  loading.start()
  try {
    return await fn()
  } finally {
    loading.stop()
  }
}
