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
 * `bfSection` (#39), `bfAccordion` (#31) and `bfCardRow` (#27). This file
 * declares one CSS rule, and it is the two-property list reset that
 * `projects/[slug].vue` already ships for the same reason.
 *
 * ## The disclosure is native, and stays native
 *
 * `bfAccordion` is a skin over `<details>`/`<summary>`, so "every accordion is
 * keyboard-operable" is the browser's guarantee rather than a behaviour this
 * page wires: Enter and Space activate a focused `<summary>`, and a closed
 * `<details>` keeps its 20-odd rows out of the tab order without a `tabindex`
 * anywhere. `:open` binds the *content attribute*, i.e. the initial state — so
 * once a reader has toggled a year, nothing here overwrites their choice.
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
    does, at the `narrow` measure it uses.
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
    <p data-measure="narrow">
      {{ archived.length }} pieces of past work, {{ oldestYear }}–{{ newestYear }}.
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
      One band per year, newest first, open by default — the frozen source's
      `:open="y === years[0]"`, unchanged. Identity comparison, not an index
      lookup, because that is what the source writes and the two are the same
      statement.

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
      :open="year === years[0]"
    >
      <!--
        `role="list"` is explicit because the rule below removes the markers,
        and WebKit drops list semantics from a `list-style: none` list — so
        VoiceOver would stop announcing "list, 27 items". The same
        belt-and-braces `projects/[slug].vue` and `bfBreadcrumb` already put on
        their own lists.

        `stack` + `data-gap="xs"` is the frozen source's own primitive and step;
        the block padding it also sets inline is `bfAccordion`'s job here and is
        not restated.
      -->
      <ul class="bf-archive__list | stack" role="list" data-gap="xs">
        <li v-for="item in year.items" :key="item.slug">
          <!--
            One `bfCardRow` replaces the frozen row's `wf-chip` + `NuxtLink` +
            `<time>` composite. The chip is the format label and the date is a
            real `<time datetime>`; both are the component's internal
            composition, which is why nothing about either appears here.

            `heading-level="3"` sits under the band's `<h2>` — the wrapper's
            default (#128), stated so the next reader does not have to know
            that. `variant="insight"` reaches the DOM as `data-variant` and
            styles nothing by itself; it is the presentation hint the row's
            contract asks callers to name.
          -->
          <bfCardRow :item="item" variant="insight" :heading-level="3" />
        </li>
      </ul>
    </bfAccordion>
  </bfSection>
</template>

<style scoped>
/*
  The one rule in this file, and it is a reset rather than a design: the `<ul>`
  is a `.stack`, whose rhythm the composition layer owns, but the markers and
  the marker gutter are the browser's and no primitive removes them. The frozen
  source writes the same two properties as an inline `style` attribute; here
  they are a class, which is the only difference.

  `@layer overrides` for the same reason every page-level rule in this app
  takes it — last in the house order (BRIEF §5 rule 4), so it outranks the
  composition layer's own `.stack` declarations without an unlayered
  declaration that nothing could ever outrank in turn.

  No colour, no `--_bf-*` variable, no `:not()` (D-20.5).
*/
@layer overrides {
  .bf-archive__list {
    padding-inline-start: 0;
    list-style: none;
  }
}
</style>
