/**
 * Canonical production origin for SEO and agent-facing artefacts.
 * Override with NUXT_PUBLIC_SITE_URL on preview builds if needed; defaults to www.
 */
export const DEFAULT_SITE_URL = 'https://www.bfna.org'

export function siteUrlFromEnv(env: Record<string, string | undefined> = {}): string {
  const raw = env.NUXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL
  return raw.replace(/\/$/, '')
}

export function absoluteUrl(path: string, origin = siteUrlFromEnv()): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${origin}${normalized}`
}
