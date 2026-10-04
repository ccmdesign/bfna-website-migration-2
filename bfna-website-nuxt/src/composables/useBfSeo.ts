import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { absoluteAssetUrl, canonicalUrl } from '~/utils/site-url'
import { BFNA_NAME } from '~/utils/structured-data'

type Schema = Record<string, unknown>
interface SchemaEntry { key: string; data: MaybeRefOrGetter<Schema | undefined> }
interface BfSeoOptions { title: MaybeRefOrGetter<string>; description: MaybeRefOrGetter<string>; image?: MaybeRefOrGetter<string | undefined>; type?: 'website' | 'article'; robots?: MaybeRefOrGetter<string | undefined>; schemas?: SchemaEntry[] }

const serializeSchema = (value: Schema): string => JSON.stringify(value).replace(/</g, '\\u003c')

export const useBfSeo = (options: BfSeoOptions): void => {
  const route = useRoute()
  const config = useRuntimeConfig()
  const origin = computed(() => String(config.public.siteUrl || 'https://www.bfna.org'))
  const canonical = computed(() => canonicalUrl(origin.value, route.path))
  const title = computed(() => toValue(options.title))
  const fullTitle = computed(() => title.value === BFNA_NAME ? BFNA_NAME : `${title.value} | ${BFNA_NAME}`)
  const description = computed(() => toValue(options.description))
  const image = computed(() => absoluteAssetUrl(origin.value, options.image ? toValue(options.image) : undefined))
  const robots = computed(() => options.robots ? toValue(options.robots) : undefined)

  useSeoMeta({ description: () => description.value, robots: () => robots.value, ogTitle: () => fullTitle.value, ogDescription: () => description.value, ogType: options.type ?? 'website', ogUrl: () => canonical.value, ogImage: () => image.value, twitterCard: 'summary_large_image', twitterTitle: () => fullTitle.value, twitterDescription: () => description.value, twitterImage: () => image.value })
  useHead(() => ({ link: [{ key: 'canonical', rel: 'canonical', href: canonical.value }], script: (options.schemas ?? []).flatMap(entry => { const data = toValue(entry.data); return data ? [{ key: entry.key, type: 'application/ld+json', innerHTML: serializeSchema(data) }] : [] }) }))
}
