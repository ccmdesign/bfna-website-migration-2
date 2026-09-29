/**
 * What kind of piece an insight is, and what a reader can do with it — the
 * decisions `pages/insights/[slug].vue` lays its body out from.
 *
 * ## Four layouts, decided by the fields a row actually carries
 *
 * Measured over the 354 rows that have a detail page (Sep 2026 — the 17
 * homepage highlight records are not routed, `useBfInsights().bySlug`):
 *
 * | variant       | rows | what decides it | what the body leads with |
 * |---------------|-----:|-----------------|--------------------------|
 * | `video`       |   54 | a YouTube `video_url` | the player |
 * | `infographic` |   55 | `format === 'infographic'` | the graphic, whole |
 * | `summary`     |   50 | no body, but an image | the image beside the excerpt |
 * | `article`     |  195 | everything else | the excerpt, then the text |
 *
 * `summary` is the one the data forced. 50 rows are a cover, a show's art or
 * a still plus a paragraph — the eight *Hidden Layers* reports, thirteen
 * podcast episodes (*Bridging the Atlantic*, *Wisdom of the Crowd*), the
 * report covers — and the article layout set that one picture 1,100px wide
 * under the excerpt with nothing after it. Set beside the excerpt it reads as what it is: the front
 * of a publication, with the way to it (if the row has one) next to the words.
 *
 * `format` is not trusted to find videos: 13 rows say `video` and carry no
 * video (podcast episodes mis-tagged in the source, BF-218), and the player
 * is decided by the URL alone.
 *
 * ## Actions
 *
 * `download` and `external_url` are the only two ways off the page, and the
 * page shows them as buttons. `external_url` used to be read by nothing on
 * this route at all, so the five detail pages that carry one — a Simplecast
 * episode, two BFNA Documentaries films, two microsites — rendered their
 * excerpt and no way to reach the thing it describes. (17 homepage highlight
 * records carry one too, Spotify among them; the labels below cover them for
 * the day they get a page.) Their label is chosen from the
 * heading's kicker when it names a format ("Documentary Film: …" → "Watch the
 * documentary"), else from a known host, else "Visit <host>".
 *
 * Plain TypeScript, no Vue and no Nuxt runtime, like `format.ts`.
 */
import type { Insight } from '~/types/bf-contracts'
import { isExternal } from './link'
import { youtubeId } from './youtube'

export type InsightVariant = 'video' | 'infographic' | 'summary' | 'article'

/** The fields the layout decision reads — a structural subset, so a fixture needs no more. */
type VariantFields = Pick<Insight, 'video_url' | 'format' | 'content' | 'image'>

/** Which layout the body takes. See the file header's table. */
export function insightVariant(insight: VariantFields): InsightVariant {
  if (youtubeId(insight.video_url)) return 'video'
  if (insight.format === 'infographic') return 'infographic'
  if (!insight.content?.trim() && insight.image) return 'summary'
  return 'article'
}

/** One button: where it goes, what it says, and whether it leaves the site. */
export interface InsightAction {
  href: string
  label: string
  external: boolean
}

/**
 * The download's label. The file type is **not** in it: 117 of the 125
 * downloads are PDFs and 8 are PNG, JPEG or WebP images — including the
 * infographic at `/insights/infographic-ai-research-and-development-in-the-u-s-eu-and-china`,
 * which the old "Download the report (PDF)" mislabelled twice. The data does
 * not carry the type, so the label says only what is true of every row.
 */
export function downloadAction(insight: Pick<Insight, 'download' | 'format'>): InsightAction | null {
  const href = insight.download?.trim()
  if (!href) return null
  return {
    href,
    label: insight.format === 'infographic' ? 'Download the infographic' : 'Download the report',
    external: isExternal(href)
  }
}

/** Kicker (a format split off the heading) → the verb for going to it. */
const KICKER_LABELS: Record<string, string> = {
  'Documentary': 'Watch the documentary',
  'Documentary Film': 'Watch the documentary',
  'Infographic': 'View the infographic',
  'Publication': 'Read the publication',
  'Latest Issue': 'Read the latest issue',
  'New Site': 'Visit the site'
}

/** Hosts whose kind of content is known without a kicker. Matched on the hostname's end. */
const HOST_LABELS: [RegExp, string][] = [
  [/(?:^|\.)open\.spotify\.com$/, 'Listen on Spotify'],
  [/(?:^|\.)podcasts\.apple\.com$/, 'Listen on Apple Podcasts'],
  [/(?:^|\.)simplecast\.com$/, 'Listen to the episode'],
  [/(?:^|\.)bfnadocs\.org$/, 'Watch the documentary']
]

/** Is this a podcast platform — the listen link that makes a post a podcast post? */
export const isListenUrl = (href: string | null | undefined): boolean => {
  const host = hostname(href)
  return host !== null && HOST_LABELS.slice(0, 3).some(([re]) => re.test(host))
}

function hostname(href: string | null | undefined): string | null {
  if (typeof href !== 'string') return null
  try {
    return new URL(href.trim()).hostname.toLowerCase()
  }
  catch {
    return null
  }
}

/**
 * The `external_url` as a button, or `null`. A podcast platform's own label
 * ("Listen on Spotify") wins over the kicker's, because it names where the
 * reader will be listening; otherwise the kicker's verb, then a known host's,
 * then "Visit <host>". A URL on this site itself (`www.bfna.org/…`, four rows
 * pointing at old-site paths the redirect map will answer) reads "Continue
 * reading" rather than naming the site the reader is already on.
 */
export function externalAction(
  insight: Pick<Insight, 'external_url'>,
  kicker: string | null | undefined
): InsightAction | null {
  const href = insight.external_url?.trim()
  const host = hostname(href)
  if (!href || host === null) return null

  const byHost = HOST_LABELS.find(([re]) => re.test(host))?.[1]
  const external = isExternal(href)
  const label = (isListenUrl(href) ? byHost : undefined)
    ?? (kicker ? KICKER_LABELS[kicker] : undefined)
    ?? byHost
    ?? (external ? `Visit ${host.replace(/^www\./, '')}` : 'Continue reading')

  return { href, label, external }
}

/** Words per minute for the reading-time estimate — a long-form, policy-prose pace. */
const WPM = 230

/** At or above this many words a piece is long enough to offer its download before the text. */
export const LONG_READ_WORDS = 750

/**
 * Words in a body, counting prose only: link targets, image lines and
 * markup are not read aloud, so they are not counted.
 */
export function bodyWords(content: string | null | undefined): number {
  if (!content) return 0
  const text = content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`[\]|-]+/g, ' ')
  return text.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length
}

/** Whole minutes to read `words`, never less than one. */
export const readingMinutes = (words: number): number => Math.max(1, Math.round(words / WPM))
