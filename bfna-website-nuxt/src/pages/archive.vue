<script setup lang="ts">
/**
 * `/archive` — the archive index (issue 55 / gh#64).
 *
 * Descends from `src/pages/wireframes/archive.vue`, which is frozen (D2): its
 * structure, its year-grouping arithmetic and its count/range sentence are
 * ported below, and nothing here imports from it.
 *
 * ## The route is singular, and this file retires nothing
 *
 * The legacy route is `/archives` (plural) and it still exists after this
 * issue: the redirect `/archives → /archive` is **#57**'s job and deleting
 * `pages/archives/index.vue` is **#58**'s. So unlike `/search` (#63), this
 * template takes a route no page currently owns, and
 * `02-legacy-retirement-inventory.md` §E names no file for it to delete. Two
 * routes serve archive content until #57 lands; that is the phase order, not
 * an oversight.
 *
 * ## What this page owns
 *
 * **The grouping**, and since the refined pass (Sep 2026) the two ways into
 * it. `useBfInsights().archived` arrives already filtered and already sorted
 * newest-first; this page buckets it by calendar year and hands each bucket to
 * a `bfAccordion`. The spec puts the grouping here rather than in the
 * composable, and the composable's own header says why — it is thin by
 * design, one `queryCollection` plus filters, with no synthesis in it.
 *
 * The refined pass gave the index a hierarchy it did not have. Before it, the
 * page was one open year of 27 rows and ten closed years below the fold, each
 * a body-size `2023 (27)` line: nothing said how far back the archive went,
 * or what it held, until the reader had scrolled past a year they might not
 * want. Now, in reading order:
 *
 * 1. **A format facet** (`?format=`), the same four formats and the same
 *    `bfFilterBar` skin `/insights` uses — 127 articles, 57 videos,
 *    52 infographics and 20 reports is a second axis the data carries, and
 *    "the old videos" is a question a visitor actually asks. It narrows every
 *    year at once; years with nothing left drop out.
 * 2. **A year index** — every year the (filtered) archive covers, with its
 *    count, as one line of links at the head of the band. It is the page's
 *    overview: the span, and where the weight is, before any row. A link
 *    jumps to its year and opens it; a year the reader has open is marked.
 * 3. **The years**, their summaries set in the display face as the band's
 *    sub-heads rather than as body text.
 *
 * Everything drawn is a component that already exists: `bfPageHeader` (#38),
 * `bfSection` (#39), `bfFilterBar` (#30), `bfResultCount` (gh#226),
 * `bfAccordion` (#31) and `bfCardRow` (#27). The stylesheet at the foot of
 * this file draws the year index, which is this page's own markup,
 * retunes `bfAccordion` through its hooks, and gives the rows' chips a
 * fixed track through `bfCard`'s hook so the titles line up; nothing else.
 *
 * ## The disclosure is native, and stays native
 *
 * `bfAccordion` is a skin over `<details>`/`<summary>`, so "every accordion is
 * keyboard-operable" is the browser's guarantee rather than a behaviour this
 * page wires: Enter and Space activate a focused `<summary>`, and a closed
 * `<details>` keeps its 20-odd rows out of the tab order without a `tabindex`
 * anywhere.
 *
 * What this page *does* wire, since gh#228, is the state: `bfAccordion`'s
 * `open` is two-way, and `openYears` below holds what the reader chose. It
 * used to say here that "once a reader has toggled a year, nothing here
 * overwrites their choice" — which was true only for as long as nothing
 * re-created the subtree. Now it is true because the page can answer the
 * question, not because nobody asks it.
 *
 * That is also why ten of the eleven bands being closed on load is cheap: the
 * cost of 256 rows in one document is DOM weight, not layout or tab stops.
 * There is no pagination (spec § Out of scope).
 */
import type { Filter, Insight } from '~/types/bf-contracts'
import { useBfInsights } from '~/composables/data/useBfInsights'
import { useBfPages } from '~/composables/data/useBfPages'

defineOptions({ name: 'ArchivePage' })

definePageMeta({ layout: 'bf-default' })

const route = useRoute()

const { archived } = await useBfInsights()
const { pageBySlug } = await useBfPages()

const indexPage = pageBySlug('archive')

useHead({ title: indexPage?.heading ?? 'Archive' })

/* --- the format facet ---------------------------------------------------- */

/**
 * The four formats, the same `Filter`s `/insights` and `/search` build, in the
 * same order — they are the four values `Insight.format` takes.
 */
const FORMATS: Filter[] = [
  { key: 'article', label: 'Articles' },
  { key: 'report', label: 'Reports' },
  { key: 'video', label: 'Videos' },
  { key: 'infographic', label: 'Infographics' }
]

/**
 * A row's format, as `/search` reads it: the first of a `|`-joined pair, and
 * `article` when the field is empty — `formatLabel`'s own fallback, so the
 * facet and the chip on the row always agree.
 */
const formatOf = (item: Insight): string => (item.format ?? 'article').split('|')[0] ?? ''

/**
 * `?format=`, normalised: one value, and only one of the four. A key this page
 * does not know filters nothing, rather than emptying the archive — the same
 * forgiving reading `/insights` gives an unknown `area`.
 */
const selectedFormat = computed<string | undefined>(() => {
  const raw = route.query.format
  const value = Array.isArray(raw) ? raw[0] : raw
  return FORMATS.some(format => format.key === value) ? (value as string) : undefined
})

/** The rows every band below is built from: the archive, or one format of it. */
const shown = computed<Insight[]>(() => {
  const format = selectedFormat.value
  return format ? archived.filter(item => formatOf(item) === format) : archived
})

/**
 * Single-select, as on `/insights` and `/search`: `bfFilterBar` emits the full
 * new selection, so the key that is not the current one is the one just
 * switched on, and an empty selection is the current one switched off.
 *
 * The URL is the state, so the filtered archive is a link a reader can send.
 * The hash is dropped with the old view: a `#archive-2016` for a year the new
 * format may not have would point at nothing.
 */
const onFormat = (selection: string[]) => {
  const format = selection.find(key => key !== selectedFormat.value) ?? selection[0]
  return navigateTo({ path: '/archive', query: format ? { format } : {} })
}

/**
 * The noun a count of this view is in — "pieces" for the whole archive (the
 * header's own word), the format's own word when one is chosen.
 */
const noun = computed<string>(() => selectedFormat.value ?? 'piece')

const nounFor = (n: number): string => (n === 1 ? noun.value : `${noun.value}s`)

const countLabel = (n: number): string => `${n} ${nounFor(n)}`

/** One calendar year and the archived items published in it. */
interface ArchiveYear {
  year: string
  items: Insight[]
}

/**
 * The buckets, keyed by `publish_date.slice(0, 4)` — the frozen source's own
 * expression, `'Undated'` fallback included.
 *
 * No archived row carries a null `publish_date` in the current snapshot (all
 * 256 have one; the three null-date rows in the collection are *active*, per
 * BF-218), so the `'Undated'` branch renders nothing today. It is kept because
 * it costs one `??` and because an archived row with no date is a content edit
 * away, not an impossibility — and an ungrouped item would otherwise vanish
 * from a page whose entire promise is that nothing is deleted.
 *
 * A `Map` rather than an object literal so the keys stay strings and cannot
 * collide with anything on `Object.prototype`. Insertion order is irrelevant:
 * the sort below is total.
 */
const UNDATED = 'Undated'

const bucket = (rows: Insight[]): ArchiveYear[] => {
  const byYear = new Map<string, Insight[]>()

  for (const item of rows) {
    const year = item.publish_date?.slice(0, 4) ?? UNDATED
    const bucket = byYear.get(year)
    if (bucket) bucket.push(item)
    else byYear.set(year, [item])
  }

  /*
   * Descending by year, with `Undated` forced **last**.
   *
   * The frozen source sorts with a bare `b.year.localeCompare(a.year)`, which
   * puts `'Undated'` first — `'U'` sorts above `'2'` — and that one detail is
   * load-bearing here in a way it is not in the wireframe, where the bucket is
   * likewise empty. `years[0]` is both the band opened by default and the
   * newest end of the range sentence below, so a single undated row would
   * silently open a band called "Undated" and print the range as
   * "2007–Undated". Ordering the bucket last keeps both statements true for
   * any data the collection can hold. Recorded in this issue's Decisions.
   */
  return [...byYear.entries()]
    .map(([year, items]) => ({ year, items }))
    .sort((a, b) => {
      if (a.year === UNDATED) return 1
      if (b.year === UNDATED) return -1
      return b.year.localeCompare(a.year)
    })
}

/** The bands on screen: the current view, bucketed. */
const years = computed<ArchiveYear[]>(() => bucket(shown.value))

/**
 * The whole archive, bucketed — for the header's sentence only, which is a
 * fact about the archive and does not change with the facet.
 */
const allYears = computed<ArchiveYear[]>(() => bucket(archived))

/**
 * The count/range sentence, as the frozen source writes it: the oldest and
 * newest years that actually exist, not a hardcoded span.
 *
 * `Undated` is excluded from both ends — it is not a year and cannot bound a
 * range — which is the second half of the sort decision above.
 */
const datedYears = computed<string[]>(() =>
  allYears.value.map(y => y.year).filter(year => year !== UNDATED)
)

const newestYear = computed<string | undefined>(() => datedYears.value[0])
const oldestYear = computed<string | undefined>(
  () => datedYears.value[datedYears.value.length - 1]
)

/**
 * Which bands the reader has opened or closed, by year (gh#228).
 *
 * `bfAccordion`'s `open` is two-way now, and this is the state it hands back
 * to. Until gh#228 nothing on this page held it: the disclosure lived only in
 * the DOM, so any render that re-created the subtree — a keyed list whose keys
 * move, a `v-if`, a `<Suspense>` re-run — remounted a fresh `<details>` and
 * wrote `year === years[0]` back over a reader who had opened 2014. A
 * disclosure closing under a reader who did not ask for it is WCAG 3.2.2.
 *
 * Keyed by `year.year` — a string, and already the `v-for` key — rather than
 * by object identity, so a `years` recomputation that produces fresh bucket
 * objects does not throw the record away. A partial record, not a
 * pre-populated one: a year absent from it has never been touched, and falls
 * back to the frozen source's own rule.
 */
const openYears = ref<Record<string, boolean>>({})

/**
 * A stored `false` is a value the reader chose and must outrank the default, so
 * this cannot be a `||`.
 *
 * Nor a bare `??`. `openYears` is an object indexed by an arbitrary content
 * string, and `years` above is a `Map` for exactly this reason — "so the keys
 * stay strings and cannot collide with anything on `Object.prototype`". A bucket
 * called `toString` would make `openYears.value[year.year]` a *function*, which
 * `??` passes straight through as the band's `open`. Reading the type instead of
 * the nullishness closes that off: only a boolean this page wrote is a stored
 * answer, and everything else falls back.
 *
 * The default is the frozen source's `:open="y === years[0]"` — identity against
 * the first bucket, unchanged.
 */
const isYearOpen = (year: ArchiveYear): boolean => {
  const stored = openYears.value[year.year]
  return typeof stored === 'boolean' ? stored : year === years.value[0]
}

/**
 * A new object rather than a mutation, so the `v-for` re-renders and every
 * band's `:open` is re-evaluated from one source of truth.
 *
 * This cannot loop: the write only reaches here from a native `toggle`, which
 * the browser fires only when `details.open` actually changed, and the value
 * stored is the one the element already holds — so the re-render writes
 * `el.open = <same>`, which changes nothing and fires no second `toggle`.
 */
const setYearOpen = (year: ArchiveYear, open: boolean): void => {
  openYears.value = { ...openYears.value, [year.year]: open }
}

/* --- the year index ------------------------------------------------------ */

/**
 * A band's fragment id — `archive-2016`, `archive-undated`. Prefixed, because
 * a bare `2016` is not a valid selector and an id is also a selector.
 */
const yearId = (year: ArchiveYear): string => `archive-${year.year.toLowerCase()}`

/**
 * An index link opens its year and lets the browser do the rest.
 *
 * It is an ordinary `href="#archive-…"`, so without script it still jumps to
 * the year's band; the handler only adds the opening. The jump lands on the
 * summary, which sits at the band's top edge whether or not it is open, so
 * opening it after the browser has measured the target moves nothing.
 * `base/reset.css`'s `:target` margin, which reads the sticky top bar's
 * published height, keeps the summary clear of the bar.
 *
 * Recorded through `setYearOpen`, the one path the accordions' own toggles
 * use, so an index jump and a click on the summary are the same fact.
 */
const openFromIndex = (year: ArchiveYear): void => setYearOpen(year, true)

/**
 * A deep link to a year opens it. Only after mount: the server never sees a
 * fragment, so opening during setup would hydrate an `open` the prerendered
 * HTML does not have.
 */
onMounted(() => {
  const target = route.hash.slice(1)
  const year = years.value.find(y => yearId(y) === target)
  if (year) setYearOpen(year, true)
})

</script>

<template>
  <!--
    No wrapper element: `bf-default`'s `<main class="stack" data-gap="xl">` is
    this page's own stack, and a `<div>` here would collapse both bands into a
    single stack child.
  -->

  <!--
    The header. `crumbs` is the spec's `Home → Insights` trail plus a third,
    **`to`-less** node naming this page — `bfBreadcrumb` marks the current page
    by the absence of `to`, and without that node the trail would end on a link
    to `/insights`, a page the reader is not on, with `aria-current="page"`
    landing there. The same two-then-current shape `/insights`, `/projects` and
    both detail routes already build.

    The default slot carries the count/range line, exactly as the frozen source
    does, at the `narrow` measure it uses — with the two guards the frozen
    source has no need of, because it renders a fixed snapshot and this renders
    whatever the collection holds. An empty archive prints no sentence rather
    than "0 pieces of past work, –.", and the range clause appears only when
    there are dated years to bound it, so an all-undated archive prints the
    count alone. Neither branch is reachable with today's data (256 rows, all
    dated); both are one `v-if` and remove a sentence that would otherwise be
    false.
  -->
  <bfPageHeader
    label="Archive index"
    :crumbs="[
      { label: 'Home', to: '/' },
      { label: 'Insights', to: '/insights' },
      { label: 'Archive' }
    ]"
    :heading="indexPage?.heading ?? 'Archive'"
    :tagline="indexPage?.description"
  >
    <p v-if="archived.length" data-measure="narrow">
      {{ archived.length }} pieces of past work<template
        v-if="oldestYear && newestYear"
      >, {{ oldestYear }}–{{ newestYear }}</template>.
    </p>
  </bfPageHeader>

  <!--
    The facet band — the `/insights` arrangement: a visible caption the bar
    takes its accessible name from, then the count of what is showing.

    The count is `bfResultCount`, the always-mounted live region (D29), so a
    reader who switches the facet hears "57 videos" rather than nothing. It
    reports `null` — an empty region, not a missing one — while the whole
    archive is showing, because the header already says "256 pieces" and a
    second "256 pieces" under it would be the same sentence twice.
  -->
  <bfSection label="Filters" gap="s">
    <div class="bf-archive-facets | cluster" data-gap="m">
      <div class="stack" data-gap="xs">
        <span id="archive-facet-format" class="bf-facet-caption">Format</span>
        <bfFilterBar
          aria-labelledby="archive-facet-format"
          label="Format"
          tone="format"
          :filters="FORMATS"
          :model-value="selectedFormat ? [selectedFormat] : []"
          @update:model-value="onFormat"
        />
      </div>
      <bfResultCount
        class="bf-archive-count"
        :count="selectedFormat ? shown.length : null"
        :noun="noun"
      />
    </div>
  </bfSection>

  <!--
    The band. `heading` as well as `label`, which is one visible element more
    than the frozen source's `<wf-section label="By year">` — and is the same
    information, not a new one: `label` reaches the DOM as `data-label`, which
    the wireframe skin draws as a corner tag and finished `bf-*` chrome does
    not draw at all. Dropping to `label` alone would delete "By year" from the
    page and leave the 256 row headings at `h3` under an `<h1>` with no `<h2>`
    between them, which BRIEF §5 rule 9 forbids. Recorded in Decisions.
  -->
  <bfSection label="By year" heading="By year" gap="l">
    <!--
      The year index. A `<nav>`, because it is a set of links within the page
      and a reader should be able to reach it as one; named, because the page
      already has two navigation landmarks (the top bar, the breadcrumb).

      `<ol>`: the years are in an order, newest first, and it is the same
      order as the bands. `role="list"` for the WebKit reason given on the
      rows' list below.

      Each link's text is the year and its count, with the count's noun
      visually hidden — sighted readers get the number under the year, a
      screen reader "2016, 34 pieces" rather than "2016 34". The noun's
      leading space is part of the interpolated string, not template
      whitespace, which the compiler would condense away and leave "34pieces".

      `data-open` marks a year the reader has open, so the index doubles as a
      map of what is expanded below it. It is a visual echo of state the
      accordions already expose (`<details open>`), not a second source of
      truth.
    -->
    <nav
      v-if="years.length > 1"
      class="bf-archive-years"
      aria-label="Years in the archive"
    >
      <ol class="bf-archive-years__list" role="list">
        <li v-for="year in years" :key="year.year">
          <a
            class="bf-archive-years__link"
            :href="`#${yearId(year)}`"
            :data-open="isYearOpen(year) || undefined"
            @click="openFromIndex(year)"
          >
            <span class="bf-archive-years__year">{{ year.year }}</span>
            <span class="bf-archive-years__count"><span class="visually-hidden">, </span>{{ year.items.length }}<span class="visually-hidden">{{ ` ${nounFor(year.items.length)}` }}</span></span>
          </a>
        </li>
      </ol>
    </nav>

    <!--
      One band per year, newest first, newest open by default — the frozen
      source's `:open="y === years[0]"`, now reached through `isYearOpen` as
      the *fallback* for a year the reader has not touched (gh#228). Identity
      comparison, not an index lookup, because that is what the source writes
      and the two are the same statement.

      `@update:open` is the other half: `bfAccordion` reports the browser's own
      toggle and `setYearOpen` records it, so the reader's choice survives any
      render of this page rather than only the renders that happen not to
      re-create the node.

      The year is the label and the count its `meta`: `bfAccordion` sets the
      count beside the year in the card date's voice, so "2016" reads as the
      sub-head and "34 pieces" — the header's own noun, or the chosen
      format's — as the note on it. It used to be one composed string,
      `2016 · 34 pieces`, all of it in the display face.

      `id` and `class` fall through `$attrs` onto the `<details>`, the
      accordion's single root: the id is the index links' target, the class
      is the hook the stylesheet below retunes the band through.
    -->
    <div class="bf-archive-list">
      <bfAccordion
        v-for="year in years"
        :id="yearId(year)"
        :key="year.year"
        class="bf-archive-year"
        :label="year.year"
        :meta="countLabel(year.items.length)"
        :open="isYearOpen(year)"
        @update:open="(open: boolean) => setYearOpen(year, open)"
      >
        <!--
          No `<li>` wrapper here, and that is the load-bearing detail of this
          block: **`bfCard` renders the `<li>` itself** (its own comment explains
          why — a group of cards is a list, so the count is announced before a
          reader walks it), and it carries a dev-time guard that warns unless its
          parent is a `<ul>`, an `<ol>` or a `role="list"` container. Wrapping
          each row in an `<li>` of our own produced `<li><li class="bf-card
          bf-card-row">`: invalid nesting, which the HTML parser silently repairs
          into two siblings while Vue's client render keeps them nested — a
          hydration mismatch on all 256 rows, and the warning on every one of
          them. `bfSearchShell` puts `bfCard` straight into its `<ol>` for the
          same reason. Found by the browser pass; see this issue's Decisions.

          `role="list"` is explicit because the list has no markers, and WebKit
          drops list semantics from a marker-less list — so VoiceOver would stop
          announcing "list, 27 items". The same belt-and-braces `bfBreadcrumb`
          and `projects/[slug].vue` put on their own lists.

          `stack` + `data-gap="xs"` is the frozen source's own primitive and
          step. The frozen source also writes `list-style: none` and a zeroed
          padding inline; neither is restated, because `base/reset.css` already
          strips both from any `ul[class]` — which this is twice over. The block
          padding it sets is `bfAccordion__body`'s here.
        -->
        <ul class="stack" role="list" data-gap="xs">
          <!--
            One `bfCardRow` replaces the frozen row's `wf-chip` + `NuxtLink` +
            `<time>` composite. The chip is the format label and the date is a
            real `<time datetime>`; both are the component's internal
            composition, which is why nothing about either appears here.

            `:archive-chip="false"`: `bfCardRow` adds an `Archive` chip for
            any archived item, which is right on `/search`, where it tells a
            past piece from a current one — and noise here, where the page is
            the archive and the chip sat on all 256 rows. `:kind-chip` drops
            the format chip once a format is chosen: under `?format=video`
            all 57 rows would carry an identical `VIDEO` beside a facet and a
            count that already say "videos". `kicker="inline"` keeps a curated
            prefix in the title's own line and face — "Hidden Layers: …" — since
            a separate kicker on every row of a dense list read as noise (the
            user's call, 2026-09-28). The item is passed as it is.

            Keyed on `slug`, which is unique across this list — every row is an
            insight, and the archived slugs are 256 distinct values since #151.
            (`bfSearchShell` keys on `to` and `slug` together because its list
            is deliberately cross-collection; this one is not.)

            `heading-level="3"` sits under the band's `<h2>` — the wrapper's
            default (#128), stated so the next reader does not have to know that.
            `variant="insight"` reaches the DOM as `data-variant` and styles
            nothing by itself; it is the presentation hint the row's contract
            asks callers to name.
          -->
          <bfCardRow
            v-for="item in year.items"
            :key="item.slug"
            :item="item"
            variant="insight"
            :heading-level="3"
            :archive-chip="false"
            :kind-chip="!selectedFormat"
            kicker="inline"
          />
        </ul>
      </bfAccordion>
    </div>

    <!--
      Nothing left under the facet. No format is empty in today's snapshot
      (the smallest, reports, holds 20), so this is the guard rather than the
      design: a content edit away, and a band of no years with no sentence
      would read as a broken page. Rank 3, under the band's `<h2>`.
    -->
    <bfEmptyState
      v-if="!years.length"
      :heading-level="3"
      heading="Nothing in the archive in this format"
      back-label="Show the whole archive"
      back-to="/archive"
    />
  </bfSection>
</template>

<style scoped>
/*
  The year index, and the years' retune. `@layer components` for this page's
  own markup; `@layer overrides` for the rules that set `bfAccordion`'s hooks
  from outside it, so they win over the component's own declarations by layer
  rather than by a specificity race. No `:not()` (D-20.5), no colour that is
  not already a semantic token.
*/
@layer components {
  /*
    The count sits on the facets' line, after them — a note on the view, not a
    control — and on its own line under them when the row wraps.
  */
  .bf-archive-facets {
    align-items: end;
    justify-content: space-between;
  }

  .bf-archive-count {
    margin: 0;
  }

  /*
    One line of years at desktop, a tidy block of them on a phone. `auto-fit`
    over a floor, so the eleven years stretch to fill the band's width rather
    than leaving an empty track at its end, and wrap into equal columns when
    they cannot. The floor is the width a four-digit year needs at the index's
    size plus its breathing room — four across at 375px.
  */
  .bf-archive-years__list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(4.5rem, 1fr));
    gap: var(--space-2xs) var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /*
    Each year is a tick on a ruler: a hairline above, the year, its count.
    The rule darkens under the pointer and turns navy for a year that is open
    below, so the line of ticks reads as a map of the list.
  */
  .bf-archive-years__link {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
    padding-block: var(--space-xs) var(--space-2xs);
    border-block-start: var(--border-width-medium) solid var(--color-base-super-light);
    color: var(--color-text);
    text-decoration: none;
  }

  /*
    The display face, as the years below are set — one step smaller than
    them, so the index reads as the way to the sub-heads rather than as a
    row of them.
  */
  .bf-archive-years__year {
    font-family: var(--font-family-display);
    font-size: var(--size-0);
    font-variant-numeric: lining-nums tabular-nums;
    font-weight: var(--font-weight-semibold);
    line-height: var(--leading-display);
    text-decoration-line: none;
    text-decoration-thickness: var(--border-width-thin);
    text-underline-offset: 0.15em;
  }

  /* The card family's meta voice — the same line the rows' dates speak in. */
  .bf-archive-years__count {
    color: var(--color-text-muted);
    font-family: var(--font-family-ui);
    font-size: max(var(--size--2), 0.75rem);
    font-variant-numeric: tabular-nums;
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--tracking-caps);
    line-height: 1;
  }

  .bf-archive-years__link:hover {
    border-block-start-color: var(--color-base-light);
  }

  .bf-archive-years__link:hover .bf-archive-years__year {
    text-decoration-line: underline;
  }

  .bf-archive-years__link[data-open] {
    border-block-start-color: var(--color-accent);
  }

  /*
    The chip track. A wide row is one line, chip then title, so the chip's
    width set where each title began: `VIDEO`, `ARTICLE`, `REPORT` and
    `INFOGRAPHIC` rows started their titles up to ~45px apart, and the title
    column the eye runs down a year had a ragged edge. So the list gives the
    rows' chip cluster a floor as wide as the widest label, through
    `bfCard`'s `--_bf-card-row-chips-min` hook, and every title starts at
    the same x. `bfCard` owns the condition: the floor applies only while a
    row is one line, and a stacked row already aligns its titles.

    The widest is `INFOGRAPHIC`: 108.9px at the top of the fluid ramp (the
    chip text is a fixed step, its padding grows), so `7rem` covers it at
    every width with a few pixels to spare. A documented floor, not a token:
    it measures this label, not a step of the scale. With a format chosen
    the rows carry no chip (`:kind-chip`), render no cluster, and the floor
    has nothing to hold open.
  */
  .bf-archive-list {
    --_bf-card-row-chips-min: 7rem;

    /*
      Room around each title. The archive is a long list of titles and little
      else, and at the row's default (no space above, `xs` below) they read
      as one crammed column; `s` on both sides and body-like leading on a
      wrapped title give each row its own line.
    */
    --_bf-card-row-padding-block: var(--space-s);
    --_bf-card-row-title-leading: 1.3;
  }

  @media (prefers-reduced-motion: no-preference) {
    .bf-archive-years__link {
      transition: border-color 150ms ease;
    }
  }
}

@layer overrides {
  /*
    The years as the band's sub-heads. `bfAccordion` sets its summary in the
    inherited body face, which made "2023 (27)" the same size as the rows it
    heads; here it is the display face one step under the band's `<h2>` —
    the `h3` step — so the eye reads band, year, row. The chevron is drawn in
    `em`, so it grows with the type without a rule of its own. The count
    beside the year is the accordion's `meta`, which declares its own face
    and size, so this rule sets the year alone.

    More air in the summary's tap target and a darker rule between years.
    The jump from the index clears the sticky top bar through
    `base/reset.css`'s `:target` margin, which reads the bar's height.
  */
  .bf-archive-year {
    --_bf-accordion-padding-block: var(--space-s);
    --_bf-accordion-gap: var(--space-xs);
    --_bf-accordion-body-gap: var(--space-xs);
    --_bf-accordion-rule-color: var(--color-base-super-light);
  }

  .bf-archive-year :deep(.bf-accordion__summary) {
    font-family: var(--font-family-display);
    font-size: var(--size-1);
    font-variant-numeric: lining-nums;
    font-weight: var(--font-weight-semibold);
    line-height: var(--leading-display);
    letter-spacing: var(--tracking-display);
  }

  /* The first year's rule doubles as the list's top edge, under the index. */
  .bf-archive-year:first-child {
    border-block-start: var(--border-width-thin) solid var(--_bf-accordion-rule-color);
  }
}
</style>
