import { onBeforeUnmount, onMounted, ref, shallowRef, type Ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

interface UseInfiniteScrollOptions<T> {
  loadPage: (page: number, pageSize: number) => Promise<T[]>
  pageSize?: number
  threshold?: number
  initialItems?: T[]
  initialPage?: number
  immediate?: boolean
}

interface UseInfiniteScrollResult<T> {
  items: Ref<T[]>
  loading: Ref<boolean>
  hasMore: Ref<boolean>
  error: Ref<Error | null>
  target: Ref<HTMLElement | null>
  loadMore: () => Promise<void>
  reset: () => Promise<void>
}

/**
 * Infinite scroll helper that loads paginated data when the sentinel enters view.
 * Uses VueUse's useIntersectionObserver under the hood and supports SSR-friendly
 * initial data so the first page can still be rendered on the server.
 */
export function useInfiniteScroll<T>(
  options: UseInfiniteScrollOptions<T>
): UseInfiniteScrollResult<T> {
  const pageSize = options.pageSize ?? 100
  const threshold = options.threshold ?? 0.8
  const startingPage = options.initialPage ?? (options.initialItems?.length ? 1 : 0)

  const items = shallowRef<T[]>(options.initialItems ? [...options.initialItems] : [])
  const loading = ref(false)
  const hasMore = ref(options.initialItems ? options.initialItems.length === pageSize : true)
  const error = ref<Error | null>(null)
  const page = ref(startingPage)
  const target = ref<HTMLElement | null>(null)

  const loadMore = async () => {
    if (loading.value || !hasMore.value) {
      return
    }

    loading.value = true
    error.value = null

    const nextPage = page.value + 1

    try {
      const newItems = await options.loadPage(nextPage, pageSize)
      if (!Array.isArray(newItems)) {
        throw new Error('useInfiniteScroll loadPage must resolve to an array')
      }

      items.value = [...items.value, ...newItems]
      page.value = nextPage

      if (newItems.length < pageSize) {
        hasMore.value = false
      }
    } catch (err) {
      error.value = err as Error
      hasMore.value = false
    } finally {
      loading.value = false
    }
  }

  const reset = async () => {
    items.value = options.initialItems ? [...options.initialItems] : []
    page.value = options.initialPage ?? (options.initialItems?.length ? 1 : 0)
    hasMore.value = options.initialItems ? options.initialItems.length === pageSize : true
    error.value = null

    if ((options.immediate ?? true) && items.value.length === 0) {
      await loadMore()
    }
  }

  const observer = useIntersectionObserver(
    target,
    (entries) => {
      const [entry] = entries
      if (entry?.isIntersecting) {
        void loadMore()
      }
    },
    { threshold }
  )

  onMounted(() => {
    if ((options.immediate ?? true) && items.value.length === 0) {
      void loadMore()
    }
  })

  onBeforeUnmount(() => {
    observer.stop()
  })

  return {
    items,
    loading,
    hasMore,
    error,
    target,
    loadMore,
    reset,
  }
}
