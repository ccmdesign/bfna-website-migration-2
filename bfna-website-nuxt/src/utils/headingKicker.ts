/**
 * Split an insight heading into a **kicker** and a **title**.
 *
 * Some insight headings open with a label that is not part of the title:
 * a *format* ("Infographic: Cybersecurity", "New Publication | Lithium
 * Rising…") or a *recurring series / episode* marker ("Hidden Layers: …",
 * "Season 2, Episode 3: …"). Those render as a kicker on the meta line under
 * the title — the cards' `.bf-card__meta` and the article's meta row, never
 * a label over the heading. Every
 * other `Prefix: Title` shape — an ordinary title and subtitle, "A Developing
 * Dilemma: …", "Lithium Rising: …", "Cordoned Off: …" — keeps the whole
 * heading as its title.
 *
 * So the split is **curated, not syntactic**: the prefix before the first
 * `: ` or `|` must be on one of the lists below. The lists were built from a
 * tally of every prefix in the 371 `bfInsights` headings (Sep 2026); a prefix
 * that names a topic rather than a format or a series ("TTIP", "France",
 * "Migration", "Greek Debt Crisis") is deliberately absent.
 *
 * The **full** heading stays the machine-facing string — `<title>`, meta,
 * image `alt`, search haystacks. Only the visible title uses `title`.
 *
 * Plain TypeScript, no Vue and no Nuxt runtime, like `format.ts`.
 */
import { FORMAT_LABELS } from './format'

export interface HeadingKicker {
  /** The label above the title, display-cased. `''` when the heading does not split. */
  kicker: string
  /** The visible title. The whole trimmed heading when it does not split. */
  title: string
  /** The kicker is a format label (Infographic, Podcast, …) rather than a series. */
  kickerIsFormat: boolean
  /**
   * The insight `format` slug the kicker restates, when it is one of
   * `FORMAT_LABELS` — `'infographic'` for "Infographic". Absent otherwise.
   */
  formatType?: string
}

/**
 * Format labels, keyed by their lower-cased spelling. A leading "New " is
 * dropped before lookup, so "New Infographic" and "NEW PODCAST" land here as
 * "Infographic" and "Podcast". The four `FORMAT_LABELS` values are included so
 * a future "Video: …" or "Report: …" heading is recognised too.
 */
const FORMAT_KICKERS: Record<string, string> = {
  ...Object.fromEntries(Object.values(FORMAT_LABELS).map(l => [l.toLowerCase(), l])),
  'podcast': 'Podcast',
  'publication': 'Publication',
  'documentary': 'Documentary',
  'documentary film': 'Documentary Film',
  'graphic images': 'Graphic Images',
  'latest issue': 'Latest Issue'
}

/**
 * Recurring series, by exact (case-insensitive) prefix. "New Site" lives here
 * rather than in the format list: it is a curated homepage label, not a
 * format, and "Site" alone would not read as one.
 */
const SERIES_KICKERS: Record<string, string> = {
  'hidden layers': 'Hidden Layers',
  'transatlantic barometer': 'Transatlantic Barometer',
  'ttip negotiations': 'TTIP Negotiations',
  'bff spotlight': 'BFF Spotlight',
  'new site': 'New Site'
}

/** Numbered series markers — one pattern, not one entry per number. */
const SERIES_PATTERNS: RegExp[] = [
  /^season \d+, episode \d+$/i,
  /^episode \d+$/i,
  /^transponder issue #\d+$/i
]

/**
 * Prefix, separator, rest. The separator is the **first** `:` followed by
 * whitespace or the first `|` (with or without spaces round it — the data
 * has "New Documentary| Motown South" and "Transatlantic Barometer  | New…").
 * A colon with no space after it ("10:30") is not a separator.
 */
const SPLIT = /^(.+?)\s*(?::\s|\|)\s*(.+)$/s

/** "SEASON 1, EPISODE 2" → "Season 1, Episode 2"; mixed case is left alone. */
function displayCase(s: string): string {
  if (s !== s.toUpperCase()) return s
  return s.toLowerCase().replace(/\b\p{L}/gu, c => c.toUpperCase())
}

export function splitHeadingKicker(heading: string | null | undefined): HeadingKicker {
  const full = (heading ?? '').trim()
  const whole: HeadingKicker = { kicker: '', title: full, kickerIsFormat: false }

  const match = SPLIT.exec(full)
  if (!match) return whole

  const prefix = (match[1] ?? '').replace(/\s+/g, ' ').trim()
  const title = (match[2] ?? '').trim()
  if (!prefix || !title) return whole

  const key = prefix.toLowerCase()

  const format = FORMAT_KICKERS[key.replace(/^new /, '')]
  if (format) {
    const formatType = Object.keys(FORMAT_LABELS).find(slug => FORMAT_LABELS[slug] === format)
    return { kicker: format, title, kickerIsFormat: true, ...(formatType ? { formatType } : {}) }
  }

  const series = SERIES_KICKERS[key]
  if (series) return { kicker: series, title, kickerIsFormat: false }

  if (SERIES_PATTERNS.some(re => re.test(prefix))) {
    return { kicker: displayCase(prefix), title, kickerIsFormat: false }
  }

  return whole
}

/**
 * Does the kicker already say what the post's type chip says? Then the chip
 * is a duplicate and the caller hides it. `format` is the row's raw
 * `format` value, compared on its first segment the way `formatLabel()`
 * reads it. Series kickers never hide a chip.
 */
export function kickerHidesFormatChip(split: HeadingKicker, format: string | null | undefined): boolean {
  if (!split.kickerIsFormat || !split.formatType) return false
  return (format ?? 'article').split('|')[0] === split.formatType
}

/**
 * The heading a card or row shows, when the stored heading is only the first
 * half of the title.
 *
 * Three insights store a heading that ends on a colon and carry the rest of
 * their title as the subheading — "Pianissimo:" + "Brussels' Silence on
 * Italy's Democratic Decline". A card shows the heading and never the
 * subheading, so it printed "Pianissimo:" with a dangling colon. For a
 * heading that ends on `:` and a subheading that is set, the two are joined
 * into the one title they are ("Pianissimo: Brussels' Silence on…"); every
 * other heading is returned trimmed and unchanged, subheading or not — an
 * ordinary subheading is a standfirst, and the detail page shows it as one.
 *
 * Presentation, not data: the stored fields are untouched, and the detail
 * page still sets heading and standfirst apart.
 */
export function displayHeading(heading: string | null | undefined, subheading?: string | null): string {
  const full = (heading ?? '').trim()
  const rest = (subheading ?? '').trim()
  return full.endsWith(':') && rest ? `${full} ${rest}` : full
}
