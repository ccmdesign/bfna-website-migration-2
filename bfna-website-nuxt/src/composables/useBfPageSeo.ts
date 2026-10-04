/**
 * Per-page title, description, Open Graph type, and image.
 *
 * `layouts/bf-default.vue` reads the entry for the current path when it
 * renders `<head>`. A page calls this during setup; the layout's head
 * getters run after that, so the values are in the prerendered HTML.
 */
import { computed, watchEffect } from 'vue'

export interface BfPageSeo {
  title?: string
  description?: string
  type?: 'website' | 'article'
  image?: string
}

export function useBfPageSeo(source: () => BfPageSeo) {
  const route = useRoute()
  const map = useState<Record<string, BfPageSeo>>('bf-page-seo', () => ({}))
  watchEffect(() => {
    map.value = { ...map.value, [route.path]: source() }
  })
}

export function useBfSeoForRoute() {
  const route = useRoute()
  const map = useState<Record<string, BfPageSeo>>('bf-page-seo', () => ({}))
  return computed(() => map.value[route.path] ?? {})
}
