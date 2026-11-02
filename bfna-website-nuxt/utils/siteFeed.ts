/**
 * The public site feed: RSS 2.0 at `/feed.xml`, JSON Feed 1.1 at `/feed.json`.
 *
 * Built from the `bfInsights` collection, the same rows `/insights/:slug`
 * renders, by `server/routes/feed.*.ts` and prerendered to static files
 * (`nitro.prerender.routes` in `src/nuxt.config.ts`). This module is pure, no
 * Nuxt and no Vue, so `tests/agent-readiness/site-feed.test.ts` can run it.
 *
 * What gets in, newest first, capped at `FEED_ITEM_LIMIT`:
 *
 * - a routed insight: not one of the 17 homepage highlight records
 *   (`featured` / `retired_news`), which have no detail page;
 * - with a `publish_date` that is not in the future. The 3 undated rows are
 *   left out rather than given a made-up date.
 *
 * The snapshot only holds published Directus records, so there is no draft to
 * filter here; the gate is "has a page on the site".
 */
import { formatLabel } from '../src/utils/format'
import { SITE_NAME, SITE_URL } from './agentContent'

export const FEED_PATH = '/feed.xml'
export const JSON_FEED_PATH = '/feed.json'
/** Seeded into `nitro.prerender.routes`; `feedOutputProblems` asserts both were written. */
export const FEED_ROUTES = [FEED_PATH, JSON_FEED_PATH] as const
export const FEED_ITEM_LIMIT = 50
export const FEED_SUMMARY_LENGTH = 300
export const FEED_DESCRIPTION =
  'Insights from the Bertelsmann Foundation North America: research, analysis, video and infographics on democracy, transatlantic relations and future leadership.'

/** The fields of a `bfInsights` row the feed reads. */
export interface FeedInsight {
  slug: string
  heading: string | null
  subheading: string | null
  excerpt: string | null
  content: string | null
  publish_date: string | null
  format: string | null
  program: string | null
  authors: string[]
  featured: boolean
  retired_news: boolean
}

export interface FeedItem {
  title: string
  url: string
  date: Date
  summary: string
  authors: string[]
  categories: string[]
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** Plain text, cut on a word boundary. The normaliser strips most HTML already; `content` may still carry some. */
export function summarize(value: string, maxLength = FEED_SUMMARY_LENGTH): string {
  const text = decodeEntities(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  const cut = text.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.]+$/, '')}…`
}

/** A `YYYY-MM-DD` publish date as UTC midnight; anything unparseable is null. */
export function parseFeedDate(value: string | null): Date | null {
  if (!value || !value.trim()) return null
  const raw = value.trim()
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00Z` : raw)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * One insight as a feed item, or null when it has no page or no date.
 * `programs` is the set of real program names: 52 rows carry a migration
 * signal (`PENDING-Q3 …`, `RE-TAG …`) in `program` that a reader must never see.
 */
export function toFeedItem(insight: FeedInsight, programs: ReadonlySet<string>, now: Date = new Date()): FeedItem | null {
  if (insight.featured || insight.retired_news) return null
  const title = insight.heading?.trim()
  const date = parseFeedDate(insight.publish_date)
  if (!insight.slug || !title || !date || date > now) return null

  const summarySource = insight.excerpt || insight.subheading || insight.content || ''
  const categories = [formatLabel(insight.format)]
  if (insight.program && programs.has(insight.program)) categories.unshift(insight.program)

  return {
    title,
    url: `${SITE_URL}/insights/${encodeURIComponent(insight.slug)}`,
    date,
    summary: summarize(summarySource),
    authors: [...new Set(insight.authors.map(name => name.trim()).filter(Boolean))],
    categories
  }
}

/** Newest first (title breaks ties, so the order is stable), de-duplicated by URL, capped. */
export function feedItems(
  insights: FeedInsight[],
  programs: ReadonlySet<string>,
  now: Date = new Date(),
  limit = FEED_ITEM_LIMIT
): FeedItem[] {
  const seen = new Set<string>()
  return insights
    .map(insight => toFeedItem(insight, programs, now))
    .filter((item): item is FeedItem => item !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title))
    .filter(item => !seen.has(item.url) && Boolean(seen.add(item.url)))
    .slice(0, limit)
}

function xmlEscape(value: string): string {
  return value
    // Characters XML 1.0 does not allow at all
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** RFC 822 date, as RSS 2.0 requires: `Tue, 21 Jul 2026 00:00:00 GMT`. */
export function rfc822(date: Date): string {
  return date.toUTCString()
}

export function rssXml(items: FeedItem[], buildDate: Date = new Date()): string {
  const lastBuild = items[0]?.date ?? buildDate
  const body = items.map(item => [
    '    <item>',
    `      <title>${xmlEscape(item.title)}</title>`,
    `      <link>${xmlEscape(item.url)}</link>`,
    `      <guid isPermaLink="true">${xmlEscape(item.url)}</guid>`,
    `      <pubDate>${rfc822(item.date)}</pubDate>`,
    ...item.authors.map(name => `      <dc:creator>${xmlEscape(name)}</dc:creator>`),
    ...item.categories.map(name => `      <category>${xmlEscape(name)}</category>`),
    ...(item.summary ? [`      <description>${xmlEscape(item.summary)}</description>`] : []),
    '    </item>'
  ].join('\n'))

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    `    <title>${xmlEscape(SITE_NAME)}</title>`,
    `    <link>${SITE_URL}/</link>`,
    `    <description>${xmlEscape(FEED_DESCRIPTION)}</description>`,
    '    <language>en-us</language>',
    `    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>`,
    `    <atom:link href="${SITE_URL}${FEED_PATH}" rel="self" type="application/rss+xml"/>`,
    ...body,
    '  </channel>',
    '</rss>',
    ''
  ].join('\n')
}

/** JSON Feed 1.1, https://www.jsonfeed.org/version/1.1/ */
export function jsonFeed(items: FeedItem[]): string {
  return `${JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title: SITE_NAME,
    home_page_url: `${SITE_URL}/`,
    feed_url: `${SITE_URL}${JSON_FEED_PATH}`,
    description: FEED_DESCRIPTION,
    language: 'en-US',
    items: items.map(item => ({
      id: item.url,
      url: item.url,
      title: item.title,
      ...(item.summary ? { summary: item.summary } : {}),
      content_text: item.summary || item.title,
      date_published: item.date.toISOString(),
      ...(item.authors.length ? { authors: item.authors.map(name => ({ name })) } : {}),
      tags: item.categories
    }))
  }, null, 2)}\n`
}

/**
 * What is wrong with the feeds in a generated site, or `[]`. `read` returns a
 * published file's text by route (`/feed.xml`), or null when it is missing;
 * callers pass one over their output dir, which keeps this module free of Node
 * imports. Run by the `prerender:done` hook in `src/nuxt.config.ts`, which
 * fails the build on any problem, and by `scripts/check-routes.ts` in CI. A
 * deploy without a feed, or with an empty one, is a broken deploy: the feeds
 * sensor reads these files.
 */
export function feedOutputProblems(read: (route: string) => string | null): string[] {
  const problems: string[] = []

  const xml = read(FEED_PATH)
  if (xml === null) {
    problems.push(`${FEED_PATH} missing from the build output`)
  } else if (!xml.startsWith('<?xml') || !/<rss version="2\.0"/.test(xml) || !xml.trimEnd().endsWith('</rss>')) {
    problems.push(`${FEED_PATH} is not an RSS 2.0 document`)
  } else if (!xml.includes('<item>')) {
    problems.push(`${FEED_PATH} has no items`)
  } else if (!xml.includes(`<atom:link href="${SITE_URL}${FEED_PATH}"`)) {
    problems.push(`${FEED_PATH} has no self link to ${SITE_URL}${FEED_PATH}`)
  }

  const json = read(JSON_FEED_PATH)
  if (json === null) {
    problems.push(`${JSON_FEED_PATH} missing from the build output`)
  } else {
    try {
      const feed = JSON.parse(json) as { version?: string, items?: unknown[] }
      if (feed.version !== 'https://jsonfeed.org/version/1.1') problems.push(`${JSON_FEED_PATH} is not JSON Feed 1.1`)
      else if (!feed.items?.length) problems.push(`${JSON_FEED_PATH} has no items`)
    } catch {
      problems.push(`${JSON_FEED_PATH} is not valid JSON`)
    }
  }

  return problems
}
