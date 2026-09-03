/**
 * Build-time normaliser — wireframe snapshots → canonical `content/bf/**` JSON.
 *
 * Reads `src/assets/wireframe-data/{insights,projects,programs}.json` READ-ONLY and
 * writes one JSON document per item under `content/bf/<collection>/<slug>.json`.
 *
 * Every synthesis `src/composables/useWfContent.ts` performs for these three
 * collections is materialised here as a plain stored field, so `bf-*` components stay
 * presentational and the data composables only `queryCollection`. `useWfContent.ts`
 * itself is NOT modified — the `/wireframes/*` prototype keeps using it verbatim.
 *
 * Ported from `useWfContent.ts`:
 *   - `plain()`                 (l.272-277) — HTML strip + entity decode
 *   - `PENDING`                 (l.114)     → `pending: 'Q6' | 'Q7'`
 *   - `inProjectGrid`           (l.127-128) → `grid_eligible: boolean`
 *   - `GRID_ORDER` + `gridSort` (l.132-141) → `grid_order: number`
 *   - `FEATURED_SLUGS`          (l.144)     → `featured: boolean`
 *   - `NAV_SLUGS`               (l.148)     → `nav: boolean`
 *   - programs `heading → name` (l.109-110), `legacy_workstreams` dropped
 *   - `insights.json.featured` / `.retired_news` → booleans on the insight document
 * New (issue 07 Decisions): `Program.tagline` = first sentence of `intro`.
 *
 * Emitted field lists mirror the zod schemas of issue 09 (`bfInsights`, `bfProjects`,
 * `bfPrograms`) — that is what validates this output; source fields issue 09 does not
 * declare are dropped.
 *
 * Output is deterministic: fixed key order, no timestamps, no generated ids. Running
 * the script twice produces byte-identical files.
 *
 * Usage: `npm run data:normalise`
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = join(appRoot, 'src', 'assets', 'wireframe-data')
const OUT_DIR = join(appRoot, 'content', 'bf')

// ---- shared helpers --------------------------------------------------------

/**
 * Verbatim port of `useWfContent.ts`'s `plain()` (l.272-277): strips HTML tags and
 * decodes the fixed entity set legacy Directus copy carries. Unmapped entities are
 * dropped, exactly as in the original.
 *
 * Applied to short display strings ONLY. `content` / `intro` body copy passes through
 * untouched — `wfProse` parses markdown-or-legacy-HTML itself, and flattening it here
 * would collapse block boundaries into run-on text.
 */
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&nbsp;': ' ',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&#8217;': '’',
  '&#8220;': '“',
  '&#8221;': '”',
  '&quot;': '"'
}

const plain = (s: string | null | undefined): string =>
  (s ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, m => ENTITIES[m.toLowerCase()] ?? '')
    .trim()

/** `plain()` that preserves the `null` of an absent source field. */
const plainOrNull = (s: unknown): string | null => {
  if (typeof s !== 'string') return null
  const out = plain(s)
  return out === '' ? null : out
}

const strOrNull = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null)

/** Keeps `null` for an absent flag; coerces any other defined value rather than dropping it. */
const boolOrNull = (v: unknown): boolean | null =>
  (v === null || v === undefined ? null : Boolean(v))

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

const readSnapshot = <T>(file: string): T =>
  JSON.parse(readFileSync(join(SRC_DIR, file), 'utf8')) as T

/** Deterministic write: 2-space JSON + trailing newline, fixed key order. */
const writeDoc = (collection: string, fileStem: string, doc: unknown): void => {
  writeFileSync(join(OUT_DIR, collection, `${fileStem}.json`), `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
}

const resetCollection = (collection: string): void => {
  const dir = join(OUT_DIR, collection)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
}

/**
 * Unique file stem per document. `insights.json` carries two cross-collection
 * duplicate slugs (`graphic-images-autocrats-and-the-use-of-power`, `uncivil-war`, both
 * flagged `duplicate_of` in the snapshot); all rows are kept, so the nth occurrence in
 * snapshot order becomes `<slug>-<n>.json`. The `slug` FIELD keeps its real value.
 */
const makeStemFactory = () => {
  const used = new Set<string>()
  return (slug: string): string => {
    if (!used.has(slug)) {
      used.add(slug)
      return slug
    }
    // Guard against a real slug that already looks like a disambiguated one
    // (e.g. `nord-stream-2` existing alongside a duplicated `nord-stream`).
    let n = 2
    while (used.has(`${slug}-${n}`)) n++
    used.add(`${slug}-${n}`)
    return `${slug}-${n}`
  }
}

// ---- insights --------------------------------------------------------------

interface RawInsight {
  slug: string
  heading?: string | null
  subheading?: string | null
  excerpt?: string | null
  content?: string | null
  authors?: string[]
  image?: string | null
  video_url?: string | null
  download?: string | null
  external_url?: string | null
  publish_date?: string | null
  format?: string | null
  program?: string | null
  projects?: string[]
  archived?: boolean | null
  evergreen?: boolean | null
}

interface InsightsSnapshot {
  items: RawInsight[]
  featured: RawInsight[]
  retired_news: RawInsight[]
}

interface InsightDoc {
  slug: string
  heading: string | null
  subheading: string | null
  excerpt: string | null
  content: string | null
  image: string | null
  video_url: string | null
  download: string | null
  external_url: string | null
  publish_date: string | null
  format: string | null
  program: string | null
  authors: string[]
  projects: string[]
  archived: boolean | null
  evergreen: boolean | null
  featured: boolean
  retired_news: boolean
}

/**
 * `excerpt` is `plain()`-cleaned and stays `null` when the source has none (195 of the
 * 354 items). No `content`-derived fallback: `wfCardInsight` renders `plain(excerpt)`
 * and shows nothing when empty, and BRIEF ground rule 10 requires `bf-*` to render the
 * same data as its `wf-*` counterpart.
 */
const toInsightDoc = (raw: RawInsight, flags: { featured: boolean, retired_news: boolean }): InsightDoc => ({
  slug: raw.slug,
  heading: plainOrNull(raw.heading),
  subheading: plainOrNull(raw.subheading),
  excerpt: plainOrNull(raw.excerpt),
  content: strOrNull(raw.content),
  image: strOrNull(raw.image),
  video_url: strOrNull(raw.video_url),
  download: strOrNull(raw.download),
  external_url: strOrNull(raw.external_url),
  publish_date: strOrNull(raw.publish_date),
  format: strOrNull(raw.format),
  program: strOrNull(raw.program),
  authors: strArray(raw.authors),
  projects: strArray(raw.projects),
  archived: boolOrNull(raw.archived),
  evergreen: boolOrNull(raw.evergreen),
  featured: flags.featured,
  retired_news: flags.retired_news
})

const normaliseInsights = (): number => {
  const snap = readSnapshot<InsightsSnapshot>('insights.json')
  resetCollection('insights')
  const stem = makeStemFactory()

  const itemSlugs = new Set(snap.items.map(i => i.slug))
  const featuredSlugs = new Set(snap.featured.map(i => i.slug))
  const retiredSlugs = new Set(snap.retired_news.map(i => i.slug))

  let written = 0
  for (const raw of snap.items) {
    writeDoc('insights', stem(raw.slug), toInsightDoc(raw, {
      featured: featuredSlugs.has(raw.slug),
      retired_news: retiredSlugs.has(raw.slug)
    }))
    written++
  }

  // `featured` (8) and `retired_news` (9) are separate Directus-highlight records with
  // zero slug overlap with `items` — the homepage strip `useWfContent.highlights()`
  // renders. BRIEF §6 keeps them in `bfInsights` ("not separate collections"), so they
  // are emitted as additional documents carrying the boolean. See issue 07 Decisions.
  for (const raw of snap.featured) {
    if (itemSlugs.has(raw.slug)) continue
    writeDoc('insights', stem(raw.slug), toInsightDoc(raw, { featured: true, retired_news: false }))
    written++
  }
  for (const raw of snap.retired_news) {
    if (itemSlugs.has(raw.slug) || featuredSlugs.has(raw.slug)) continue
    writeDoc('insights', stem(raw.slug), toInsightDoc(raw, { featured: false, retired_news: true }))
    written++
  }
  return written
}

// ---- projects --------------------------------------------------------------

interface ProjectPodcast {
  title: string
  host: string | null
  source_note: string | null
  episodes: { title: string, description: string | null }[]
}

interface RawProject {
  slug: string
  heading?: string | null
  excerpt?: string | null
  description?: string | null
  kind?: string | null
  program?: string | null
  external_url?: string | null
  image?: string | null
  parent_project?: string | null
  archived?: boolean | null
  exclude_from_grid?: boolean | null
  external_only?: boolean | null
  microsite_cta?: string | null
  participation?: { title: string, ctas: string[] } | null
  podcast?: ProjectPodcast | null
}

interface ProjectDoc {
  slug: string
  heading: string
  excerpt: string | null
  description: string | null
  kind: string | null
  program: string | null
  external_url: string | null
  image: string | null
  parent_project: string | null
  archived: boolean | null
  exclude_from_grid: boolean | null
  external_only: boolean | null
  featured: boolean
  nav: boolean
  grid_eligible: boolean
  grid_order: number
  microsite_cta: string | null
  participation: { title: string, ctas: string[] } | null
  podcast: ProjectPodcast | null
  pending?: string
}

/** Copy-pending chips — `useWfContent.ts:114`, verbatim. */
const PENDING: Record<string, string> = { 'transponder-magazine': 'Q6', 'bfna-documentaries': 'Q7' }

/** Client-specified program-grid ordering — `useWfContent.ts:132-135`, verbatim. */
const GRID_ORDER: Record<string, string[]> = {
  Democracy: ['graphic-images', 'city-solutions-series', 'how-to-fix-democracy', 'election-analysis'],
  'Future Leadership': ['the-bertelsmann-foundation-fellowship', 'summer-enrichment-series', 'leadership-in-action']
}

/** Homepage + nav curation — `useWfContent.ts:144` / `:148`, verbatim. */
const FEATURED_SLUGS = ['transatlantic-barometer', 'transatlantic-periscope', 'how-to-fix-democracy', 'the-bertelsmann-foundation-fellowship']
const NAV_SLUGS = ['transatlantic-barometer', 'transatlantic-periscope', 'range', 'how-to-fix-democracy', 'the-bertelsmann-foundation-fellowship']

/** `inProjectGrid` — `useWfContent.ts:127-128`, materialised as a stored flag. */
const isGridEligible = (p: RawProject): boolean =>
  !p.archived && !p.exclude_from_grid && !p.external_only && p.kind !== 'podcast'

/**
 * `gridSort` rank — `useWfContent.ts:136-141`. Unlisted slugs (and every slug in a
 * program with no declared order) get `Number.MAX_SAFE_INTEGER` so a stable sort by
 * `grid_order` reproduces the composable exactly: ranked slugs first in declared order,
 * everything else after in snapshot order.
 */
const gridOrderOf = (p: RawProject): number => {
  const order = p.program ? GRID_ORDER[p.program] : undefined
  if (!order) return Number.MAX_SAFE_INTEGER
  const i = order.indexOf(p.slug)
  return i === -1 ? Number.MAX_SAFE_INTEGER : i
}

const normaliseProjects = (): number => {
  const snap = readSnapshot<{ items: RawProject[] }>('projects.json')
  resetCollection('projects')
  const stem = makeStemFactory()

  for (const raw of snap.items) {
    const doc: ProjectDoc = {
      slug: raw.slug,
      heading: plainOrNull(raw.heading) ?? '',
      excerpt: plainOrNull(raw.excerpt),
      description: plainOrNull(raw.description),
      kind: strOrNull(raw.kind),
      program: strOrNull(raw.program),
      external_url: strOrNull(raw.external_url),
      image: strOrNull(raw.image),
      parent_project: strOrNull(raw.parent_project),
      archived: boolOrNull(raw.archived),
      exclude_from_grid: boolOrNull(raw.exclude_from_grid),
      external_only: boolOrNull(raw.external_only),
      featured: FEATURED_SLUGS.includes(raw.slug),
      nav: NAV_SLUGS.includes(raw.slug),
      grid_eligible: isGridEligible(raw),
      grid_order: gridOrderOf(raw),
      microsite_cta: strOrNull(raw.microsite_cta),
      participation: raw.participation ?? null,
      podcast: raw.podcast ?? null
    }
    if (PENDING[raw.slug]) doc.pending = PENDING[raw.slug]
    writeDoc('projects', stem(raw.slug), doc)
  }
  return snap.items.length
}

// ---- programs --------------------------------------------------------------

interface RawProgram {
  slug: string
  heading?: string | null
  intro?: string | null
  image?: string | null
}

interface ProgramDoc {
  slug: string
  name: string
  tagline: string
  intro: string | null
  image: string | null
}

/**
 * `Program.tagline` (issue 07 / 09 / 25 Decision): the first sentence of `intro`.
 * Sentence end = `.`/`!`/`?` followed by whitespace or end-of-paragraph; common
 * abbreviations (`U.S.`, `e.g.`, `Dr.`, …) are stepped over so they do not cut early.
 * Falls back to the whole first paragraph when no terminator is present.
 */
const ABBREVIATIONS = /(?:\b(?:[A-Z]|Mr|Mrs|Ms|Dr|Prof|St|vs|etc|e\.g|i\.e|approx|no|No|Jr|Sr|Inc|Ltd|Co|U\.S|U\.K|E\.U)\.)$/

const firstSentence = (intro: string | null | undefined): string => {
  const para = plain(intro).split(/\n{2,}/)[0]?.trim() ?? ''
  if (!para) return ''
  const terminator = /[.!?](?=\s|$)/g
  let match: RegExpExecArray | null
  while ((match = terminator.exec(para)) !== null) {
    const candidate = para.slice(0, match.index + 1)
    if (ABBREVIATIONS.test(candidate)) continue
    return candidate.trim()
  }
  return para
}

const normalisePrograms = (): number => {
  const snap = readSnapshot<{ items: RawProgram[] }>('programs.json')
  resetCollection('programs')
  const stem = makeStemFactory()

  for (const raw of snap.items) {
    // `heading → name` and `legacy_workstreams` dropped — useWfContent.ts:109-110.
    const doc: ProgramDoc = {
      slug: raw.slug,
      name: plainOrNull(raw.heading) ?? '',
      tagline: firstSentence(raw.intro),
      intro: strOrNull(raw.intro),
      image: strOrNull(raw.image)
    }
    writeDoc('programs', stem(raw.slug), doc)
  }
  return snap.items.length
}

// ---- run -------------------------------------------------------------------

const main = (): void => {
  mkdirSync(OUT_DIR, { recursive: true })
  const insights = normaliseInsights()
  const projects = normaliseProjects()
  const programs = normalisePrograms()

  console.log('normalise-wireframe-data → content/bf/')
  console.log(`  insights  ${insights}`)
  console.log(`  projects  ${projects}`)
  console.log(`  programs  ${programs}`)

  if (!insights || !projects || !programs) {
    console.error('normalise-wireframe-data: a collection produced zero documents')
    process.exitCode = 1
  }
}

main()
