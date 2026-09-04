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
 * One thing: **the grouping**. `useBfInsights().archived` arrives already
 * filtered and already sorted newest-first; this page buckets it by calendar
 * year and hands each bucket to a `bfAccordion`. The spec puts the grouping
 * here rather than in the composable, and the composable's own header says why
 * — it is thin by design, one `queryCollection` plus filters, with no
 * synthesis in it.
 *
 * Everything drawn is a component that already exists: `bfPageHeader` (#38),
 * `bfSection` (#39), `bfAccordion` (#31) and `bfCardRow` (#27), and this file
 * declares **no stylesheet at all** — every value on the page comes from those
 * four, from the `stack` primitive, or from `base/reset.css`, which already
 * strips the markers and the marker gutter from any `ul[class]`.
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
import type { Insight } from '~/types/bf-contracts'
import { useBfInsights } from '~/composables/data/useBfInsights'
import { useBfPages } from '~/composables/data/useBfPages'

defineOptions({ name: 'ArchivePage' })

definePageMeta({ layout: 'bf-default' })

const { archived } = await useBfInsights()
const { pageBySlug } = await useBfPages()

const indexPage = pageBySlug('archive')

useHead({ title: indexPage?.heading ?? 'Archive' })

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

const years = computed<ArchiveYear[]>(() => {
  const byYear = new Map<string, Insight[]>()

  for (const item of archived) {
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
})

/**
 * The count/range sentence, as the frozen source writes it: the oldest and
 * newest years that actually exist, not a hardcoded span.
 *
 * `Undated` is excluded from both ends — it is not a year and cannot bound a
 * range — which is the second half of the sort decision above.
 */
const datedYears = computed<string[]>(() =>
  years.value.map(y => y.year).filter(year => year !== UNDATED)
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
 * `??`, not `||`: `false` is a value the reader chose, and the whole point is
 * that it outranks the default. The default is the frozen source's
 * `:open="y === years[0]"` — identity against the first bucket, unchanged.
 */
const isYearOpen = (year: ArchiveYear): boolean =>
  openYears.value[year.year] ?? (year === years.value[0])

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
    The band. `heading` as well as `label`, which is one visible element more
    than the frozen source's `<wf-section label="By year">` — and is the same
    information, not a new one: `label` reaches the DOM as `data-label`, which
    the wireframe skin draws as a corner tag and finished `bf-*` chrome does
    not draw at all. Dropping to `label` alone would delete "By year" from the
    page and leave the 256 row headings at `h3` under an `<h1>` with no `<h2>`
    between them, which BRIEF §5 rule 9 forbids. Recorded in Decisions.
  -->
  <bfSection label="By year" heading="By year">
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

      The label is composed **here**: `AccordionProps.label` is a plain string
      by contract, and its note names this call site as the reason (the
      wireframe's `<strong>{{ year }}</strong> ({{ n }})` is a caller's
      typographic choice about a composed string, not a slot the component
      should grow before there is a second occurrence to justify one).
    -->
    <bfAccordion
      v-for="year in years"
      :key="year.year"
      :label="`${year.year} (${year.items.length})`"
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

          Keyed on `slug`, which is unique across this list — every row is an
          insight, and the archived slugs are 256 distinct values since #151.
          (`bfSearchShell` keys on `to` instead because its list is
          deliberately cross-collection; this one is not.)

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
        />
      </ul>
    </bfAccordion>
  </bfSection>
</template>

