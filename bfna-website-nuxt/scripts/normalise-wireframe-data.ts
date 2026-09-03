/**
 * Build-time normaliser — wireframe snapshots → canonical `content/bf/**` JSON.
 *
 * Reads all six `src/assets/wireframe-data/*.json` snapshots READ-ONLY and writes one
 * JSON document per item under `content/bf/<collection>/<slug>.json`, plus the site
 * chrome (`MENUS`) as `src/assets/bf-data/menus.json`.
 *
 * Every synthesis `src/composables/useWfContent.ts` performs for these collections is
 * materialised here as a plain stored field, so `bf-*` components stay presentational
 * and the data composables only `queryCollection`. `useWfContent.ts` itself is NOT
 * modified — the `/wireframes/*` prototype keeps using it verbatim.
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
 *   - board predicate             (l.264)     → `board: boolean` on the person document
 *   - `MENUS`                     (l.153-186) → `src/assets/bf-data/menus.json`
 * New (issue 07 Decisions): `Program.tagline` = first sentence of `intro`.
 *
 * Emitted field lists mirror the zod schemas of issue 09 (`bfInsights`, `bfProjects`,
 * `bfPrograms`, `bfPeople`, `bfPages`, `bfAnnouncements`) — that is what validates this
 * output; source fields issue 09 does not declare are dropped. `bfPages` is the one
 * full passthrough: all 19 source fields, `copy_source` and `legacy` included.
 *
 * Output is deterministic: fixed key order, no timestamps, no generated ids. Running
 * the script twice produces byte-identical files.
 *
 * Usage: `npm run data:normalise`
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// The canonical menu contracts (issue 02). Reused directly — the normaliser never
// redeclares a shared shape (BRIEF §5 rule 11). Type-only, so tsx erases it at runtime.
import type { Menu, MenuItem } from '../src/types/bf-contracts'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = join(appRoot, 'src', 'assets', 'wireframe-data')
const OUT_DIR = join(appRoot, 'content', 'bf')
const BF_DATA_DIR = join(appRoot, 'src', 'assets', 'bf-data')

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

// ---- people ----------------------------------------------------------------

interface RawPerson {
  slug: string
  name?: string | null
  job_title?: string | null
  bio?: string | null
  email?: string | null
  linkedin?: string | null
  twitter?: string | null
  image?: string | null
  board?: boolean | null
}

interface PersonDoc {
  slug: string
  name: string
  job_title: string | null
  bio: string | null
  email: string | null
  linkedin: string | null
  twitter: string | null
  image: string | null
  board: boolean
}

/**
 * `boardMembers` predicate — `useWfContent.ts:264`, ported verbatim and materialised
 * as a single resolved boolean. BOTH halves are load-bearing against the real data:
 *   - raw flag only:  `irene-braam` (job title "Executive Director" — no regex match,
 *                     but her snapshot record carries `board: true`)
 *   - regex only:     `liz-mohn` ("President of the Board of Directors"),
 *                     `stephen-f-szabo` ("Member of the Board of Directors"),
 *                     `wilhelm-friedrich-uhr` ("Executive Board and Chief Operating
 *                     Officer")
 * Dropping either half silently loses people from `/about#board`. The spec's prose
 * says 3; the predicate resolves 4 — the predicate is what the wireframe renders
 * today, so it wins. See issue 08 Decisions.
 *
 * !! `board` is NOT the complement of the Team list. `useWfContent.ts` runs two
 * INDEPENDENT predicates: `teamMembers` (l.266) is `!/board/i.test(job_title)` — the
 * regex half only — so `irene-braam` (raw flag, job title "Executive Director")
 * appears in BOTH Board and Team by design (l.261-262). A consumer that derives the
 * team list as `!p.board` silently drops her. Issue 09's `bfPeople` schema declares no
 * `team` field, so it is not emitted here; issue 13's `bfTeamMembers()` must keep the
 * job-title predicate until 09 declares one. See the residual issue linked from PR #80.
 */
const isBoardMember = (p: RawPerson): boolean => Boolean(p.board || /board/i.test(p.job_title ?? ''))

const normalisePeople = (): number => {
  // Top-level key is `people`, NOT `items` (BRIEF §6 / D3).
  const snap = readSnapshot<{ people: RawPerson[] }>('people.json')
  resetCollection('people')
  const stem = makeStemFactory()

  for (const raw of snap.people) {
    // `status`, `source` and `legacy` are dropped — issue 09's `bfPeople` schema does
    // not declare them, and #16 set the precedent that emitted fields follow 09.
    const doc: PersonDoc = {
      slug: raw.slug,
      name: plainOrNull(raw.name) ?? '',
      job_title: plainOrNull(raw.job_title),
      bio: strOrNull(raw.bio),
      email: strOrNull(raw.email),
      linkedin: strOrNull(raw.linkedin),
      twitter: strOrNull(raw.twitter),
      image: strOrNull(raw.image),
      board: isBoardMember(raw)
    }
    writeDoc('people', stem(raw.slug), doc)
  }
  return snap.people.length
}

// ---- pages -----------------------------------------------------------------

/** `pages.json` carries a nested legacy provenance object, not a string. */
interface RawPageLegacy {
  source: string | null
  type: string | null
  workstream: string | null
  id: number | null
}

interface RawPage {
  slug: string
  heading?: string | null
  subheading?: string | null
  excerpt?: string | null
  description?: string | null
  authors?: string[]
  image?: string | null
  video_url?: string | null
  download?: string | null
  external_url?: string | null
  publish_date?: string | null
  bucket?: string | null
  format?: string | null
  kind?: string | null
  program?: string | null
  archived?: boolean | null
  evergreen?: boolean | null
  copy_source?: string | null
  legacy?: RawPageLegacy | null
}

interface PageDoc {
  slug: string
  heading: string | null
  subheading: string | null
  excerpt: string | null
  description: string | null
  authors: string[]
  image: string | null
  video_url: string | null
  download: string | null
  external_url: string | null
  publish_date: string | null
  bucket: string | null
  format: string | null
  kind: string | null
  program: string | null
  archived: boolean | null
  evergreen: boolean | null
  copy_source: string | null
  legacy: RawPageLegacy | null
}

/**
 * Full 19-field passthrough — no field dropped. Today's inline wireframe type reads
 * only `slug`/`heading`/`description`; the audit flagged that as the "needs a real
 * schema, 17 fields available" gap (01 §D/§F), so `copy_source` and `legacy` are
 * emitted too. `plain()` is applied to the short display strings only (#16's rule);
 * `description` is body copy and passes through byte-identical.
 */
const normalisePages = (): number => {
  const snap = readSnapshot<{ items: RawPage[] }>('pages.json')
  resetCollection('pages')
  const stem = makeStemFactory()

  for (const raw of snap.items) {
    const doc: PageDoc = {
      slug: raw.slug,
      heading: plainOrNull(raw.heading),
      subheading: plainOrNull(raw.subheading),
      excerpt: plainOrNull(raw.excerpt),
      description: strOrNull(raw.description),
      authors: strArray(raw.authors),
      image: strOrNull(raw.image),
      video_url: strOrNull(raw.video_url),
      download: strOrNull(raw.download),
      external_url: strOrNull(raw.external_url),
      publish_date: strOrNull(raw.publish_date),
      bucket: strOrNull(raw.bucket),
      format: strOrNull(raw.format),
      kind: strOrNull(raw.kind),
      program: strOrNull(raw.program),
      archived: boolOrNull(raw.archived),
      evergreen: boolOrNull(raw.evergreen),
      copy_source: strOrNull(raw.copy_source),
      legacy: raw.legacy ?? null
    }
    writeDoc('pages', stem(raw.slug), doc)
  }
  return snap.items.length
}

// ---- announcements ---------------------------------------------------------

interface RawAnnouncement {
  status?: string | null
  url?: string | null
  message?: string | null
  heading?: string | null
  excerpt?: string | null
  workstream?: number | null
}

interface AnnouncementDoc {
  status: string | null
  url: string | null
  message: string | null
  heading: string | null
  excerpt: string | null
  workstream: number | null
}

/** Fixed stem: `announcements.json.items` is the Directus singleton, so exactly one. */
const ANNOUNCEMENT_STEM = 'announcement'

/**
 * `announcements.json.items` is a SINGLE OBJECT, not an array (BRIEF §6 / D3) — it is
 * a Directus singleton. One document is emitted under a fixed filename rather than a
 * file-per-item sweep. The Directus audit columns (`id`, `user_created`,
 * `date_created`, `user_updated`, `date_updated`) are dropped: issue 09's
 * `bfAnnouncements` schema declares none of them, and `@nuxt/content` mints its own id.
 * The `status === 'published'` gate stays in the composable (issue 13), per BRIEF §6.
 */
const normaliseAnnouncements = (): number => {
  const snap = readSnapshot<{ items: RawAnnouncement | null }>('announcements.json')
  resetCollection('announcements')
  const raw = snap.items
  // Guard the singleton shape explicitly: an array or a non-object would otherwise
  // resolve every field to `null` and still report 1 document, so `main()`'s
  // zero-document check would pass while an all-null file was written.
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    console.error('normalise-wireframe-data: announcements.json.items is not a singleton object')
    return 0
  }

  const doc: AnnouncementDoc = {
    status: strOrNull(raw.status),
    url: strOrNull(raw.url),
    message: plainOrNull(raw.message),
    heading: plainOrNull(raw.heading),
    excerpt: plainOrNull(raw.excerpt),
    workstream: typeof raw.workstream === 'number' ? raw.workstream : null
  }
  writeDoc('announcements', ANNOUNCEMENT_STEM, doc)
  return 1
}

// ---- menus (site chrome) ---------------------------------------------------

/**
 * `MENUS` is not a snapshot — it is a hardcoded constant in `useWfContent.ts:153-186`.
 * BRIEF §6 keeps the collection count at six by emitting it as a typed JSON module
 * instead of a seventh collection: `src/assets/bf-data/menus.json`, read by the layout
 * and passed as props to `bfNav` / `bfFooter` (D8 — nav and footer are presentational).
 *
 * The tree below is a VERBATIM port of the constant, `/wireframes/…` paths and all;
 * `deWireframe()` then re-roots every internal `to` in one auditable pass, because
 * menus.json serves the final `bf-*` site at `/` and not the wireframe prototype.
 * `href` targets are external and pass through untouched.
 */
// The lookahead covers `/wireframes`, `/wireframes/…`, and — should `MENUS` ever grow
// one — a query- or hash-only `/wireframes?x` / `/wireframes#x`, which would otherwise
// ship un-re-rooted and 404 on the `bf-*` site.
const WIREFRAME_PREFIX = /^\/wireframes(?=[/?#]|$)/

const deWireframe = (to: string): string => {
  const stripped = to.replace(WIREFRAME_PREFIX, '')
  return stripped === '' ? '/' : stripped
}

/** Fixed key order, and no key emitted for an absent optional — deterministic output. */
const menuItem = (item: MenuItem): MenuItem => {
  const out: MenuItem = { label: item.label }
  if (item.to !== undefined) out.to = deWireframe(item.to)
  if (item.href !== undefined) out.href = item.href
  if (item.external !== undefined) out.external = item.external
  if (item.strong !== undefined) out.strong = item.strong
  return out
}

const menuGroup = (menu: Menu): Menu => {
  const out: Menu = { label: menu.label }
  if (menu.items !== undefined) out.items = menu.items.map(menuItem)
  if (menu.to !== undefined) out.to = deWireframe(menu.to)
  if (menu.href !== undefined) out.href = menu.href
  if (menu.external !== undefined) out.external = menu.external
  return out
}

const buildMenus = (): Menu[] => {
  const programs = readSnapshot<{ items: RawProgram[] }>('programs.json').items
  const projects = readSnapshot<{ items: RawProject[] }>('projects.json').items

  // Same derivations the composable makes at l.109-110 / l.148 / l.127-128.
  const programEntries = programs.map(a => ({ slug: a.slug, name: plainOrNull(a.heading) ?? '' }))
  const navProjects = NAV_SLUGS
    .map(slug => projects.find(p => p.slug === slug))
    .filter((p): p is RawProject => Boolean(p))
    .filter(isGridEligible)
  const transponderUrl = projects.find(p => p.slug === 'transponder-magazine')?.external_url
    ?? '#transponder-magazine-url'

  const source: Menu[] = [
    { label: 'About', items: [
      { label: 'Mission', to: '/wireframes/about' },
      { label: 'Board of Directors', to: '/wireframes/about#board' },
      { label: 'Team', to: '/wireframes/about#team' },
      { label: 'Bertelsmann Stiftung', href: '#', external: true },
      { label: 'Contact', to: '/wireframes/about#contact' }
    ] },
    { label: 'Programs', items: programEntries.map(a => ({ label: a.name, to: `/wireframes/${a.slug}` })) },
    { label: 'Projects', items: [
      // Only on-site, active projects link here — external_only products, podcasts and
      // archived rows are pruned so the menu tracks the data (Aug 4 mapping).
      ...navProjects.map(p => ({ label: plainOrNull(p.heading) ?? '', to: `/wireframes/projects/${p.slug}` })),
      { label: 'All Projects →', to: '/wireframes/projects', strong: true }
    ] },
    { label: 'Insights', items: [
      { label: 'All Insights', to: '/wireframes/insights' },
      { label: 'Articles', to: '/wireframes/insights?format=article' },
      { label: 'Reports', to: '/wireframes/insights?format=report' },
      { label: 'Videos', to: '/wireframes/insights?format=video' },
      { label: 'Infographics', to: '/wireframes/insights?format=infographic' },
      // Transponder Magazine lives under Insights. It is an external product, so the
      // link is its own site — PLACEHOLDER until Irene supplies the URL (Q6).
      { label: 'Transponder Magazine', href: transponderUrl, external: true },
      { label: 'Archive', to: '/wireframes/archive', strong: true }
    ] },
    // Pruned-nav plain buttons (BF-142): external links, no dropdowns, no landing pages.
    // NOTE: podcast-platform URL is a PLACEHOLDER — Irene to supply the real one.
    { label: 'Podcasts', href: '#podcast-platform-url', external: true },
    { label: 'Documentaries', href: 'https://bfnadocs.org', external: true }
  ]

  return source.map(menuGroup)
}

const normaliseMenus = (): number => {
  const menus = buildMenus()
  mkdirSync(BF_DATA_DIR, { recursive: true })
  // A bare array, so `src/assets/bf-data/menus.ts` can type it as `Menu[]` directly.
  writeFileSync(join(BF_DATA_DIR, 'menus.json'), `${JSON.stringify(menus, null, 2)}\n`, 'utf8')
  return menus.length
}

// ---- run -------------------------------------------------------------------

const main = (): void => {
  mkdirSync(OUT_DIR, { recursive: true })
  const counts = {
    insights: normaliseInsights(),
    projects: normaliseProjects(),
    programs: normalisePrograms(),
    people: normalisePeople(),
    pages: normalisePages(),
    announcements: normaliseAnnouncements()
  }
  const menus = normaliseMenus()

  console.log('normalise-wireframe-data → content/bf/')
  for (const [name, n] of Object.entries(counts)) console.log(`  ${name.padEnd(13)} ${n}`)
  console.log(`→ src/assets/bf-data/menus.json  ${menus} top-level menus`)

  const empty = Object.entries(counts).filter(([, n]) => !n).map(([name]) => name)
  if (empty.length || !menus) {
    console.error(`normalise-wireframe-data: produced zero documents for ${[...empty, ...(menus ? [] : ['menus'])].join(', ')}`)
    process.exitCode = 1
  }
}

main()
