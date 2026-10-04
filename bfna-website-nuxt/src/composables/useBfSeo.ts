import { normalizeSiteUrl, absoluteUrl } from '~/utils/site-url'

const DEFAULT_OG_IMAGE =
  'https://bfna.simplyas.com/assets/0e555b6a-a774-421b-a308-b1e80c772ed1'

export interface BfSeoOptions {
  title?: string
  description?: string
  ogType?: string
  ogImage?: string
  /** Path only, e.g. `/about`. Defaults to current route. */
  canonicalPath?: string
}

/**
 * Site-wide SEO defaults (canonical, og:type, og:image) with per-page overrides.
 */
export function useBfSeo(options: BfSeoOptions = {}) {
  const route = useRoute()
  const config = useRuntimeConfig()
  const siteUrl = normalizeSiteUrl(config.public.siteUrl as string | undefined)
  const canonicalPath = options.canonicalPath ?? route.path
  const canonical = absoluteUrl(siteUrl, canonicalPath)
  const description = options.description
  const ogImage = options.ogImage ?? DEFAULT_OG_IMAGE

  useSeoMeta({
    description,
    ogTitle: options.title,
    ogDescription: description,
    ogType: options.ogType ?? 'website',
    ogImage,
    ogUrl: canonical,
    twitterCard: 'summary_large_image',
    twitterImage: ogImage
  })

  useHead({
    link: [{ rel: 'canonical', href: canonical }]
  })
}

export function useOrganizationJsonLd(extra?: Record<string, unknown>) {
  const config = useRuntimeConfig()
  const siteUrl = normalizeSiteUrl(config.public.siteUrl as string | undefined)

  const organization = {
    '@type': 'Organization',
    name: 'Bertelsmann Foundation North America',
    url: absoluteUrl(siteUrl, '/'),
    logo: absoluteUrl(siteUrl, '/'),
    description:
      'Independent, nonpartisan think tank strengthening the transatlantic partnership through research, dialogue, leadership programs, and multimedia storytelling.',
    sameAs: [
      'https://www.linkedin.com/company/bertelsmann-foundation-north-america-inc.',
      'https://www.instagram.com/bertelsmannfoundation/',
      'https://www.facebook.com/BertelsmannFoundation/',
      'https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg',
      'https://vimeo.com/bfna'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@bfna.org'
      // TODO(owner): add telephone when a public main line is confirmed for the site
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Washington',
      addressRegion: 'DC',
      addressCountry: 'US'
      // TODO(owner): confirm streetAddress and postalCode for JSON-LD and privacy page
    },
    ...extra
  }

  const website = {
    '@type': 'WebSite',
    name: 'Bertelsmann Foundation North America',
    url: absoluteUrl(siteUrl, '/')
  }

  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [organization, website]
        })
      }
    ]
  })
}

export function useArticleJsonLd(input: {
  headline: string
  description?: string
  url: string
  datePublished?: string | null
  author?: string | null
}) {
  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    url: input.url,
    mainEntityOfPage: input.url
  }
  if (input.description) {
    article.description = input.description
  }
  if (input.datePublished) {
    article.datePublished = input.datePublished
  }
  if (input.author) {
    article.author = { '@type': 'Person', name: input.author }
  }

  useHead({
    script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(article) }]
  })
}
