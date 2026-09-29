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
 * dependency on BF-157's toggle variant). The wireframe's third cluster stays
 * what it was: the `?archive=1` toggle, now an `aria-pressed` button rather
 * than a link styled as one, and the "Clear filters" link once any facet is
 * set. Browsing the archive on its own, by year, is `/archive` (issue 55).
 *
 * Everything else is the frozen page's, ported rather than redesigned: the
 * four formats, the toggle-by-URL behaviour, the `visible += 24` pagination,
 * and the count line with its "(including archive)" qualifier.
 *
 * ## The refined pass (Sep 2026)
 *
 * The page is read, not operated: a reader arrives to see what the
 * Foundation has published lately, narrows by format or programme, and
 * scans titles and dates. Three zones serve that, in that order — the
 * masthead, one toolbar of facets and status, and the feed.
 *
 * - **Masthead.** The paper ground every inner page header wears
 *   (`bfSection`'s `data-surface="paper"`), sized by the band's own padding.
 *   It replaces a 16:9 box that drew `bfMedia`'s crosshatch placeholder
 *   under the title, pushed the first card below a 1280 × 900 fold, and read
 *   as a broken image. A photograph on the `insights` page document still
 *   wins, under the navy scrim, exactly as on `bfPageHeader`.
 * - **Toolbar.** The two facets side by side, each under a quiet caption,
 *   and under them one status line: the count (`bfResultCount`, a live
 *   region, so a filter change is announced and not only repainted), the
 *   archive toggle, and "Clear filters" once there is something to clear.
 * - **Feed, by year.** The rows are grouped under a heading per publication
 *   year. A chronological feed of ~100 pieces (354 with the archive) is
 *   otherwise eight identical rows of cards with nothing to hold on to; the
 *   year is the one thing every reader already uses to place a piece, and
 *   `/archive` groups the same records the same way. It also gives the card
 *   headings the `<h2>` they are ranked under: before this the page went
 *   `<h1>` straight to `<h3>` (BRIEF §5 rule 9).
 *
 * There is deliberately **no lead item**. The newest piece is usually a
 * text article (3 of the first 24 rows carry an image), so a full-width lead
 * would be a stretched text card, and promoting the newest *picture* instead
 * would put an editorial claim on the feed the data does not make. Featuring
 * is the home page's job (its Transponder lead and highlight cards); this
 * page stays a faithful, uniformly weighted index whose shape does not
 * change as the reader filters or loads more.
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
import { programChipLabel } from '~/utils/bf-card-program'

defineOptions({ name: 'InsightsIndexPage' })

definePageMeta({ layout: 'bf-default' })

const route = useRoute()

const { active, archived } = await useBfInsights()
const { programs, programBySlug } = await useBfPrograms()
const { pageBySlug } = await useBfPages()

/** The feed's own document — its heading and standfirst are content, not copy. */
const feedPage = pageBySlug('insights')

const heading = computed(() => feedPage?.heading ?? 'Insights')

/**
 * Two-then-current trail — residual #188. `bfBreadcrumb` treats the last
 * crumb as the current page and never links it, so a one-entry Home trail
 * would announce this page as the homepage.
 */
const crumbs = computed(() => [
  { label: 'Home', to: '/' },
  { label: heading.value }
])

/** The band's own title, added once by `bf-default`'s `titleTemplate`. */
useHead({ title: () => heading.value })


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
 * The programme facet — all three, in the client's curated order (gh#180),
 * each labelled with the site's one programme chip label
 * (`programChipLabel`, `utils/bf-card-program.ts`), so a facet chip and the
 * card chips under it name a programme the same way.
 *
 * Keyed on the **slug**, because that is what goes in the URL and what
 * `pages/[program].vue` already links here with (`/insights?area=<slug>`); the
 * *name* is what the entity carries, and the two are bridged by
 * `programBySlug` in `filtered` below, exactly as the frozen page bridges them.
 */
const programFilters: Filter[] = programs().map(program => ({
  key: program.slug,
  label: programChipLabel(program.name)
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
 * `?archive=1` — include archived rows in this feed.
 *
 * A toggle writes it. `linkWith` drops a key whose patched value equals the
 * current one, so passing `'1'` checks it on and unchecks it off.
 */
const includeArchived = computed<boolean>(() => readQuery('archive') !== undefined)

const onArchive = () => navigateTo(linkWith({ archive: '1' }))

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

/**
 * Is any facet active? Drives the toolbar's "Clear filters" link, as in the
 * wf source, and the empty state's wording below.
 */
const hasFilters = computed<boolean>(() =>
  Boolean(selectedFormat.value) || Boolean(selectedArea.value) || includeArchived.value
)

/**
 * The status line, for the one moment focus has to go somewhere: its count.
 * The ref is on the line's `<div>` rather than on `bfResultCount`, whose
 * template opens on a comment — in development its `$el` is that fragment's
 * anchor, not the `<p>`.
 */
const statusLine = ref<HTMLElement | null>(null)

/**
 * "Clear filters", then focus on the count (WCAG 2.4.3).
 *
 * The link exists only while a filter is on, so pressing it removes the
 * element that has focus, and a keyboard or screen-reader reader was dropped
 * onto `<body>` at the top of the page with no word about what changed.
 * `/search` had the same defect and settled it the same way (`clearFacets`).
 * Here focus goes to the result count: it is the toolbar's own statement of
 * the new state ("354 items"), it is never unmounted, and it sits right where
 * the link was, so the reader keeps their place in the toolbar. It carries
 * `tabindex="-1"` in the template — focusable from script, never a tab stop.
 *
 * The link stays a real link to `/insights`, so it works without JavaScript
 * and opens in a new tab on a modified click, which is left to the browser.
 */
const clearFilters = async (event: MouseEvent) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  event.preventDefault()
  await navigateTo('/insights')
  await nextTick()
  statusLine.value?.querySelector<HTMLElement>('.bf-result-count')?.focus()
}

/**
 * How many rows are on the page. The frozen page's number and its increment.
 *
 * Reset on every filter change: this component is not unmounted when the query
 * changes, so a reader who loaded 120 rows and then narrowed to a facet with 30
 * would otherwise see every one of them and no "load more" — the paging would
 * silently mean something different after a filter than before it.
 */
const PAGE_SIZE = 24

const visible = ref(PAGE_SIZE)
watch(() => route.fullPath, () => { visible.value = PAGE_SIZE })

/**
 * Newest first, undated last — `useBfInsights`' own comparator, restated
 * because the composable does not export it. Both lists arrive already in
 * this order; it is re-applied only to their concatenation, below.
 */
const byNewest = (a: Insight, b: Insight) =>
  (b.publish_date ?? '').localeCompare(a.publish_date ?? '')

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
 *
 * The one departure is the archive pool's order. The frozen page appends the
 * archive after the active list, which put the active list's three undated
 * rows between 2023 and 2022 and split 2023 in two; under year headings that
 * reads as two "2023" groups. So the combined pool is sorted once more,
 * newest first. The rows are the same and so is every count; only the
 * interleaving of the one year both lists share changes.
 */
const filtered = computed<Insight[]>(() => {
  const pool = includeArchived.value ? [...active, ...archived].sort(byNewest) : active
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

/**
 * Does this result paginate at all? `bfLoadMore` keeps an inert, focusable
 * button once the last page is in (gh#225), so focus resting on it survives
 * the final load. A result that fits on the first page never had a control
 * to rest on, and there the inert "Load more (0 remaining)" was a dead
 * button under nineteen reports. So it mounts only for a result longer than
 * one page, and then stays for as long as that result is on screen.
 */
const paginates = computed<boolean>(() => filtered.value.length > PAGE_SIZE)

/** One year of the feed: its heading, the id the list is named by, its rows. */
interface YearGroup {
  key: string
  label: string
  id: string
  insights: Insight[]
}

/**
 * The rendered rows, cut into runs of one publication year.
 *
 * A single pass over `shown`, which is already newest first, so a new group
 * starts wherever the year changes and a year never appears twice. It groups
 * the **rendered** rows, not the whole result: a "Load more" that lands
 * mid-year extends the last group rather than opening a second one, and the
 * pagination arithmetic above is untouched.
 *
 * A row with no `publish_date` (three in the active feed today, all at the
 * end) goes under "Undated" rather than under a year it was never given.
 *
 * The id is derived from the year, not from `useId()`: it is a stable,
 * readable fragment (`#insights-2025`), unique on the page because years
 * are, and identical on the server and the client by construction.
 */
const byYear = computed<YearGroup[]>(() => {
  const groups: YearGroup[] = []

  for (const insight of shown.value) {
    const year = insight.publish_date?.slice(0, 4)
    const key = year ?? 'undated'
    let group = groups.at(-1)

    if (!group || group.key !== key) {
      group = { key, label: year ?? 'Undated', id: `insights-${key}`, insights: [] }
      groups.push(group)
    }

    group.insights.push(insight)
  }

  return groups
})
</script>

<template>
  <!--
    No wrapper element: `bf-default`'s `<main class="stack" data-gap="xl">` is
    this page's own stack, and a `<div>` here would collapse the three bands
    into one stack child.
  -->

  <!--
    Zone 1 — the masthead. The same band `bfPageHeader` builds for every other
    inner page — crumbs, `<h1>`, standfirst, directly in a `gap="s"` padded
    band — on the same ground, so `/insights`, `/archive` and `/search` open
    identically.

    The ground is the paper: `bfSection` draws it into its own `bleed` slot
    when the band carries `data-surface="paper"` and no layer is passed. A
    photograph on the `insights` page document (none today) replaces it,
    under the navy scrim, and the band inverts — which is why the attribute
    and the slot are both conditional on `feedPage.image`, and never both
    set: the paper's wash and ink are for paper only.
  -->
  <bfSection
    class="bf-insights-masthead"
    :class="{ 'bf-insights-masthead--media': Boolean(feedPage?.image) }"
    :data-scrim="feedPage?.image ? 'full' : undefined"
    :data-surface="feedPage?.image ? undefined : 'paper'"
    label="Insights feed"
    gap="s"
    padded
    aria-labelledby="insights-heading"
  >
    <template v-if="feedPage?.image" #bleed>
      <bfHeroMedia :src="feedPage.image" alt="" />
    </template>

    <bfBreadcrumb :items="crumbs" />
    <h1 id="insights-heading" class="bf-insights-masthead__heading">{{ heading }}</h1>
    <p v-if="feedPage?.description" data-measure="normal">
      {{ feedPage.description }}
    </p>
  </bfSection>

  <!--
    Zone 2 — the toolbar: facets, then one status line. One band, because
    the count and the archive toggle describe and change the same pool the
    chips do; the feed below is the next band, at the shell's step.

    Each bar gets a visible caption — `.bf-facet-caption`
    (`public/css/components/facet-caption.css`), the one `/search` and
    `/archive` wear — and points its accessible name at it with
    `aria-labelledby`, which wins over `bfFilterBar`'s own `aria-label`. Two
    bars on one page must not both announce as "Filters". `:model-value` +
    `@update:model-value`: the state is the URL.
  -->
  <bfSection class="bf-insights-toolbar" label="Filters" gap="m">
    <div class="cluster bf-insights-facets" data-gap="l">
      <div class="stack" data-gap="xs">
        <span id="insights-facet-format" class="bf-facet-caption">Format</span>
        <bfFilterBar
          aria-labelledby="insights-facet-format"
          label="Format"
          tone="format"
          :filters="FORMATS"
          :model-value="asSelection(selectedFormat)"
          @update:model-value="selection => onFacet('format', selection)"
        />
      </div>

      <div class="stack" data-gap="xs">
        <span id="insights-facet-program" class="bf-facet-caption">Program</span>
        <bfFilterBar
          aria-labelledby="insights-facet-program"
          label="Program"
          tone="program"
          :filters="programFilters"
          :model-value="asSelection(selectedArea)"
          @update:model-value="selection => onFacet('area', selection)"
        />
      </div>
    </div>

    <!--
      The status line. `bfResultCount` rather than a bare `<p>`: it is a live
      region, mounted in every state, so the new count is announced when a
      chip narrows the feed — the chip itself only announces "pressed".

      The toggle is a real toggle button (`aria-pressed`) drawn as the
      checkbox it behaves like: an empty box off, a filled box with a tick on.
      The glyph used to be a tick when the archive was *excluded* and a cross
      when it was included, which is the opposite of what either mark means.
    -->
    <div ref="statusLine" class="cluster bf-insights-status" data-gap="m">
      <bfResultCount
        tabindex="-1"
        :count="filtered.length"
        noun="item"
        :suffix="includeArchived ? ' (including archive)' : ''"
      />

      <button
        type="button"
        class="bf-insights-action bf-insights-archive"
        :aria-pressed="includeArchived"
        @click="onArchive"
      >
        <svg
          class="bf-insights-archive__icon"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <rect
            class="bf-insights-archive__box"
            x="1.75"
            y="1.75"
            width="12.5"
            height="12.5"
            rx="3"
          />
          <path
            class="bf-insights-archive__tick"
            d="M4.75 8.25 7 10.5l4.25-5"
          />
        </svg>
        Include archived ({{ archived.length }})
      </button>

      <!--
        `aria-current="false"`: the router matches on path alone, so from any
        filtered URL this link counts as exact-active and would be announced
        as "current page". Reaching it means the page is not `/insights`
        unfiltered, so it never is. `@click` moves focus to the count once
        the filters are gone (`clearFilters`).
      -->
      <NuxtLink
        v-if="hasFilters"
        class="bf-insights-action"
        to="/insights"
        aria-current="false"
        @click="clearFilters"
      >Clear filters</NuxtLink>
    </div>
  </bfSection>

  <!--
    Zone 3 — the feed, one group per publication year (see `byYear`).

    Each year is a plain `<section>` with its own `<h2>`, and its list is
    named by that heading (`aria-labelledby` reaches `bfGridInsights`' `<ul>`
    through `$attrs`): "2025, list, 15 items". The sections carry no
    accessible name of their own on purpose — a named `<section>` is a
    `region` landmark, and a landmark per year (seventeen with the archive)
    would bury the page's real landmarks. The headings are the navigation.

    `bfGridInsights` at its own `l` floor, 300px: three tracks at the 1100px
    measure — Paper's "Grid 2 — thirds" (node `1A-0`, 347px cards) and the
    home page's insight rows. It makes its media decision per call, so each
    year is a picture grid only when every row in it has a picture.
    `headingLevel` 3 puts the card headings under the year's `<h2>`.
  -->
  <bfSection class="bf-insights-feed" label="Results" gap="l">
    <template v-if="filtered.length">
      <div class="stack" data-gap="2xl">
        <section
          v-for="group in byYear"
          :key="group.key"
          class="bf-insights-year stack"
          data-gap="m"
        >
          <h2 :id="group.id" class="bf-insights-year__heading">{{ group.label }}</h2>
          <bfGridInsights
            :insights="group.insights"
            :heading-level="3"
            :aria-labelledby="group.id"
          />
        </section>
      </div>

      <!--
        The label carries the remainder, as the frozen page's button does — the
        arithmetic is the caller's and the component takes the finished string.
        The two counts drive its live region, so a load announces what arrived
        instead of appending items silently below the control. It sits a step
        under the last grid, closer than the years sit to each other, so it
        reads as the end of this list rather than the start of another.
        Only on a result that paginates — see `paginates`.
      -->
      <bfLoadMore
        v-if="paginates"
        :has-more="remaining > 0"
        :label="`Load more (${remaining} remaining)`"
        :visible-count="shown.length"
        :total-count="filtered.length"
        @load="visible += PAGE_SIZE"
      />
    </template>

    <!--
      Nothing matched. `heading-level="2"` because the masthead above already
      owns this page's `<h1>` — residual #173, and the reason `bfEmptyState`
      grew the prop.

      In a `<section>` of its own, like each year: every `<h2>` in this band
      heads its own section. Directly in the band, the reply's heading made
      `bfSection`'s dev check read the unnamed band as one that forgot its
      name; it is a reply to the toolbar, not the band's title.
    -->
    <section v-else class="bf-insights-empty">
      <bfEmptyState
        :heading-level="2"
        :heading="emptyState.heading"
        :message="emptyState.message"
        :back-label="emptyState.backLabel"
        :back-to="emptyState.backTo"
      />
    </section>
  </bfSection>
</template>

<style>
/*
  Page rules, in `@layer components` beside the bands and cards they tune,
  so they outrank `@layer composition` (the stack's margins) by layer and
  meet each component's own rules on specificity. Tokens only, no `:not()`
  (D-20.5). The paper ground has no rule here: it is `bfSection`'s.
*/
@layer components {
  /*
    ## Masthead

    The title's step, as `bfPageHeader` writes it for every other header: the
    trail is about the page, the `<h1>` is the page, and the band's
    `--space-s` set the two as one run of type.
  */
  .bf-insights-masthead .bf-insights-masthead__heading {
    margin-block-start: var(--space-m);
  }

  /*
    The photograph ground only (dormant until the page document has an
    image). The containing block `bfHeroMedia` needs, the inverted ink, and
    the breadcrumb's two private hooks — separator and focus ring — which an
    inherited colour cannot reach. Three classes, so the hooks beat
    `bfBreadcrumb`'s own scoped rule on specificity rather than on chunk
    order; `bfPageHeader` writes the same pair.
  */
  .bf-insights-masthead--media {
    position: relative;
    isolation: isolate;
    color: var(--color-text-inverse);
  }

  .bf-insights-masthead.bf-insights-masthead--media .bf-breadcrumb {
    --_bf-breadcrumb-separator-color: var(--color-text-inverse);
    --_bf-breadcrumb-focus-color: var(--color-text-inverse);
  }

  .bf-insights-masthead--media :focus-visible {
    outline-color: var(--color-text-inverse);
  }

  /*
    ## Toolbar

    The facet captions are the shared `.bf-facet-caption`
    (`public/css/components/facet-caption.css`), in `bfResultCount`'s
    secondary voice; the three list templates set them alike.

    The facet rows keep their tops aligned when the Program row wraps under
    Format on a narrow screen, and the status line sits on one baseline.
  */
  .bf-insights-facets {
    align-items: start;
    row-gap: var(--space-m);
  }

  .bf-insights-status {
    align-items: center;
    row-gap: var(--space-2xs);
  }

  .bf-insights-status .bf-result-count {
    margin: 0;
  }

  /*
    The two text controls — the archive toggle and "Clear filters" — in the
    voice of `bfLoadMore` and the home page's "All … →" links: 14/18 medium,
    the link blue, no box, and sentence case like them.

    `min-block-size` keeps a 24px target (WCAG 2.5.8) around 18px of type;
    `1.5rem` because the space scale has no fixed 24px step.
  */
  .bf-insights-action {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3xs);
    min-block-size: 1.5rem;
    padding: 0;
    border: 0;
    background: none;
    color: var(--color-link);
    font-family: var(--font-family-ui);
    font-size: 0.875rem;
    font-weight: var(--font-weight-medium);
    line-height: 1.125rem;
    text-decoration-line: none;
    text-decoration-thickness: var(--border-width-thin);
    text-underline-offset: 0.2em;
    cursor: pointer;
  }

  .bf-insights-action:hover {
    text-decoration-line: underline;
  }

  /*
    The checkbox glyph. Off: an outlined box in the label's blue. On: the
    box fills with it and a tick in the page ground appears inside. Stroke
    and fill come from `currentcolor`, so the glyph follows the label.
  */
  .bf-insights-archive__icon {
    flex: none;
    inline-size: 1.1em;
    block-size: 1.1em;
  }

  .bf-insights-archive__box {
    fill: transparent;
    stroke: currentcolor;
    stroke-width: 1.5;
    transition: fill 160ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .bf-insights-archive__tick {
    fill: none;
    stroke: var(--color-surface-page);
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0;
    transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .bf-insights-archive[aria-pressed="true"] .bf-insights-archive__box {
    fill: currentcolor;
  }

  .bf-insights-archive[aria-pressed="true"] .bf-insights-archive__tick {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .bf-insights-archive__box,
    .bf-insights-archive__tick {
      transition: none;
    }
  }

  /*
    ## Feed

    The year opens its group on a hairline — the archive rows' own rule —
    with the year set as the band heading it is, in lining figures so
    "2019" does not dip below "2026". More space above a year (`2xl`, the
    group gap) than between the year and its cards (`m`), so each year
    reads as the head of what follows, not the tail of what came before.
  */
  .bf-insights-year__heading {
    padding-block-start: var(--space-s);
    border-block-start: var(--border-width-thin) solid var(--color-base-super-light);
    font-variant-numeric: lining-nums;
  }
}
</style>
