<script setup lang="ts">
/**
 * `bfSearchShell` — the search UI shell (issue 43 / gh#52).
 *
 * The search page's four moving parts — the query control, the facet row, the
 * result list with its bespoke relevance meter, and the empty state — lifted
 * out of `pages/wireframes/search.vue` (frozen, D2) into one props-in/
 * events-out organism.
 *
 * **It computes nothing it draws.** No `queryCollection`, no `useWfContent`,
 * no store, no ranking, no `topScore` normalisation, no indexing (BRIEF D8;
 * spec § Out of scope). Every number on the screen — the count, the rank, the
 * percentage, the width of the bar — is read from a value issue 54's page
 * handed over. The one piece of state this component owns is the *draft* of
 * what has been typed since the last debounce window closed, and it owns that
 * only because it now owns the emit boundary that the wireframe's page-local
 * `ref` used to own.
 *
 * ## What it composes, and what it deliberately does not
 *
 * | Part | Built from |
 * |---|---|
 * | query control | `bfFormField` (#34/gh#43) with `type="search"` |
 * | facet row | `bfFilterBar` (#30/gh#39) |
 * | result row | `bfCard` (#20/gh#29) with its `.bf-card-row` modifier |
 * | date | `bfTime` (#18/gh#27) |
 * | chips | `bfChip` (#16/gh#25) |
 * | empty state | `bfEmptyState` (#33/gh#42) |
 *
 * ### D-43.1 — the row is `bfCard.bf-card-row`, not `bfCardRow`
 *
 * The spec's text says the results list is "one `<bfCardRow>` per `results`
 * entry", and it cannot be, because two merged contracts disagree about what a
 * result *is*:
 *
 * - `SearchResultRow` (issue 02, pinned in `bf-contracts.ts:634`) is a
 *   **projection**: `{ slug, heading, to, chip, archived?, date?, score }`.
 *   It is what the frozen `search.vue` builds inline and what issue 54's
 *   §Scope says the page will build — `to` in particular is arbitrary, because
 *   the ranking pool mixes insights, projects **and people**, three route
 *   prefixes.
 * - `bfCardRow.item` (issue 27, `CardRowProps:735`) is the **entity** union
 *   `Insight | Project`, and derives `to`, the chip and the date from it by a
 *   `'publish_date' in item` type guard.
 *
 * A `SearchResultRow` is not assignable to `CardRowItem`, and the shapes are
 * not merely narrower/wider: a projection carries a `to` that the entity
 * branch would *recompute* — sending every person row to `/projects/<slug>`,
 * a 404 that typechecks. Fabricating an `Insight` from a projection to satisfy
 * the prop would be a cast wearing a component's clothes.
 *
 * So the row composes `<bfCard class="bf-card-row">` — which is exactly what
 * `bfCardRow` itself composes, and which `Card.vue`'s own block comment
 * declares public for this issue by name: *"It also gives #43 and #55 a name
 * to hang their container rules on."* Identical presentation, honest types, no
 * edit to a merged component and no change to a pinned contract. The mismatch
 * itself is handed to #54 as a residual rather than papered over here.
 *
 * ## The debounce
 *
 * The wireframe filters an in-memory array on every keystroke of a page-local
 * `v-model`, which is free. Issue 54's page re-ranks ~400 documents per query,
 * which is not — and because the emit boundary moved here, "per keystroke"
 * would now mean "per keystroke, across a component boundary, into a page that
 * writes `route.query`". Hence `debounceMs`, defaulting to 250.
 *
 * Hand-rolled rather than `useDebounceFn`: `@vueuse/nuxt` is a dependency but
 * is **not** registered in `nuxt.config.ts` (there is no `modules` array at
 * all), so its composables are not auto-imported and importing from
 * `@vueuse/core` directly would be the first such import in `src/`. Twelve
 * lines of `setTimeout` with an unmount guard is the smaller commitment.
 *
 * Two properties the probe asserts, both of which a naive version gets wrong:
 *
 * 1. **One emit per burst, not one per keystroke** — the pending timer is
 *    cleared before a new one is set, so five characters typed inside one
 *    window emit once, with the final value.
 * 2. **The timer never outlives the component.** `onBeforeUnmount` clears it;
 *    a fired-after-unmount emit is a Vue warning at best and a write into a
 *    torn-down page at worst.
 *
 * `debounceMs: 0` emits synchronously — no timer, no `setTimeout(fn, 0)` macro
 * task — so a consumer that genuinely wants live typing gets it without a
 * frame of lag, and a test can turn the timing off rather than wait it out.
 *
 * ## Why the draft is resynchronised against `query` and not merely seeded
 *
 * The control is controlled by `draft`, so it stays responsive between
 * windows. But `query` is the page's value, and the page changes it for
 * reasons that have nothing to do with typing: a cleared search, a `?q=`
 * restored by back-navigation, a suggested query applied from elsewhere. The
 * watcher adopts any incoming value **that is not the one we last emitted**,
 * and cancels the pending timer when it does — so an external change wins over
 * a half-typed draft, while the page echoing our own emit back does not reset
 * the caret.
 *
 * ## Accessibility
 *
 * - `bfFormField` renders a real `<label for>`/`id` pair, so the search
 *   control's accessible name is *visible text* rather than the frozen
 *   source's `aria-label` on a bare input. It also declares its own
 *   `:focus-visible` ring in `@layer components` (residual #157 — `base/
 *   forms.css` writes `outline: none` and paints with `box-shadow` alone,
 *   which forced-colors mode drops), so **no local focus rule is needed here**
 *   and none is written. The probe asserts the ring on the rendered control
 *   rather than trusting that note.
 * - The count line is a **persistently rendered** live region whose text
 *   swaps (residual #169). It is never `v-if`-ed: a region inserted into the
 *   DOM already containing its message is not reliably announced, so the `<p
 *   role="status">` is in the DOM in every state, including the empty one —
 *   which is what makes "0 results for …" the announcement, and lets
 *   `bfEmptyState` stay outside the region as ordinary page content.
 * - The meter bar is `aria-hidden`: it is a picture of the percentage in the
 *   text label beside it, and announcing it twice is worse than once. The
 *   frozen source made the same call.
 * - `#130`: a row with an empty heading renders **no heading and no anchor**
 *   rather than a card-sized stretched link with no accessible name.
 */
import type { SearchResultRow, SearchShellProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfSearchShell' })

const props = withDefaults(defineProps<SearchShellProps>(), {
  /* The no-change level; see `CardWrapperProps` in `bf-contracts.ts`. */
  headingLevel: 3,
  /* The frozen source's own `aria-label`, promoted to a visible label. */
  label: 'Semantic search',
  /* The frozen source's own placeholder, curly quotes included. */
  placeholder: 'Ask anything — e.g. “how do we fix democracy?”',
  debounceMs: 250
})

const emit = defineEmits<{
  /** The query, after the debounce window. Never once per keystroke. */
  'update:query': [value: string]
  /** The full new facet selection, as `bfFilterBar` emitted it. */
  'update:selectedFilters': [value: string[]]
}>()

/* --- the query control --------------------------------------------------- */

/** What is in the input right now, which is not yet what the page has. */
const draft = ref(props.query)

/**
 * The last value this component emitted, so the watcher below can tell the
 * page's echo of our own emit apart from a genuine external change.
 */
let lastEmitted = props.query

let timer: ReturnType<typeof setTimeout> | null = null

const cancel = (): void => {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

const publish = (value: string): void => {
  lastEmitted = value
  emit('update:query', value)
}

const onQueryInput = (value: string): void => {
  draft.value = value
  cancel()

  if (props.debounceMs <= 0) {
    publish(value)
    return
  }

  timer = setTimeout(() => {
    timer = null
    publish(value)
  }, props.debounceMs)
}

watch(
  () => props.query,
  incoming => {
    /* Our own emit coming back around — leave the draft and the caret alone. */
    if (incoming === lastEmitted) return

    /* A real external change. It outranks whatever is half-typed. */
    cancel()
    lastEmitted = incoming
    draft.value = incoming
  }
)

onBeforeUnmount(cancel)

/* --- the relevance meter ------------------------------------------------- */

/**
 * The wireframe's own arithmetic, with the normalisation removed.
 *
 * `search.vue:59-62` writes `Math.round((r.score / topScore) * 100)` for the
 * label and `Math.max(6, that * 1.6)` px for the bar. The division is the
 * page's job here (issue 54 owns `topScore`), so `score` arrives already in
 * 0–1 and this only clamps it: a score outside the range is a page bug, and a
 * page bug must not become a bar wider than its container.
 */
const percentOf = (row: SearchResultRow): number =>
  Math.round(Math.min(Math.max(row.score, 0), 1) * 100)

/**
 * The width, as a custom property rather than as an inline `width:`.
 *
 * The distinction is the whole point of the port (spec § Scope): an inline
 * `width` declaration cannot be outranked by any author rule, so the frozen
 * source's bar is un-restyleable by a consumer — the `bfMedia` lesson from
 * gh#26. A custom property is *data* the CSS rule reads, so the rule keeps
 * owning the property and a consumer can still override either one.
 *
 * `Math.max(6, …)` is the frozen source's floor, kept: a bar for a
 * near-zero score should still be visible as an empty-ish bar rather than
 * vanish, because a missing bar reads as "no meter" rather than "low score".
 */
const meterStyle = (row: SearchResultRow): Record<string, string> => ({
  '--_bf-search-shell-meter-width': `${Math.max(6, percentOf(row) * 1.6)}px`
})

/* --- rows ---------------------------------------------------------------- */

/**
 * `#130`, as on every card wrapper: an empty heading means no heading element
 * and no anchor at all, rather than a stretched link with nothing to announce.
 * `SearchResultRow.heading` is a non-nullable `string` that can still be `''`.
 */
const headingOf = (row: SearchResultRow): string => (row.heading ?? '').trim()

const countLabel = computed(() => (props.resultCount === 1 ? 'result' : 'results'))
</script>

<template>
  <!--
    `$attrs` falls through to this single root on its own (`inheritAttrs` left
    at its default), so a consumer's `class` merges with `bf-search-shell |
    stack` rather than replacing it, and `data-gap` from a caller reaches the
    composition layer's `.stack` — which is why the gap is written as a
    `data-gap` attribute here rather than as a declaration in this file's own
    layer, where it would outrank the consumer (the `bfByline` lesson, gh#38).
  -->
  <div class="bf-search-shell | stack" data-gap="m">
    <!--
      The query control. `type="search"` needs no widening: `FormFieldProps.
      type` is a deliberately open `string` handed straight to
      `<input :type="type">`, so the platform resolves it — see the field's own
      contract note. `placeholder` falls through `bfFormField`'s `$attrs` onto
      the control, which is the one element it can usefully land on.
    -->
    <bfFormField
      class="bf-search-shell__query"
      data-bf-search-shell="query"
      type="search"
      :label="label"
      :model-value="draft"
      :placeholder="placeholder"
      @update:model-value="onQueryInput"
    />

    <!--
      The facet row. Rendered only when there is a vocabulary to render: an
      empty `role="group"` announces a named group containing nothing.

      `:model-value` + `@update:model-value` rather than `v-model`, because the
      selection is the page's (it lives in `route.query` on `/search`), and the
      array `bfFilterBar` emits is forwarded **as it arrives** — it is already
      a new array, never the mutated prop, which is a guarantee this component
      would only weaken by rebuilding it.
    -->
    <bfFilterBar
      v-if="filters.length"
      class="bf-search-shell__facets"
      data-bf-search-shell="facets"
      :filters="filters"
      :model-value="selectedFilters"
      @update:model-value="$emit('update:selectedFilters', $event)"
    />

    <!--
      The count line, and the live region (residual #169). Rendered in EVERY
      state — including zero results — rather than `v-if`-ed alongside the
      list: a region that enters the DOM already containing its message is not
      reliably announced, so the element persists and only its text changes.

      `role="status"` alone, not `role="status" aria-live="polite"`: the role
      carries the implicit `aria-live="polite"` and `aria-atomic="true"`, and
      writing both invites them to drift apart.
    -->
    <p
      class="bf-search-shell__count"
      data-bf-search-shell="count"
      role="status"
    >
      <strong>{{ resultCount }}</strong> {{ countLabel }}<!--
        The query clause is dropped when there is no query, rather than the
        whole line: the region must persist (#169), but “0 results for
        “”” is a sentence nobody wrote, and it is what an unqueried shell
        would announce on mount. The count itself stays — a consumer that
        renders the shell unfiltered has a real number to report.
      --><template v-if="query"> for “{{ query }}”</template>, ranked by relevance
    </p>

    <!--
      The results. `<ol>` — the order is the ranking, which is the one fact
      about this list that a `<ul>` would throw away.
    -->
    <ol
      v-if="results.length"
      class="bf-search-shell__results | stack"
      data-gap="s"
      data-bf-search-shell="results"
    >
      <!--
        `bfCard` renders the `<li>`, so the list has real list items. See
        D-43.1 in the block comment above for why this is the base plus its
        row modifier rather than `<bfCardRow>`.

        Keyed on `to`, **not** on `slug`. A slug is unique within a collection
        and this list is deliberately cross-collection — issue 54's ranking
        pool merges insights, projects and people, and a person and a project
        may honestly share one. Two rows with the same key is a Vue warning at
        best and a row rendering another row's content at worst; `to` is the
        route, which is unique by construction (review finding gh#52-P2-1).

        Heading first in the DOM (the base's rule, never reordered): heading
        navigation lands at the start of the row, and `.bf-card__chips`'s
        `order: -1` pulls the chips ahead of it visually.
      -->
      <bfCard
        v-for="(row, index) in results"
        :key="row.to"
        class="bf-card-row bf-search-shell__row"
        data-bf-search-shell="row"
      >
        <component :is="`h${headingLevel}`" v-if="headingOf(row)">
          <NuxtLink :to="row.to">{{ headingOf(row) }}</NuxtLink>
        </component>

        <!--
          `bfTime` rather than the frozen row's bare `<time>{{ r.date }}</time>`,
          which carries no `datetime` and is therefore a `<span>` spelled
          differently. It renders **no element** for a null or unparseable
          value, which is also the contract note for issue 54: hand it the raw
          `publish_date`, not a pre-formatted `monthYear()` string — the
          formatting is `bfTime`'s.
        -->
        <bfTime v-if="row.date" :date="row.date" />

        <!--
          The relevance meter. `flex-basis: 100%` in this file's own layer puts
          it on its own line under the row rather than in the baseline run with
          the chip, the heading and the date — the frozen source's arrangement.

          The bar is `aria-hidden`: it is a picture of the percentage already
          in the text beside it.
        -->
        <p
          class="bf-search-shell__meter | cluster"
          data-gap="xs"
          data-bf-search-shell="meter"
          :style="meterStyle(row)"
        >
          <span class="bf-search-shell__rank">#{{ index + 1 }} · {{ percentOf(row) }}%</span>
          <span
            class="bf-search-shell__bar"
            data-bf-search-shell="bar"
            aria-hidden="true"
          />
        </p>

        <template #chips>
          <bfChip v-if="row.chip">{{ row.chip }}</bfChip>
          <bfChip v-if="row.archived">Archive</bfChip>
        </template>
      </bfCard>
    </ol>

    <!--
      The empty state, outside the live region on purpose: the count line above
      has already announced "0 results for …", and repeating it inside a second
      announcement is noise. Its copy is the frozen source's own sentence
      (`search.vue:47`), verbatim.
    -->
    <bfEmptyState
      v-else
      class="bf-search-shell__empty"
      data-bf-search-shell="empty"
      heading="No results"
      message="No records matched — try fewer or different words."
    />
  </div>
</template>

<style scoped>
/*
  `@layer components`, and it must survive into the built stylesheet — see the
  note in `Button.vue` for the history: `postcss-preset-env`'s cascade-layers
  polyfill used to flatten these blocks into unlayered rules that then
  outranked every layer. The feature is off in `nuxt.config.ts`; probe 43 reads
  the live CSSOM, so a regression fails a row rather than shipping quietly.

  No `:not()` anywhere in this file — D-20.5 (gh#29): `postcss-preset-env`
  mis-lowers a `:not()` containing a complex selector and silently breaks the
  rule. Nothing here needs one.

  No new colour (BRIEF §5 rule 2). The bar's paint is `--color-text`, the same
  existing semantic token the frozen source's `#222` resolves to, reached
  through a hook so a consumer can retune it without a second declaration.
*/
@layer components {
  .bf-search-shell__results {
    /*
      An `<ol>` inside `@layer composition`'s `.stack` — the markers and the
      indent are the browser's defaults, and the frozen source turns both off
      inline (`style="list-style: none; padding: 0"`). Stated here as ordinary
      rules so a consumer can still put them back.

      `base/reset.css` covers `ul[class]`; this list is an `<ol>`, so it is not
      reached by that rule and must say so itself.
    */
    list-style: none;
    padding-inline-start: 0;
  }

  .bf-search-shell__meter {
    /*
      The meter's three hooks, declared **here** rather than on the bar itself,
      and that placement is load-bearing rather than tidy.

      The `:style` binding in the template sets
      `--_bf-search-shell-meter-width` on *this* element. A custom property
      declared in a rule on the **bar** would then beat the value inherited
      from this element — a declaration on the element always wins over
      inheritance, whatever the layer — and every bar would silently draw at
      the 6px floor with the per-row value sitting one node up, unused. (It
      did, on the first run; probe 43 § 2 caught it.)

      Declared on the element the inline property lands on, the cascade
      resolves the way it reads: inline value if there is one, this default
      otherwise, inherited by the bar either way.
    */
    --_bf-search-shell-meter-width: 6px;
    --_bf-search-shell-meter-height: 6px;
    --_bf-search-shell-meter-color: var(--color-text);

    /*
      A full-width flex item, so the meter wraps onto its own line beneath the
      chip/heading/date run instead of joining it. `.bf-card.bf-card-row` is
      `flex-wrap: wrap`, which is what makes a 100% basis a line break rather
      than an overflow.
    */
    flex-basis: 100%;

    /*
      The row's own baseline alignment is right for three runs of text and
      wrong for a text label beside a 6px bar, which would sit on the text's
      baseline rather than through it.
    */
    align-items: center;

    /* `.cluster` is `flex-wrap: wrap`; a bar that wrapped under its own label
       would read as a second, empty row. The pair is one unit. */
    flex-wrap: nowrap;
    margin-block: 0;
    font-size: var(--size--1);
  }

  .bf-search-shell__rank {
    /*
      A floor, not a fixed width: it keeps the bars of consecutive rows
      left-aligned with each other (the frozen source's `min-width: 4.5rem`)
      while still letting a three-digit rank push the bar right rather than
      overflow the label.
    */
    min-inline-size: 4.5rem;
  }

  .bf-search-shell__bar {
    /*
      Consumes the three hooks and declares none of them — see the note on
      `.bf-search-shell__meter` above for why re-declaring them here would
      shadow the per-row inline value rather than default it.

      The width arrives as a custom **property**, which is data this rule
      reads; an inline `width:` declaration — which is what the frozen
      `search.vue:61` writes — would be un-outrankable by any author rule
      (the `bfMedia` lesson, gh#26). Probe 43 § 2 asserts both halves: the
      widths differ per score, and no element in the meter carries an inline
      `width`.
    */
    display: inline-block;
    flex: none;
    inline-size: var(--_bf-search-shell-meter-width);
    block-size: var(--_bf-search-shell-meter-height);
    background-color: var(--_bf-search-shell-meter-color);
  }
}
</style>
