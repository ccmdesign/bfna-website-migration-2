import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { SITE_URL } from '../../utils/agentContent'
import {
  FEED_ITEM_LIMIT,
  feedItems,
  jsonFeed,
  parseFeedDate,
  rfc822,
  rssXml,
  summarize,
  toFeedItem,
  type FeedInsight
} from '../../utils/siteFeed'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const NOW = new Date('2026-11-02T00:00:00Z')
const PROGRAMS = new Set(['Democracy', 'Transatlantic Relations & Global Challenges', 'Future Leadership'])

const insight = (overrides: Partial<FeedInsight> = {}): FeedInsight => ({
  slug: 'the-nuclear-option',
  heading: 'The Nuclear Option',
  subheading: null,
  excerpt: 'Europe weighs its deterrent.',
  content: null,
  publish_date: '2026-07-21',
  format: 'article|report',
  program: 'Transatlantic Relations & Global Challenges',
  authors: ['Anthony T. Silberfeld'],
  featured: false,
  retired_news: false,
  ...overrides
})

function readCollection<T>(name: string): T[] {
  const dir = resolve(root, 'content/bf', name)
  return readdirSync(dir)
    .filter(file => file.endsWith('.json'))
    .map(file => JSON.parse(readFileSync(resolve(dir, file), 'utf8')) as T)
}

function parseXml(xml: string): Document {
  return new JSDOM(xml, { contentType: 'application/xml' }).window.document
}

describe('toFeedItem', () => {
  it('maps an insight to its canonical page, date, summary, authors and categories', () => {
    const item = toFeedItem(insight(), PROGRAMS, NOW)
    expect(item).toEqual({
      title: 'The Nuclear Option',
      url: `${SITE_URL}/insights/the-nuclear-option`,
      date: new Date('2026-07-21T00:00:00Z'),
      summary: 'Europe weighs its deterrent.',
      authors: ['Anthony T. Silberfeld'],
      categories: ['Transatlantic Relations & Global Challenges', 'Article']
    })
  })

  it('falls back from excerpt to subheading to body text for the summary', () => {
    expect(toFeedItem(insight({ excerpt: null, subheading: 'Sub' }), PROGRAMS, NOW)?.summary).toBe('Sub')
    expect(toFeedItem(insight({ excerpt: null, content: '<p>Body &amp; more</p>' }), PROGRAMS, NOW)?.summary).toBe('Body & more')
  })

  it('never shows a migration signal as a category', () => {
    const item = toFeedItem(insight({ program: 'PENDING-Q3 (Digital World retired)' }), PROGRAMS, NOW)
    expect(item?.categories).toEqual(['Article'])
  })

  it.each([
    ['a featured highlight record', { featured: true }],
    ['a retired news record', { retired_news: true }],
    ['no publish date', { publish_date: null }],
    ['a future publish date', { publish_date: '2027-01-01' }],
    ['no heading', { heading: ' ' }]
  ])('leaves out %s', (_label, overrides) => {
    expect(toFeedItem(insight(overrides), PROGRAMS, NOW)).toBeNull()
  })
})

describe('feedItems', () => {
  it('sorts newest first, drops duplicate URLs and caps the list', () => {
    const items = feedItems([
      insight({ slug: 'old', publish_date: '2020-01-01' }),
      insight({ slug: 'new', publish_date: '2026-06-01' }),
      insight({ slug: 'new', publish_date: '2026-06-01' }),
      insight({ slug: 'mid', publish_date: '2023-01-01' })
    ], PROGRAMS, NOW, 2)
    expect(items.map(item => item.url.split('/').pop())).toEqual(['new', 'mid'])
  })
})

describe('helpers', () => {
  it('cuts a long summary on a word boundary', () => {
    const text = summarize('word '.repeat(100), 50)
    expect(text.length).toBeLessThanOrEqual(51)
    expect(text.endsWith('word…')).toBe(true)
  })

  it('parses date-only and ISO dates and rejects junk', () => {
    expect(parseFeedDate('2025-02-11')?.toISOString()).toBe('2025-02-11T00:00:00.000Z')
    expect(parseFeedDate('2025-02-11T10:00:00Z')?.toISOString()).toBe('2025-02-11T10:00:00.000Z')
    expect(parseFeedDate('soon')).toBeNull()
    expect(parseFeedDate(null)).toBeNull()
  })

  it('formats RFC 822 dates', () => {
    expect(rfc822(new Date('2026-07-21T00:00:00Z'))).toBe('Tue, 21 Jul 2026 00:00:00 GMT')
  })
})

describe('rssXml', () => {
  const xml = rssXml(feedItems([insight({ heading: 'Trade & <Tariffs> "now"' })], PROGRAMS, NOW))
  const doc = parseXml(xml)

  it('is well-formed RSS 2.0 with a self link', () => {
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0)
    expect(doc.documentElement.tagName).toBe('rss')
    expect(doc.documentElement.getAttribute('version')).toBe('2.0')
    expect(xml).toContain(`<atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>`)
  })

  it('escapes text and carries GUID, date, author and categories', () => {
    expect(doc.querySelector('item > title')?.textContent).toBe('Trade & <Tariffs> "now"')
    expect(xml).toContain(`<guid isPermaLink="true">${SITE_URL}/insights/the-nuclear-option</guid>`)
    expect(xml).toContain('<pubDate>Tue, 21 Jul 2026 00:00:00 GMT</pubDate>')
    expect(xml).toContain('<dc:creator>Anthony T. Silberfeld</dc:creator>')
    expect(xml).toContain('<category>Transatlantic Relations &amp; Global Challenges</category>')
  })
})

describe('jsonFeed', () => {
  it('is a JSON Feed 1.1 document', () => {
    const feed = JSON.parse(jsonFeed(feedItems([insight()], PROGRAMS, NOW)))
    expect(feed.version).toBe('https://jsonfeed.org/version/1.1')
    expect(feed.feed_url).toBe(`${SITE_URL}/feed.json`)
    expect(feed.items[0]).toMatchObject({
      id: `${SITE_URL}/insights/the-nuclear-option`,
      date_published: '2026-07-21T00:00:00.000Z',
      authors: [{ name: 'Anthony T. Silberfeld' }]
    })
  })
})

describe('the committed content snapshot', () => {
  const insights = readCollection<FeedInsight>('insights')
  const programs = new Set(readCollection<{ name: string }>('programs').map(program => program.name))
  const items = feedItems(insights, programs, NOW)
  const routed = new Set(readdirSync(resolve(root, 'content/bf/insights')).map(file => file.replace(/\.json$/, '')))

  it('fills the feed, newest first', () => {
    expect(items).toHaveLength(FEED_ITEM_LIMIT)
    const dates = items.map(item => item.date.getTime())
    expect([...dates].sort((a, b) => b - a)).toEqual(dates)
  })

  it('links only to prerendered insight pages on the canonical host', () => {
    for (const item of items) {
      expect(item.url.startsWith(`${SITE_URL}/insights/`)).toBe(true)
      expect(routed.has(decodeURIComponent(item.url.split('/').pop() ?? ''))).toBe(true)
    }
  })

  it('renders to well-formed XML with one item per entry', () => {
    const doc = parseXml(rssXml(items))
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0)
    expect(doc.getElementsByTagName('item')).toHaveLength(FEED_ITEM_LIMIT)
  })
})
