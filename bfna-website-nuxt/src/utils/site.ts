/**
 * Facts the public site already states, plus the canonical origin.
 *
 * JSON-LD, canonical URLs, the sitemap, and llms.txt all read this module so
 * the production host is not the Netlify preview host. Nothing here is a
 * guess: each value is either the configured origin or a string already
 * published in `content/bf/**` or `components/bf/Footer.vue`.
 *
 * TODO(owner): street address, postal code, and phone. The contact band still
 * defaults to the placeholder "[street address — Directus contact singleton]".
 * `content/bf/pages/stiftung.json` says the foundation is Washington, DC-based.
 * No street, postal code, or telephone is published in v2 content, so none is
 * added here.
 *
 * TODO(owner): Bluesky. The footer still links "#bluesky-profile-url", so that
 * profile is omitted from `sameAs`.
 *
 * TODO(owner): confirm whether "Bertelsmann Foundation (North America), Inc."
 * — the name on the live production privacy policy at /privacy-policy/ — is
 * the legal name this site should publish. It is quoted on the privacy page
 * from that policy. It is not added to JSON-LD.
 */
import home from '../../content/bf/pages/home.json'

export const SITE_NAME = 'Bertelsmann Foundation North America'

/** Opening sentence of `content/bf/pages/home.json`. */
export const DEFAULT_DESCRIPTION = home.excerpt

export const DEFAULT_OG_IMAGE_PATH = '/images/bfna-og.jpg'

/** The address `bfContactSection` already publishes. */
export const CONTACT_EMAIL = 'info@bfna.org'

/**
 * Profiles the footer already links, excluding the Bluesky placeholder.
 * `tests/agent-readiness.spec.ts` fails if Footer.vue
 * gains or drops an https profile without this list changing.
 */
export const SAME_AS: readonly string[] = [
  'https://www.linkedin.com/company/bertelsmann-foundation-north-america-inc.',
  'https://www.instagram.com/bertelsmannfoundation/',
  'https://www.facebook.com/BertelsmannFoundation/',
  'https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg',
  'https://vimeo.com/bfna'
]

export const POSTAL_ADDRESS = {
  '@type': 'PostalAddress' as const,
  addressLocality: 'Washington',
  addressRegion: 'DC',
  addressCountry: 'US'
}

/** `https://www.bfna.org`, or `NUXT_PUBLIC_SITE_URL` when set. */
export function siteOrigin(value?: string | null): string {
  const raw = (value ?? '').trim() || 'https://www.bfna.org'
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`
  return new URL(withScheme).origin
}

/**
 * Absolute URL on the canonical origin.
 *
 * Pages get a trailing slash because Netlify's pretty URLs 301 a slash-less
 * path onto the slashed one. Files (a dot in the last segment) do not.
 */
export function canonicalUrl(siteUrl: string, path: string): string {
  const origin = siteOrigin(siteUrl)
  const bare = (path.split('?')[0] ?? '').split('#')[0] ?? '/'
  const slashed = bare.startsWith('/') ? bare : `/${bare}`
  if (slashed === '/') return `${origin}/`
  const trimmed = slashed.replace(/\/+$/, '')
  const last = trimmed.split('/').pop() ?? ''
  if (last.includes('.')) return `${origin}${trimmed}`
  return `${origin}${trimmed}/`
}

export function absoluteUrl(siteUrl: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  if (pathOrUrl.startsWith('//')) return `https:${pathOrUrl}`
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return canonicalUrl(siteUrl, path)
}

/**
 * Same shape as `layouts/bf-default.vue`'s `titleTemplate`: a page title, or
 * the site name alone on the homepage.
 */
export function documentTitle(pageTitle?: string | null): string {
  const title = pageTitle?.trim()
  return title ? `${title} | ${SITE_NAME}` : SITE_NAME
}

/** One line for a meta description or an llms.txt link. Does not join paragraphs of a whole page. */
export function oneLine(value: string | null | undefined, max = 220): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

/**
 * `YYYY-MM-DD` from a content `publish_date`, or undefined.
 *
 * Unparseable values are omitted. Callers must not substitute file mtime.
 */
export function lastmodFromPublishDate(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return undefined
  return `${match[1]}-${match[2]}-${match[3]}`
}

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function organizationJsonLd(siteUrl: string) {
  const url = canonicalUrl(siteUrl, '/')
  return {
    '@type': 'Organization',
    '@id': `${url}#organization`,
    name: SITE_NAME,
    url,
    description: DEFAULT_DESCRIPTION,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(siteUrl, DEFAULT_OG_IMAGE_PATH)
    },
    email: CONTACT_EMAIL,
    address: POSTAL_ADDRESS,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'general inquiries',
      email: CONTACT_EMAIL
    },
    sameAs: [...SAME_AS]
  }
}

export function websiteJsonLd(siteUrl: string) {
  const url = canonicalUrl(siteUrl, '/')
  return {
    '@type': 'WebSite',
    '@id': `${url}#website`,
    name: SITE_NAME,
    url,
    description: DEFAULT_DESCRIPTION,
    publisher: { '@id': `${url}#organization` }
  }
}

export function homepageJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [organizationJsonLd(siteUrl), websiteJsonLd(siteUrl)]
  }
}

export interface ArticleJsonLdInput {
  path: string
  headline: string
  description?: string
  datePublished?: string | null
  authors?: string[]
  image?: string | null
}

export function articleJsonLd(siteUrl: string, article: ArticleJsonLdInput) {
  const url = canonicalUrl(siteUrl, article.path)
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    url,
    mainEntityOfPage: url,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(siteUrl, DEFAULT_OG_IMAGE_PATH)
      }
    }
  }
  const description = oneLine(article.description)
  if (description) data.description = description
  const date = lastmodFromPublishDate(article.datePublished)
  if (date) data.datePublished = date
  const authors = (article.authors ?? []).map(name => name.trim()).filter(Boolean)
  if (authors.length) {
    data.author = authors.map(name => ({ '@type': 'Person', name }))
  }
  if (article.image) data.image = absoluteUrl(siteUrl, article.image)
  return data
}
