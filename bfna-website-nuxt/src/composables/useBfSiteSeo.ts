import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { absoluteUrl, siteUrlFromEnv } from '~/utils/site-url'

const DEFAULT_OG_IMAGE = '/images/hero/homepage.jpg'

export type SiteSeoOptions = {
  title?: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  path?: MaybeRefOrGetter<string | undefined>
  ogType?: MaybeRefOrGetter<string | undefined>
  ogImage?: MaybeRefOrGetter<string | undefined>
  robots?: MaybeRefOrGetter<string | undefined>
}

/**
 * Shared SEO signals for agent scanners: canonical, og:*, meta description.
 */
export function useBfSiteSeo(options: SiteSeoOptions = {}) {
  const route = useRoute()
  const runtimeConfig = useRuntimeConfig()
  const configured = String(runtimeConfig.public.siteUrl || '').trim()
  const origin = (configured || siteUrlFromEnv()).replace(/\/$/, '')

  const path = computed(() => toValue(options.path) ?? route.path)
  const canonical = computed(() => absoluteUrl(path.value, origin))
  const description = computed(() => toValue(options.description) ?? '')
  const ogImage = computed(() => absoluteUrl(toValue(options.ogImage) ?? DEFAULT_OG_IMAGE, origin))
  const ogType = computed(() => (toValue(options.ogType) ?? 'website') as 'website' | 'article')

  useSeoMeta({
    description: () => description.value || undefined,
    ogTitle: () => toValue(options.title),
    ogDescription: () => description.value || undefined,
    ogType: () => ogType.value,
    ogImage: () => ogImage.value,
    ogUrl: () => canonical.value,
    twitterCard: 'summary_large_image',
    twitterImage: () => ogImage.value
  })

  useHead({
    link: computed(() => [{ rel: 'canonical', href: canonical.value }]),
    meta: computed(() => {
      const robots = toValue(options.robots)
      return robots ? [{ name: 'robots', content: robots }] : []
    })
  })
}
