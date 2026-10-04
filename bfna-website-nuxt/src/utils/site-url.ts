/**
 * Canonical public site origin for SEO, sitemap, robots, and JSON-LD.
 * Override with NUXT_PUBLIC_SITE_URL (e.g. preview hosts during QA).
 */
export const defaultSiteUrl = 'https://www.bfna.org'

export function normalizeSiteUrl(raw: string | undefined): string {
  const base = (raw?.trim() || defaultSiteUrl).replace(/\/+$/, '')
  return base || defaultSiteUrl
}

export function absoluteUrl(siteUrl: string, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (normalized === '/') {
    return `${siteUrl}/`
  }
  return `${siteUrl}${normalized}`
}
