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
 * Three things, and `bfSearchShell` (gh#52) draws all of them:
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
 * 2. **The ranking.** `score()` and its three computeds, ported from the
 *    frozen source. It lives **here**, never inside `bfSearchShell` (D8 — the
 *    shell renders `score`, it does not compute it, and its own block comment
 *    says so at length).
 * 3. **The URL.** `q`, `program` and `format` are read from `route.query` and
 *    written back through `navigateTo`, so `/search?q=democracy` deep-links,
 *    survives a reload and prerenders. The wireframe's three page-local `ref`s
 *    are gone; this page holds no query state of its own at all.
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
import { formatLabel } from '~/utils/format'

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
 * One flat vocabulary, with the family carried in the key.
 *
 * `SearchShellProps` takes a single `Filter[]` and a single `selectedFilters:
 * string[]`, and its contract note says why: *"which facets exist, and whether
 * they are one group or two, is a page decision. This shell renders exactly
 * the group it is given."* The frozen source writes two hand-rolled chip rows
 * with identical markup; here the two families are distinguished by a
 * `program:` / `format:` key prefix and mapped back onto the two separate
 * query parameters below. One group, one accessible name, two URL keys.
 *
 * Programs are keyed by **slug** and labelled by name — the same split
 * `/insights` makes for its `area` facet, so `?program=democracy` is a URL a
 * person can read and type.
 */
const PROGRAM_PREFIX = 'program:'
const FORMAT_PREFIX = 'format:'

const filters = computed<Filter[]>(() => [
  ...programs().map(program => ({
    key: `${PROGRAM_PREFIX}${program.slug}`,
    label: program.name
  })),
  ...FORMATS.map(format => ({
    key: `${FORMAT_PREFIX}${format.key}`,
    label: format.label
  }))
])

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

/** The selection, projected out of the two query parameters. */
const selectedFilters = computed<string[]>(() =>
  [
    selectedProgram.value ? `${PROGRAM_PREFIX}${selectedProgram.value}` : undefined,
    selectedFormat.value ? `${FORMAT_PREFIX}${selectedFormat.value}` : undefined
  ].filter((key): key is string => key !== undefined)
)

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
 * Facets, back into two parameters. Single-select per family, as the frozen
 * source behaves: `bfFilterBar` emits the full new selection, so the key that
 * is not the current one is the one just switched on, and an empty family is
 * the current one switched off.
 */
const onFilters = (selection: string[]) => {
  const pick = (prefix: string, current: string | undefined): string | undefined => {
    const keys = selection
      .filter(key => key.startsWith(prefix))
      .map(key => key.slice(prefix.length))

    return keys.find(key => key !== current) ?? keys[0]
  }

  return go({
    program: pick(PROGRAM_PREFIX, selectedProgram.value),
    format: pick(FORMAT_PREFIX, selectedFormat.value)
  })
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
 * Two deliberate departures from the frozen source, both forced by components
 * that did not exist when it was written:
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
 */
const pool: PoolRow[] = [
  ...items.map(insight => ({
    slug: `i-${insight.slug}`,
    heading: insight.heading ?? '',
    haystack: `${insight.heading ?? ''} ${insight.excerpt ?? ''}`,
    chip: formatLabel(insight.format),
    archived: !!insight.archived,
    program: insight.program ?? '',
    format: (insight.format ?? 'article').split('|')[0] ?? '',
    to: `/insights/${insight.slug}`,
    date: insight.publish_date ?? undefined
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
    date: undefined
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
    date: undefined
  }))
]

/* --- the ranking (ported verbatim from the frozen source) ---------------- */

/**
 * Simulated relevance: lexical scoring dressed as a semantic rank (**D4** —
 * the pattern, not a vector index). Full-phrase and heading hits weigh above
 * body hits, so the ordering reads as relevance rather than as a raw substring
 * match. A real embedding search is Front 4 and is **not** built here.
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

const ranked = computed<Array<PoolRow & { score: number }>>(() => {
  if (!hasQuery.value) return []

  const phrase = query.value.trim().toLowerCase()
  const terms = phrase.split(/\s+/).filter(Boolean)

  return pool
    .map(row => ({ ...row, score: score(row, phrase, terms) }))
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score)
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
 * The rows handed over, projected down to exactly `SearchResultRow` — the
 * three page-only fields do not cross the prop boundary — with `score`
 * normalised into the 0–1 the shell's contract asks for and the first twenty
 * taken (the frozen source's `results.slice(0, 20)`).
 *
 * `resultCount` below is deliberately **not** this array's length: the count
 * line reports the whole matched set, which is the distinction
 * `SearchShellProps` was written around.
 */
const rows = computed<SearchResultRow[]>(() =>
  results.value.slice(0, 20).map(row => ({
    slug: row.slug,
    heading: row.heading,
    to: row.to,
    chip: row.chip,
    archived: row.archived,
    date: row.date,
    score: row.score / topScore.value
  }))
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
    The shell. Everything it draws is a value computed above; it computes
    nothing (D8).

    `:filters` is empty until there is a query — the shell renders no facet row
    for an empty vocabulary, which is how the frozen source's `v-if="q.length >
    1"` on its Refine band is reproduced without a rule of our own. `:results`
    is likewise empty, so the idle page is the search control and the prompt
    below it.

    `data-bf-search` is the idle/active hook the scoped rule below reads. It is
    an attribute, not a prop: it falls through `$attrs` onto the shell's single
    root, which is exactly what that root is documented to do.
  -->
  <bfSearchShell
    class="bf-search"
    :data-bf-search="hasQuery ? 'active' : 'idle'"
    :query="query"
    :filters="hasQuery ? filters : []"
    :selected-filters="selectedFilters"
    :results="rows"
    :result-count="results.length"
    label="Search insights, projects and people"
    @update:query="onQuery"
    @update:selected-filters="onFilters"
  />

  <!--
    The idle prompt. The shell's count line is a persistent live region by
    design (residual #169) and would otherwise announce “0 results, ranked by
    relevance” to a reader who has not typed anything — a failed search
    reported before one was made. So the idle state hides the count line and
    the empty state (below) and says this instead.
  -->
  <p v-if="!hasQuery" class="bf-search__prompt" data-measure="normal">
    Start typing above to search across insights, projects and people. Results
    are ranked by relevance, and the query lives in the URL — so a search can
    be bookmarked or shared.
  </p>
</template>

<style scoped>
/*
  The one page-level rule in this template, and it exists because
  `bfSearchShell` has no “not asked yet” state to pass it.

  The shell's count line is rendered in **every** state on purpose — a live
  region inserted into the DOM already holding its message is not reliably
  announced (residual #169) — and its empty state follows the count line
  whenever `results` is empty. Both are right once a query exists and wrong
  before one does: an unqueried `/search` would open on “0 results” and a
  `<h2>No results</h2>`.

  So the idle state hides those two parts, through the `data-bf-search-shell`
  selector hooks the component publishes for exactly this kind of addressing,
  and the page renders its own prompt instead. The trade-off is stated rather
  than hidden: while idle, the region is out of the accessibility tree, so the
  **first** query's count may not be announced; every count after it is, which
  is the guarantee #169 is actually about. No component is edited and no
  contract changes.

  `@layer overrides` — last in the house order (BRIEF §5 rule 4), so this
  outranks the shell's own `@layer components` rules without an unlayered
  declaration that nothing could ever outrank in turn.

  No `:not()` anywhere (D-20.5, gh#29).
*/
@layer overrides {
  .bf-search[data-bf-search='idle'] :deep([data-bf-search-shell='count']),
  .bf-search[data-bf-search='idle'] :deep([data-bf-search-shell='empty']) {
    display: none;
  }
}
</style>
