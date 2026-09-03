<script setup lang="ts">
/**
 * `/insights` — the insights feed (issue 49 / gh#58).
 *
 * Descends from `src/pages/wireframes/insights/index.vue`, which is frozen
 * (D2): read for its band order, its facets and its filter arithmetic, never
 * edited, and nothing here imports from it. It retires **no** legacy file —
 * `/insights` is a new route; `/updates`, the nearest legacy analog, is a
 * different route over a different data model and belongs to phase 7.
 *
 * ## What changed on the way over, and why
 *
 * Two hand-rolled `wf-chip` clusters become two `bfFilterBar`s (the BF-209
 * dependency on BF-157's toggle variant), and the wireframe's third cluster —
 * an inline `?archive=1` toggle — becomes a **link to `/archive`**, which is
 * its own route now (issue 55). `pages/[program].vue` already writes that same
 * forward link, in the same words.
 *
 * Everything else is the frozen page's, ported rather than redesigned: the
 * four formats, the toggle-by-URL behaviour, the `visible += 24` pagination,
 * the count line and its "(including archive)" qualifier.
 *
 * ## The filters live in the URL, and this page owns them (D8)
 *
 * `bfFilterBar` tracks selection and emits; it does not read the route and it
 * does not navigate. So the query is read here, `linkWith()` — the frozen
 * page's own helper — builds the next location here, and the bar is driven
 * controlled from `route.query`. The result is that every filter state is a
 * real URL: linkable, bookmarkable, back-button-able, and prerenderable as the
 * unfiltered case.
 *
 * ## A multi-select component driving single-valued facets
 *
 * `bfFilterBar` is multi-select by contract — it emits the whole new selection
 * as an array. These two facets are single-valued (one format, one program),
 * exactly as the wireframe's chips are, so the handler below reduces the
 * emitted array to **at most one key**: the one that is not already selected,
 * or none at all when the user clicked the active chip. That is the frozen
 * page's toggle semantics, expressed through the array the component emits
 * rather than through a `:to` on each chip.
 *
 * Widening a facet to true multi-select is a product decision (two formats at
 * once? a union or an intersection?) that neither the wireframe nor the spec
 * makes, so it is not made here.
 *
 * ## Data
 *
 * A page may call a composable; a `bf-*` component may not (D8). Every read on
 * this route is one of the three awaited calls below, and every component in
 * the template is handed entities as props. The imports are explicit because
 * Nuxt scans `composables/` one directory deep for `index` files only, and
 * these live at `composables/data/useBf*.ts`.
 */
import type { Filter, Insight } from '~/types/bf-contracts'
import { useBfInsights } from '~/composables/data/useBfInsights'
import { useBfPages } from '~/composables/data/useBfPages'
import { useBfPrograms } from '~/composables/data/useBfPrograms'

defineOptions({ name: 'InsightsIndexPage' })

definePageMeta({ layout: 'bf-default' })

const route = useRoute()

const { active, archived } = await useBfInsights()
const { programs, programBySlug } = await useBfPrograms()
const { pageBySlug } = await useBfPages()

/** The feed's own document — its heading and standfirst are content, not copy. */
const feedPage = pageBySlug('insights')

/** The band's own title, added once by `bf-default`'s `titleTemplate`. */
useHead({ title: () => feedPage?.heading ?? 'Insights' })

/**
 * The format facet, ported verbatim from the frozen page (and identical to the
 * one `wireframes/search.vue` writes a second time).
 *
 * A page-level constant rather than a derived one: `Insight.format` is a free
 * string carrying values like `article|opinion`, so the four the client filters
 * by are a curation decision, not a `distinct()` over the collection. Deriving
 * them would put every stray format in the data on the page.
 */
const FORMATS: Filter[] = [
  { key: 'article', label: 'Articles' },
  { key: 'report', label: 'Reports' },
  { key: 'video', label: 'Videos' },
  { key: 'infographic', label: 'Infographics' }
]

/**
 * The programme chip label, ported from `pages/index.vue`, which ported it from
 * the frozen home page.
 *
 * It stays a page-level relabelling because there is no field to move it to:
 * `bfProgramSchema` declares `slug`, `name`, `tagline`, `intro` and `image` —
 * no short name (recorded as D-47.2 on the home page's spec, and unchanged
 * here). Chips are a cluster of one-line controls and the full name is 43
 * characters, so the untruncated version would wrap the facet row on every
 * viewport this site has.
 */
const shortProgram = (program: string): string => {
  if (program === 'Transatlantic Relations & Global Challenges') return 'Transatlantic Rel.'
  if (program.startsWith('RE-TAG') || program.startsWith('PENDING')) return 'Re-tag'
  return program
}

/**
 * The programme facet — all three, in the client's curated order (gh#180).
 *
 * Keyed on the **slug**, because that is what goes in the URL and what
 * `pages/[program].vue` already links here with (`/insights?area=<slug>`); the
 * *name* is what the entity carries, and the two are bridged by
 * `programBySlug` in `filtered` below, exactly as the frozen page bridges them.
 */
const programFilters: Filter[] = programs().map(program => ({
  key: program.slug,
  label: shortProgram(program.name)
}))

/**
 * One query value, normalised.
 *
 * `route.query` is `string | string[] | null` per key — a repeated parameter
 * (`?format=report&format=video`) arrives as an array. The first value wins
 * rather than the whole array being stringified into a filter that can never
 * match; an empty string is the same as absent, so `?format=` is not a facet.
 */
const readQuery = (key: string): string | undefined => {
  const raw = route.query[key]
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' && value !== '' ? value : undefined
}

const selectedFormat = computed<string | undefined>(() => readQuery('format'))
const selectedArea = computed<string | undefined>(() => readQuery('area'))

/**
 * `?archive=1` — the frozen page's third facet, kept as **URL state without a
 * control**.
 *
 * No chip writes it any more: archived items have their own route (issue 55)
 * and the Filters band links there instead. It is still read, and still carried
 * across every facet toggle by `linkWith`, so a bookmarked or hand-written
 * wireframe-era URL keeps working and the spec's three query keys stay true.
 */
const includeArchived = computed<boolean>(() => readQuery('archive') !== undefined)

/**
 * The next location for a facet change — the frozen page's `linkWith()`,
 * unchanged apart from its path.
 *
 * Merges the patch over the current query, drops empty values, and **drops a
 * key whose patched value equals the current one**: clicking the active chip
 * clears it. That last clause is the toggle, and it is why this is a helper
 * rather than an object spread at each call site.
 */
const linkWith = (patch: Record<string, string | undefined>) => {
  const current = route.query as Record<string, string | undefined>
  const next: Record<string, string> = {}

  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value && !(key in patch && current[key] === patch[key])) next[key] = value
  }

  return { path: '/insights', query: next }
}

/**
 * A facet's selection, as the array `bfFilterBar` is driven with.
 *
 * `[]` or one key — never more, because the URL holds one value per facet.
 */
const asSelection = (key: string | undefined): string[] => (key ? [key] : [])

/**
 * One facet changed. `selection` is the component's **new** array.
 *
 * The key that is not the current one is the one just added; its absence means
 * the current one was just removed. Either way at most one survives into the
 * URL, and the navigation is what re-renders the page.
 */
const onFacet = (facet: 'format' | 'area', selection: string[]) => {
  const current = facet === 'format' ? selectedFormat.value : selectedArea.value
  return navigateTo(linkWith({ [facet]: selection.find(key => key !== current) }))
}

/** Is any facet active? Drives the "Clear filters" link, as in the wf source. */
const hasFilters = computed<boolean>(() =>
  Boolean(selectedFormat.value) || Boolean(selectedArea.value) || includeArchived.value
)

/**
 * How many rows are on the page. The frozen page's number and its increment.
 *
 * Reset on every filter change: this component is not unmounted when the query
 * changes, so a reader who loaded 120 rows and then narrowed to a facet with 30
 * would otherwise see every one of them and no "load more" — the paging would
 * silently mean something different after a filter than before it.
 */
const visible = ref(24)
watch(() => route.fullPath, () => { visible.value = 24 })

/**
 * The pool, filtered — the frozen page's expression, ported clause for clause.
 *
 * The format test is the odd-looking one and it is deliberate: `format` is a
 * pipe-joined string (`article|opinion`), the primary format is the segment
 * before the first pipe, an absent format counts as `article`, and a row whose
 * *secondary* format is `article` is included in Articles as well. That is what
 * the client sees on the wireframe, so it is what this renders.
 *
 * `programBySlug` bridges the URL's slug to `Insight.program`, which holds the
 * display **name**.
 */
const filtered = computed<Insight[]>(() => {
  const pool = includeArchived.value ? [...active, ...archived] : active
  const format = selectedFormat.value
  const areaName = selectedArea.value ? programBySlug(selectedArea.value)?.name : undefined

  return pool.filter(insight =>
    (
      !format
      || (insight.format ?? 'article').split('|')[0] === format
      || (format === 'article' && (insight.format ?? '').includes('article'))
    )
    && (!areaName || insight.program === areaName)
  )
})

/**
 * What the empty state says.
 *
 * Two different situations reach it and they need different sentences: a facet
 * combination that matched nothing (offer the way back to the unfiltered feed)
 * and a feed that is genuinely empty (do not blame filters the reader has not
 * set, and do not offer a link to the page they are already on). The second is
 * unreachable with today's content and is one deploy of an empty collection
 * away from being the first thing a visitor sees.
 */
const emptyState = computed(() => hasFilters.value
  ? {
      heading: 'No insights match those filters',
      message: 'Clearing one of them will widen the results.',
      backLabel: 'Clear filters',
      backTo: '/insights'
    }
  : {
      heading: 'No insights published yet',
      message: 'There is nothing in the feed at the moment. Please check back.',
      backLabel: undefined,
      backTo: undefined
    })

/** The rows actually rendered, and the two counts `bfLoadMore` announces. */
const shown = computed<Insight[]>(() => filtered.value.slice(0, visible.value))
const remaining = computed<number>(() => Math.max(filtered.value.length - visible.value, 0))
</script>

<template>
  <!--
    No wrapper element: `bf-default`'s `<main class="stack" data-gap="xl">` is
    this page's own stack, and a `<div>` here would collapse the three bands
    into one stack child.
  -->

  <!--
    Zone 1 — the feed header. `heading` and `tagline` come from `pages.json`'s
    `insights` row; the fallback is the frozen page's own.

    **The trail is two entries, not the frozen source's one** — residual
    [#186's sibling, #188](https://github.com/ccmdesign/bfna-website-migration-2/issues/188).
    `bfBreadcrumb` (#20) treats the *last* crumb as the current page and never
    links it, positionally, whether or not it carries a `to`. A one-entry
    `[{ label: 'Home', to: '/' }]` trail is therefore all-last, and this page
    was shipping `<span aria-current="page">Home</span>`: a breadcrumb telling
    the reader they are on the homepage while they are on the feed, with the
    `to: '/'` silently dropped and no link anywhere in it. Naming this page as
    the final, unlinked crumb restores Home to a real `<a href="/">` and puts
    `aria-current="page"` where it belongs — the same two-then-current shape
    `/projects` (#51) and both detail routes already build.
  -->
  <bfPageHeader
    label="Insights feed"
    :crumbs="[{ label: 'Home', to: '/' }, { label: feedPage?.heading ?? 'Insights' }]"
    :heading="feedPage?.heading ?? 'Insights'"
    :tagline="feedPage?.description"
  />

  <!--
    Zone 2 — the facets.

    Each bar gets a **visible** caption and points its accessible name at it
    with `aria-labelledby`, which wins over `bfFilterBar`'s own `aria-label` by
    the ARIA name-computation order (the component documents exactly this call
    site). Two bars on one page must not both announce as "Filters".

    `:model-value` + `@update:model-value` rather than `v-model`: the state is
    the URL, so the write is a navigation, not an assignment.
  -->
  <bfSection label="Filters" gap="s">
    <div class="cluster" data-gap="xs">
      <span id="insights-facet-format">Format:</span>
      <bfFilterBar
        aria-labelledby="insights-facet-format"
        label="Format"
        :filters="FORMATS"
        :model-value="asSelection(selectedFormat)"
        @update:model-value="selection => onFacet('format', selection)"
      />
    </div>

    <div class="cluster" data-gap="xs">
      <span id="insights-facet-program">Program:</span>
      <bfFilterBar
        aria-labelledby="insights-facet-program"
        label="Program"
        :filters="programFilters"
        :model-value="asSelection(selectedArea)"
        @update:model-value="selection => onFacet('area', selection)"
      />
    </div>

    <!--
      The archive, and the way out of a filtered view. The archive link
      replaces the wireframe's inline `?archive=1` toggle — same counter, same
      wording as the one `pages/[program].vue` already ships.
    -->
    <div class="cluster" data-gap="xs">
      <bfButton to="/archive">
        Include archived ({{ archived.length }}) →
      </bfButton>
      <bfButton v-if="hasFilters" to="/insights">
        Clear filters
      </bfButton>
    </div>
  </bfSection>

  <!--
    Zone 3 — the results.

    `bfGridInsights` brings its own `.grid[data-min-width]` (D9); this page
    names no column count. `headingLevel` 3 keeps the card headings under the
    band's `<h2>` (BRIEF §5 rule 9) — the wrapper's default, stated so the next
    reader does not have to know that.
  -->
  <bfSection label="Results">
    <p>
      <strong>{{ filtered.length }}</strong> items<span v-if="includeArchived"> (including archive)</span>
    </p>

    <template v-if="filtered.length">
      <bfGridInsights :insights="shown" :heading-level="3" />

      <!--
        The label carries the remainder, as the frozen page's button does — the
        arithmetic is the caller's and the component takes the finished string.
        The two counts drive its live region, so a load announces what arrived
        instead of appending items silently below the control.
      -->
      <bfLoadMore
        :has-more="remaining > 0"
        :label="`Load more (${remaining} remaining)`"
        :visible-count="shown.length"
        :total-count="filtered.length"
        @load="visible += 24"
      />
    </template>

    <!--
      Nothing matched. `heading-level="2"` because `bfPageHeader` above already
      owns this page's `<h1>` — residual #173, and the reason `bfEmptyState`
      grew the prop.
    -->
    <bfEmptyState
      v-else
      :heading-level="2"
      :heading="emptyState.heading"
      :message="emptyState.message"
      :back-label="emptyState.backLabel"
      :back-to="emptyState.backTo"
    />
  </bfSection>
</template>
