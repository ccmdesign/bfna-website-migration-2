<script setup lang="ts">
/**
 * `/search` — the semantic-search *pattern*, ranked in this page (issue 54 /
 * gh#63).
 *
 * Descends from `src/pages/wireframes/search.vue`, which is frozen (D2): its
 * `score()`/`ranked`/`results`/`topScore` arithmetic is ported below verbatim,
 * its pool shape is ported below verbatim, and nothing here imports from it.
 *
 * This file **retires the legacy `/search`** — the one file this issue deletes
 * (`02-legacy-retirement-inventory.md` §A). What stood here was a
 * `legacy-base` page driven by the legacy search composable → the
 * `server/api/` search route → a static JSON index under `public/`, built at
 * deploy time by `scripts/generate-search-index.ts`. (None of those three
 * names is written out here: this issue's acceptance greps this file for their
 * absence, and a provenance note is not worth failing it over.) A route owns
 * exactly one page file and `/search` keeps its route, so "delete the legacy
 * page" is this rewrite: not
 * one identifier of that stack survives below, which this issue's acceptance
 * greps for. The composable, the API route, the JSON index and the generator
 * script are retired by **#68**, not here — they are still referenced by the
 * legacy chrome until the cutover.
 *
 * ## What this page owns, and what it does not
 *
 * Four things, and `bfSearchShell` (gh#52) draws most of them:
 *
 * 1. **The pool.** `useBfInsights().items` + `useBfProjects().projects()` +
 *    `useBfPeople().people()`, each mapped to the `SearchResultRow`
 *    *projection* from `bf-contracts.ts`. A row is a projection rather than an
 *    entity (residual #172) for one concrete reason: `to` is arbitrary across
 *    the three types — an insight routes to `/insights/<slug>`, a project to
 *    `/projects/<slug>` (or to its `external_url` when it is external-only),
 *    and a person to `/about#team`, which is an anchor into a *different*
 *    page. An entity-typed row would recompute `to` from the entity and send
 *    every person to a 404 that typechecks.
 * 2. **The ranking.** The BFNA search API's matches first, in its order
 *    (`useSearchApi` — an embedding search, so "how do citizens vote from
 *    abroad" finds "Democracy at a Distance"), then the in-page `score()`
 *    ported from the frozen source for everything the API did not return.
 *    Without the API — no URL in the build, a failed request, or the moment
 *    before it answers — the in-page ranking stands alone, so the page never
 *    waits on the network to show something. Either way the ranking lives
 *    **here**, never inside `bfSearchShell` (D8 — the shell renders `score`,
 *    it does not compute it, and its own block comment says so at length).
 * 3. **The URL.** `q`, `program` and `format` are read from `route.query` and
 *    written back through `navigateTo`, so `/search?q=democracy` deep-links,
 *    survives a reload and prerenders. The wireframe's three page-local `ref`s
 *    are gone; the only state this page holds is how many rows are showing.
 * 4. **The three states** (refined pass, Sep 2026) — the words and the way
 *    on for each, through the shell's `facets` and `empty` slots:
 *    - *not asked yet* — the prompt, then a way to browse instead;
 *    - *nothing matched* — the frozen source's "No results", then the same
 *      way to browse;
 *    - *facets filtered every match away* — says so, counts what the query
 *      found without them, and offers to clear them. Telling that reader to
 *      "try different words" sends them to fix the one thing that worked.
 *
 * ## `/search` is not seeded into `nitro.prerender.routes`
 *
 * It does not need to be: `bfNav` links it (`Nav.vue:146`) and `bfFooter`
 * links it again (`Footer.vue:142`), so the crawler reaches it from every
 * page it already renders. The spec's acceptance greps the `prerender` line of
 * `nuxt.config.ts` for it; that check is replaced by an assertion on the
 * generated `.output/public/search/index.html`, which is the fact the grep was
 * a proxy for. See this issue's Decisions.
 */
import type { Filter, SearchResultRow } from '~/types/bf-contracts'
import { useBfInsights } from '~/composables/data/useBfInsights'
import { useBfPeople } from '~/composables/data/useBfPeople'
import { useBfPrograms } from '~/composables/data/useBfPrograms'
import { useBfProjects } from '~/composables/data/useBfProjects'
import { useSearchApi, type SearchApiMatch } from '~/composables/useSearchApi'
import { programChipLabel } from '~/utils/bf-card-program'
import { formatLabel } from '~/utils/format'
import { displayHeading, kickerHidesFormatChip, splitHeadingKicker } from '~/utils/headingKicker'

defineOptions({ name: 'SearchPage' })

definePageMeta({ layout: 'bf-default' })

const route = useRoute()

const { items } = await useBfInsights()
const { projects } = await useBfProjects()
const { people } = await useBfPeople()
const { programs, programBySlug } = await useBfPrograms()

useHead({ title: 'Search' })

/* --- the facet vocabulary ------------------------------------------------ */

/**
 * The format facets, verbatim from the frozen source's `FORMATS` — the same
 * four `Filter`s `/insights` builds, because they are the same four values
 * `Insight.format` takes.
 */
const FORMATS: Filter[] = [
  { key: 'article', label: 'Articles' },
  { key: 'report', label: 'Reports' },
  { key: 'video', label: 'Videos' },
  { key: 'infographic', label: 'Infographics' }
]

/**
 * The program facets, keyed by **slug** and labelled with the site's one
 * programme chip label (`programChipLabel`) — the same split and the same
 * words `/insights` uses for its `area` facet, so `?program=democracy` is a URL a
 * person can read and type, and the same key `bfFilterBar`'s `tone="program"`
 * paints each chip from.
 *
 * Two vocabularies, two bars. Until the refined pass this page folded both
 * families into one `Filter[]` with a `program:`/`format:` key prefix, because
 * `bfSearchShell` rendered exactly one bar; it now takes a `facets` slot, so
 * the page draws the captioned Format and Program pair `/insights` draws, and
 * a reader meets one facet vocabulary on both pages.
 */
const programFilters = computed<Filter[]>(() =>
  programs().map(program => ({ key: program.slug, label: programChipLabel(program.name) }))
)

/* --- URL state ----------------------------------------------------------- */

/**
 * One query parameter, normalised. A repeated key arrives as an array and an
 * empty value is not a value — both resolve to `undefined` so every consumer
 * below tests one thing.
 */
const readQuery = (key: string): string | undefined => {
  const raw = route.query[key]
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' && value !== '' ? value : undefined
}

const query = computed<string>(() => readQuery('q') ?? '')
const selectedProgram = computed<string | undefined>(() => readQuery('program'))
const selectedFormat = computed<string | undefined>(() => readQuery('format'))

/**
 * The frozen source's own threshold (`v-if="q.length > 1"`): one character is
 * not a search, it is a keystroke on the way to one, and ranking 385 documents
 * against `"d"` returns most of them in an order nobody asked for.
 */
const hasQuery = computed<boolean>(() => query.value.trim().length > 1)

/** One parameter as a `bfFilterBar` selection: none, or the one key. */
const asSelection = (value: string | undefined): string[] => (value ? [value] : [])

/**
 * Write the URL. The whole query is rebuilt from the current values plus the
 * patch, so an `undefined` in the patch *removes* a parameter rather than
 * writing an empty one — `?q=&program=` is a URL with two facts in it that are
 * not true.
 */
const go = (
  patch: Partial<Record<'q' | 'program' | 'format', string | undefined>>,
  replace = false
) => {
  const merged: Record<string, string | undefined> = {
    q: query.value,
    program: selectedProgram.value,
    format: selectedFormat.value,
    ...patch
  }

  const next: Record<string, string> = {}
  for (const [key, value] of Object.entries(merged)) if (value) next[key] = value

  return navigateTo({ path: '/search', query: next }, { replace })
}

/**
 * Typing replaces the history entry rather than pushing one. `bfSearchShell`
 * debounces to one emit per burst, but a burst is still a burst: pushing would
 * bury the page the reader arrived from under one entry per pause, and Back
 * would walk them backwards through their own typing.
 *
 * The value is written **exactly as it was typed**, not trimmed. The shell
 * resynchronises its draft against `query` whenever the incoming value differs
 * from the one it last emitted, so a page that trimmed would delete the space
 * the reader had just typed: emit `"how "`, store `"how"`, and the shell —
 * seeing a value that is not its own echo — treats it as an external change
 * and rewrites the input mid-word. Trimming happens where it belongs, in
 * `hasQuery` and in the scorer, both of which already do it.
 */
const onQuery = (value: string) => go({ q: value || undefined }, true)

/**
 * A facet, back into its parameter. Single-select per family, as the frozen
 * source behaves: `bfFilterBar` emits the full new selection, so the key that
 * is not the current one is the one just switched on, and an empty selection
 * is the current one switched off.
 */
const onFacet = (family: 'program' | 'format', selection: string[]) => {
  const current = family === 'program' ? selectedProgram.value : selectedFormat.value
  const next = selection.find(key => key !== current) ?? selection[0]
  return family === 'program' ? go({ program: next }) : go({ format: next })
}

/**
 * The way out of a filtered-to-nothing result: both families off, query kept.
 *
 * Then focus moves, because the control that was pressed does not survive
 * the press. "Clear filters" lives in the empty state, and clearing brings
 * the rows back in its place, so the focused button leaves the DOM and a
 * keyboard or screen-reader reader is dropped onto `<body>`, at the top of
 * the page, just as their results arrive (WCAG 2.4.3). Once the URL has
 * changed and the rows have rendered, focus goes to the first result's link:
 * the thing they cleared the filters to reach, and it announces itself. The
 * count line has already said how many there are.
 *
 * Clearing always brings rows back (`filteredOut` means the query matched
 * without the facets), so the fallback, the count line made focusable for
 * this once, is a guard rather than a path.
 */
const clearFacets = async () => {
  await go({ program: undefined, format: undefined })
  await nextTick()

  const target
    = document.querySelector<HTMLElement>('[data-bf-search-shell="row"] :is(h2, h3, h4) a')
    ?? document.querySelector<HTMLElement>('[data-bf-search-shell="count"]')

  if (!target) return
  if (target.tagName !== 'A') target.setAttribute('tabindex', '-1')
  target.focus()
}

/* --- the pool ------------------------------------------------------------ */

/**
 * A pool row is a `SearchResultRow` before it has a score, plus the three
 * fields only this page reads: the text the scorer searches and the two facet
 * values it filters on. Built from the pinned contract rather than beside it,
 * so a change to `SearchResultRow` re-types the pool with it (BRIEF §5 rule
 * 11 — no shared type is declared here; this is the page's own composition of
 * one).
 */
type PoolRow = Omit<SearchResultRow, 'score'> & {
  haystack: string
  program: string
  format: string
}

/**
 * Insights, projects and people in one list, exactly as the frozen source
 * builds it — same fields, same fallbacks, same `i-`/`p-`/`pe-` slug prefixes
 * (the three collections' slugs are unique within a collection, not across
 * three), retargeted from `/wireframes/*` to the real routes.
 *
 * Three deliberate departures from the frozen source, the first two forced by
 * components that did not exist when it was written:
 *
 * - `date` is the raw `publish_date`, **not** `monthYear(publish_date)`.
 *   `bfSearchShell` renders it through `bfTime`, which needs a parseable value
 *   to write `datetime` and does the formatting itself; handing it a
 *   pre-formatted `"Mar 2024"` would produce a `<time>` with no machine-
 *   readable date, which is a `<span>` spelled differently.
 * - a project that is **external-only** routes to its `external_url` rather
 *   than to `/projects/<slug>`, because that is where the reader must end up
 *   and there is no detail page to land on. `transponder-magazine` — the one
 *   such row in the snapshot — carries a null `external_url`, so the fallback
 *   is the internal route and not `href="null"`.
 * - each row carries an `excerpt` (a person's is the job title), which the
 *   shell sets as one clamped line under the title, so similar titles
 *   ("Disrupting Democracy", "Disrupting Democracy | Italy") can be told
 *   apart in the list. `||` rather than `??`: an empty string is no line.
 *   An insight whose heading ends on a colon is titled with its subheading
 *   joined on (`displayHeading()`), as its card is.
 */
const pool: PoolRow[] = [
  ...items.map(insight => ({
    slug: `i-${insight.slug}`,
    heading: displayHeading(insight.heading, insight.subheading),
    haystack: `${insight.heading ?? ''} ${insight.excerpt ?? ''}`,
    chip: formatLabel(insight.format),
    archived: !!insight.archived,
    program: insight.program ?? '',
    format: (insight.format ?? 'article').split('|')[0] ?? '',
    to: `/insights/${insight.slug}`,
    date: insight.publish_date ?? undefined,
    excerpt: insight.excerpt || undefined
  })),
  ...projects().map(project => ({
    slug: `p-${project.slug}`,
    heading: project.heading,
    haystack: `${project.heading} ${project.excerpt ?? ''} ${project.description ?? ''}`,
    chip: 'Project',
    archived: !!project.archived,
    program: project.program ?? '',
    format: '',
    to: project.external_only && project.external_url
      ? project.external_url
      : `/projects/${project.slug}`,
    date: undefined,
    excerpt: project.excerpt || undefined
  })),
  ...people().map(person => ({
    slug: `pe-${person.slug}`,
    heading: person.name,
    haystack: `${person.name} ${person.job_title ?? ''}`,
    chip: 'Person',
    archived: false,
    program: '',
    format: '',
    to: '/about#team',
    date: undefined,
    excerpt: person.job_title || undefined
  }))
]

/* --- the ranking (ported verbatim from the frozen source) ---------------- */

/**
 * Simulated relevance: lexical scoring dressed as a semantic rank (**D4** —
 * the pattern, not a vector index). Full-phrase and heading hits weigh above
 * body hits, so the ordering reads as relevance rather than as a raw substring
 * match. The real embedding search is the API below; this is what ranks
 * whatever the API did not return, and everything when there is no API.
 *
 * The weights are the frozen source's, unchanged: phrase-in-heading 8,
 * phrase-in-body 4, term-in-heading 3, term-in-body 1, and a term that hit the
 * heading does not also score in the body.
 */
function score(row: PoolRow, phrase: string, terms: string[]): number {
  const heading = row.heading.toLowerCase()
  const body = row.haystack.toLowerCase()
  let s = 0
  if (phrase && heading.includes(phrase)) s += 8
  else if (phrase && body.includes(phrase)) s += 4
  for (const t of terms) {
    if (heading.includes(t)) s += 3
    else if (body.includes(t)) s += 1
  }
  return s
}

type RankedRow = PoolRow & { score: number }

const lexical = computed<RankedRow[]>(() => {
  if (!hasQuery.value) return []

  const phrase = query.value.trim().toLowerCase()
  const terms = phrase.split(/\s+/).filter(Boolean)

  return pool
    .map(row => ({ ...row, score: score(row, phrase, terms) }))
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score)
})

/* --- the search API ------------------------------------------------------ */

const api = useSearchApi(query, useRuntimeConfig().public.searchApiUrl as string)

const poolBySlug = new Map(pool.map(row => [row.slug, row]))

/**
 * One API match as a pool row, or nothing.
 *
 * - On-site content is matched by slug to the insight or project it became
 *   (the API indexes the same Directus records the snapshot was taken from),
 *   so the row carries this site's route, format, program and date, and the
 *   facets filter it like any other.
 * - Off-site content (an absolute `url` — HTFD episodes, Barometer topics,
 *   documentaries) links out, chipped with the API's type. It has no program
 *   or format here, so either facet hides it.
 * - A legacy path that matches nothing on this site is dropped rather than
 *   linked to a page the new site does not have.
 */
const fromMatch = (match: SearchApiMatch): PoolRow | undefined => {
  if (/^https?:\/\//.test(match.url)) {
    return {
      slug: `x-${match.collection}-${match.slug}`,
      heading: match.heading,
      haystack: '',
      chip: match.type ?? '',
      archived: false,
      program: '',
      format: '',
      to: match.url,
      date: undefined,
      excerpt: match.excerpt || match.subheading
    }
  }
  return poolBySlug.get(`i-${match.slug}`) ?? poolBySlug.get(`p-${match.slug}`)
}

/**
 * The API's matches for the current query, or `null` while there are none to
 * use — no API, a failed request, or an answer still on its way for this
 * query. `null` is "rank in the page"; an empty array is "the API answered
 * and nothing on this site matched", which still falls through to the
 * in-page ranking below.
 */
const semantic = computed<RankedRow[] | null>(() => {
  if (!hasQuery.value) return null
  if (api.status.value !== 'ready' || api.forTerm.value !== query.value.trim()) return null

  const seen = new Set<string>()
  return api.matches.value.flatMap((match) => {
    const row = fromMatch(match)
    if (!row || seen.has(row.slug)) return []
    seen.add(row.slug)
    return [{ ...row, score: match.relevance }]
  })
})

/**
 * The API's matches, then every in-page match the API did not return. The
 * in-page scores are rescaled to sit under the API's lowest relevance, so the
 * shell's score bars keep reading as one ranking from top to bottom.
 */
const ranked = computed<RankedRow[]>(() => {
  const first = semantic.value
  if (!first?.length) return lexical.value

  const taken = new Set(first.map(row => row.slug))
  const rest = lexical.value.filter(row => !taken.has(row.slug))
  const floor = Math.min(...first.map(row => row.score)) * 0.9
  const top = rest[0]?.score || 1

  return [...first, ...rest.map(row => ({ ...row, score: (row.score / top) * floor }))]
})

/**
 * The facets, applied after ranking rather than before it — the frozen
 * source's order, and the one that keeps `topScore` meaning "the best match
 * you are currently looking at" rather than "the best match that exists".
 *
 * `program` is compared by **name**, because that is what the snapshot stores
 * on an insight and a project; the URL carries the slug, and `programBySlug`
 * is the one translation. An unknown slug resolves to `undefined` and filters
 * nothing out, which is the same forgiving behaviour `/insights` has.
 */
const results = computed(() => {
  const programName = selectedProgram.value
    ? programBySlug(selectedProgram.value)?.name
    : undefined

  return ranked.value.filter(row =>
    (!programName || row.program === programName)
    && (!selectedFormat.value || row.format === selectedFormat.value)
  )
})

const topScore = computed<number>(() => results.value[0]?.score || 1)

/**
 * The query matched, and the facets removed every match. The one empty state
 * whose way out is not "different words" — see state 4 in the header.
 */
const filteredOut = computed<boolean>(() =>
  ranked.value.length > 0 && results.value.length === 0
)

/** What the query found before the facets — the reason to clear them. */
const filteredOutMessage = computed<string>(() => {
  const n = ranked.value.length
  return `${n} ${n === 1 ? 'result matches' : 'results match'} “${query.value.trim()}” across every program and format.`
})

/* --- paging -------------------------------------------------------------- */

/**
 * The frozen source's page size, `results.slice(0, 20)` — kept as the first
 * page, and no longer as the last. The count line reports the whole matched
 * set ("46 results"), and until the refined pass rows 21–46 could not be
 * reached at all: a number on the page promising results the page would not
 * show. `bfLoadMore` below the list pages through them, the control
 * `/insights` uses for the same job.
 */
const PAGE_SIZE = 20

const visible = ref<number>(PAGE_SIZE)

/** A new question starts from its first page. */
watch([query, selectedProgram, selectedFormat], () => {
  visible.value = PAGE_SIZE
})

const remaining = computed<number>(() => Math.max(results.value.length - visible.value, 0))

/**
 * The rows handed over, projected down to exactly `SearchResultRow` — the
 * three page-only fields do not cross the prop boundary — with `score`
 * normalised into the 0–1 the shell's contract asks for, and the rows shown
 * so far taken (the frozen source's `slice(0, 20)`, paged; see above).
 *
 * `resultCount` below is deliberately **not** this array's length: the count
 * line reports the whole matched set, which is the distinction
 * `SearchShellProps` was written around.
 *
 * Insight rows split their heading here, at the prop boundary, and not in
 * the pool: the scorer matches against the **full** heading ("infographic"
 * still finds "Infographic: Cybersecurity"), and only the visible row shows
 * the kicker and title apart — dropping the format chip when the kicker
 * restates it, as every insight card does.
 */
const rows = computed<SearchResultRow[]>(() =>
  results.value.slice(0, visible.value).map((row) => {
    const split = row.slug.startsWith('i-') ? splitHeadingKicker(row.heading) : null
    return {
      slug: row.slug,
      heading: split ? split.title : row.heading,
      kicker: split?.kicker || undefined,
      to: row.to,
      chip: split && kickerHidesFormatChip(split, row.format) ? '' : row.chip,
      archived: row.archived,
      date: row.date,
      excerpt: row.excerpt,
      score: row.score / topScore.value
    }
  })
)
</script>

<template>
  <!--
    No wrapper element: `bf-default`'s `<main class="stack" data-gap="xl">` is
    this page's own stack, and a `<div>` here would collapse both bands into a
    single stack child.
  -->

  <!--
    The header. Its default slot is **empty on purpose**: the frozen source
    puts the `<input>` here because in the wireframe there was nowhere else for
    it to live, and `bfSearchShell` now renders its own labelled
    `bfFormField[type=search]`. Two inputs for one query is two places to type
    and one of them wrong. Recorded in this issue's Decisions.

    The tagline is the frozen source's, verbatim.
  -->
  <bfPageHeader
    label="Search"
    heading="Search"
    tagline="Ask in your own words — results are ranked by meaning, not keyword matches."
  />

  <!--
    The band: the shell, then the pager. `aria-label` names it as a region —
    the rows' `<h2>`s (and every empty state's) sit inside it, and a band
    holding headings with no name of its own is a generic container that
    `bfSection` warns about at dev time. The shell's own `<search>` landmark
    sits inside it, unnamed, so the two do not announce the same words.
  -->
  <bfSection label="Search" aria-label="Search results">
    <!--
      The shell. Everything it draws is a value computed above; it computes
      nothing (D8).

      `:filters` and `:selected-filters` are empty because this page fills
      the shell's `facets` slot with its own two bars instead — see
      `programFilters`. The slot is filled only once there is a query, which
      is how the frozen source's `v-if="q.length > 1"` on its Refine band is
      reproduced: an idle page is the search control and the prompt below it.

      `:heading-level="2"`: the result titles are the band's headings, one
      rank under the page's `<h1>`. At the shell's default `3` a populated
      search jumped `h1 → h3` (BRIEF §5 rule 9) — the skip `check-routes.ts`
      recorded as measurable only after hydration.

      `data-bf-search` is the idle/active hook the scoped rule below reads. It
      is an attribute, not a prop: it falls through `$attrs` onto the shell's
      single root, which is exactly what that root is documented to do.
    -->
    <bfSearchShell
      class="bf-search"
      :data-bf-search="hasQuery ? 'active' : 'idle'"
      :query="query"
      :filters="[]"
      :selected-filters="[]"
      :results="rows"
      :result-count="results.length"
      :heading-level="2"
      label="Search insights, projects and people"
      @update:query="onQuery"
    >
      <!--
        The facets — the captioned pair `/insights` shows, in its order, its
        skins and its caption (`.bf-facet-caption`). Each bar points its accessible name at its visible caption
        (`aria-labelledby` wins over `bfFilterBar`'s own `aria-label`), so two
        groups on one page never both announce as "Filters".
      -->
      <template v-if="hasQuery" #facets>
        <div class="bf-search__facets | cluster" data-gap="l">
          <div class="stack" data-gap="xs">
            <span id="search-facet-format" class="bf-facet-caption">Format</span>
            <bfFilterBar
              aria-labelledby="search-facet-format"
              label="Format"
              tone="format"
              :filters="FORMATS"
              :model-value="asSelection(selectedFormat)"
              @update:model-value="selection => onFacet('format', selection)"
            />
          </div>
          <div class="stack" data-gap="xs">
            <span id="search-facet-program" class="bf-facet-caption">Program</span>
            <bfFilterBar
              aria-labelledby="search-facet-program"
              label="Program"
              tone="program"
              :filters="programFilters"
              :model-value="asSelection(selectedProgram)"
              @update:model-value="selection => onFacet('program', selection)"
            />
          </div>
        </div>
      </template>

      <!--
        Whatever stands where the rows would — the three states in the header,
        in the order a reader can reach them. Each empty state is rank 2: the
        header above owns the `<h1>` (residual #173).
      -->
      <template #empty>
        <bfEmptyState
          v-if="filteredOut"
          :heading-level="2"
          heading="No results with these filters"
          :message="filteredOutMessage"
        >
          <div>
            <bfButton @click="clearFacets">
              Clear filters
            </bfButton>
          </div>
        </bfEmptyState>

        <bfEmptyState
          v-else-if="hasQuery"
          :heading-level="2"
          heading="No results"
          message="No records matched — try fewer or different words."
        />

        <!--
          The idle prompt. The shell's count line is a persistent live region
          by design (residual #169) and would otherwise announce “0 results” to
          a reader who has not typed anything — a failed search reported before
          one was made. So the idle state hides the count line (below) and
          says this instead.
        -->
        <p v-else class="bf-search__prompt" data-measure="narrow">
          Start typing above to search across insights, projects and people.
          Results are ranked by relevance, and the query lives in the URL — so
          a search can be bookmarked or shared.
        </p>

        <!--
          The way on, when words are the problem or have not been tried: the
          three programs as their own coloured chips (the program pages are
          where the site's work is grouped), then the three indexes. Not shown
          under a filtered-out result — that reader's way on is the button.

          The chips' list takes its name from the sentence that introduces it.
        -->
        <div
          v-if="!filteredOut"
          class="bf-search__browse | stack"
          data-gap="s"
          data-measure="normal"
        >
          <p id="search-browse" class="bf-search__browse-lead">
            Or start from one of our programs:
          </p>
          <ul
            class="cluster"
            role="list"
            data-gap="xs"
            aria-labelledby="search-browse"
          >
            <li v-for="program in programs()" :key="program.slug">
              <bfChip
                :to="`/${program.slug}`"
                tone="program"
                :program="program.slug"
              >
                {{ programChipLabel(program.name) }}
              </bfChip>
            </li>
          </ul>
          <p class="bf-search__browse-more">
            You can also browse <NuxtLink to="/insights">all insights</NuxtLink>,
            <NuxtLink to="/projects">every project</NuxtLink>, or
            <NuxtLink to="/archive">the archive of past work</NuxtLink>.
          </p>
        </div>
      </template>
    </bfSearchShell>

    <!--
      The pager, outside the shell and straight after its list. The two
      counts drive its own live region, so a page arriving is announced
      instead of appended in silence; the label carries the remainder, as the
      `/insights` pager's does.
    -->
    <bfLoadMore
      v-if="hasQuery && results.length > PAGE_SIZE"
      :has-more="remaining > 0"
      :label="`Load more (${remaining} remaining)`"
      :visible-count="rows.length"
      :total-count="results.length"
      @load="visible += PAGE_SIZE"
    />
  </bfSection>
</template>

<style scoped>
/*
  `@layer components` for this page's own elements — the prompt and the
  browse block — and `@layer overrides` for the one rule that
  reaches into the shell. No `:not()` anywhere (D-20.5, gh#29), no colour
  that is not already a semantic token.
*/
@layer components {
  /*
    The prompt is the idle page's content, so it speaks at body size; the
    browse block under it is the secondary voice. Its measure is `narrow`
    because it is set a step larger than the field above it and the browse
    block below — 60ch of body text lands at or near the end edge of their
    75ch of UI text, so the three read as one column rather than three.
  */
  .bf-search__prompt {
    text-wrap: pretty;
  }

  /*
    The browse block follows a reply (an empty state) or the prompt. A
    hairline above it marks the turn from "your search" to "somewhere else to
    start", at the measure the prompt sets (`data-measure`, in the markup).
  */
  .bf-search__browse {
    padding-block-start: var(--space-m);
    border-block-start: var(--border-width-thin) solid var(--color-base-super-light);
  }

  /*
    The chips' list items hug their chips. A bare `li` is a line box at the
    body's size and leading, taller than the pill inside it, and it carries
    the global list-item bottom margin, so the wrapped program chips stood a
    line apart on a phone. The cluster's gap is the only space between them.
  */
  .bf-search__browse li {
    display: flex;
    margin: 0;
  }

  .bf-search__browse-lead,
  .bf-search__browse-more {
    color: var(--color-base-light);
    font-size: var(--size--1);
  }

  /*
    `NuxtLink` renders `class=""`, which `a:not([class])` does not match, so
    these would be the user agent's blue. Sentence-level links: the link
    colour and a considered underline, thicker on hover — `bfEmptyState`'s
    back link, in the same words.
  */
  .bf-search__browse-more a {
    color: var(--color-link);
    font-weight: var(--font-weight-normal);
    text-decoration-line: underline;
    text-decoration-thickness: var(--border-width-thin);
    text-underline-offset: 0.2em;
  }

  .bf-search__browse-more a:hover {
    text-decoration-thickness: var(--border-width-medium);
  }
}

/*
  The one rule that reaches into the shell, and it exists because
  `bfSearchShell` has no “not asked yet” state to pass it.

  The shell's count line is rendered in **every** state on purpose — a live
  region inserted into the DOM already holding its message is not reliably
  announced (residual #169). That is right once a query exists and wrong
  before one does: an unqueried `/search` would open on “0 results”.

  So the idle state hides the count line, through the `data-bf-search-shell`
  selector hook the component publishes for exactly this kind of addressing.
  The trade-off is stated rather than hidden: while idle, the region is out of
  the accessibility tree, so the **first** query's count may not be announced;
  every count after it is, which is the guarantee #169 is actually about. No
  component is edited and no contract changes.

  The empty block is no longer hidden alongside it: since the refined pass
  the page fills the shell's `empty` slot with the idle prompt itself, so
  there is nothing wrong there to hide.

  The empty states sit in a stack that already spaces them — the shell's gap
  above, off the count line, and the empty wrapper's own gap below, before
  the browse block — so their inline `--space-xl` of padding would double
  both. Retuned to none through `bfEmptyState`'s own hook, on the element
  that declares it (the block renders in this page's slot content, so it
  carries this page's scope). One value, not a start/end pair: the build
  lowers the component's `padding-block` to `padding-top`/`padding-bottom`,
  each taking the hook whole, so a pair would be invalid on both.

  `@layer overrides` — last in the house order (BRIEF §5 rule 4), so these
  outrank the components' own `@layer components` rules without an unlayered
  declaration that nothing could ever outrank in turn.
*/
@layer overrides {
  .bf-search[data-bf-search='idle'] :deep([data-bf-search-shell='count']) {
    display: none;
  }

  .bf-search .bf-empty-state {
    --_bf-empty-state-padding-block: 0;
  }
}
</style>
