<script setup lang="ts">
/**
 * `bfSearchShell` — the search UI shell (issue 43 / gh#52).
 *
 * The search page's four moving parts — the query control, the facet row, the
 * ranked result list and the empty state — lifted out of
 * `pages/wireframes/search.vue` (frozen, D2) into one props-in/events-out
 * organism.
 *
 * **It computes nothing it draws.** No `queryCollection`, no `useWfContent`,
 * no store, no ranking, no `topScore` normalisation, no indexing (BRIEF D8;
 * spec § Out of scope). The count and the order of the rows are read from
 * values issue 54's page handed over. The one piece of state this component
 * owns is the *draft* of what has been typed since the last debounce window
 * closed, and it owns that only because it now owns the emit boundary that
 * the wireframe's page-local `ref` used to own.
 *
 * ## No relevance meter (refined pass, Sep 2026)
 *
 * Every row used to end in `#1 · 100%` and a black bar — the frozen source's
 * picture of `score`. It was a debugging readout: the scorer is lexical (D4),
 * so twenty rows for "democracy" all read `100%`, and the one fact it could
 * carry — the ranking — is already the `<ol>`'s order and the count line's
 * "ranked by relevance". The visitor sees the order; nobody sees the number.
 *
 * `score` stays in the contract and still arrives normalised to 0–1. It is
 * written onto each row as `data-score`, so the ranking stays inspectable in
 * the DOM — by a probe, or by whoever tunes the weights — without drawing
 * anything.
 *
 * ## Two slots, both optional
 *
 * - **`facets`** replaces the single facet row. `SearchShellProps.filters` is
 *   one flat group; `/search` wants two captioned groups (Format, Program),
 *   the same pair `/insights` shows, so a reader meets one facet vocabulary
 *   on both pages. A page that fills the slot passes an empty `filters` and
 *   owns its bars. Unfilled, the shell renders `filters` as before.
 * - **`empty`** replaces the no-results block. The shell cannot tell *why*
 *   there are no rows — no query yet, nothing matched, or facets that
 *   filtered every match away — and each wants different words and a
 *   different way out. The page knows; unfilled, the frozen source's
 *   "No results" block renders as before.
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
 * - The root is a `<search>` element carrying `role="search"` (gh#227). Before
 *   it, `/search` measured `document.querySelectorAll('[role=search],search').
 *   length === 0`: there was no landmark to jump to, and the query control had
 *   no form owner at all, so Enter in the field did nothing. The role is
 *   written **alongside** the element rather than instead of it — `<search>`
 *   maps to the `search` role in every engine that knows the element and in
 *   none that does not, and the explicit role is the floor for the second
 *   kind. Exactly one element carries it, so the page gets exactly one search
 *   landmark; the top bar's search entry is an ordinary `<a href="/search">`
 *   link, not a second region.
 *
 *   Vue 3.5.40's tag table does not contain `search`
 *   (`isHTMLTag('search') === false`, measured), so `nuxt.config.ts` names it
 *   in `vue.compilerOptions.isCustomElement`. See the comment there.
 * - The control is inside a real `<form>` (gh#227), so Enter has a defined
 *   result instead of no result. `@submit.prevent` — the form never navigates;
 *   `onSubmit` cancels the pending debounce and publishes the draft on the
 *   spot, which makes submitting a *flush* of the live filtering rather than a
 *   second, competing way to search. The live filtering is unchanged: this is
 *   additive.
 *
 *   No `action`. This organism is presentational (BRIEF D8) and does not know
 *   the route it is mounted on; `pages/search.vue` owns the URL and writes it
 *   through `navigateTo`. Hard-coding `/search` here would put a route inside a
 *   component that has none, and taking one as a prop would widen the pinned
 *   `SearchShellProps` contract for a no-JS fallback nothing else in this
 *   prerendered app offers.
 *
 *   The submit control is `visually-hidden` (the shared utility, gh#219, used
 *   exactly as `bf/LoadMore.vue:271` uses it — D27) and `tabindex="-1"`. Two
 *   separate calls:
 *
 *   1. **Hidden**, because pass 1 changes nothing a sighted user can see
 *      (a11y BRIEF §1) and a visible search button is a design decision —
 *      which variant, which size, which side of the field — i.e. a pass-2 row
 *      under D23/D32. It still does both jobs the row asks of it: it is the
 *      form's **default button**, which is what gives Enter a defined result,
 *      and it is a named `submit` control in the accessibility tree.
 *   2. **Out of the tab order**, because a focusable control that renders
 *      nothing is an invisible tab stop, which is a WCAG 2.4.7 failure of its
 *      own. It costs nothing: Enter still submits (the button is still the
 *      default button, and HTML's implicit submission applies to a form with
 *      one text field regardless), and a virtual-cursor user still reaches it.
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
 *   `bfEmptyState` stay outside the region as ordinary page content. Since
 *   gh#226 the element is `bfResultCount` rather than a local `<p>`: this was
 *   the only correct instance of the pattern in the codebase, three call sites
 *   in the accessibility epic need the same guarantee, and each one that
 *   hand-rolls it is a place the guarantee can be dropped by a `v-if` that
 *   looks like a tidy-up. The markup, the role and the dropped-when-empty query
 *   clause moved across unchanged (D27); this component's behaviour did not
 *   change at all.
 * - The count line drops its ", ranked by relevance" clause at zero: there is
 *   no order to describe, and "0 results for “x”, ranked by relevance" is a
 *   sentence about nothing.
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

/**
 * The form's submit (gh#227), reached by Enter in the field or by activating
 * the submit control.
 *
 * A **flush**, not a second search path: cancel whatever the debounce has
 * pending and publish the draft now. Submitting a query that is already the
 * page's — Enter pressed twice, or after the window closed — re-emits it, and
 * `pages/search.vue` answers with a `navigateTo` to the URL it is already on,
 * which the router resolves to nothing. Harmless, and cheaper than a guard
 * that would have to reason about the watcher's echo rule above.
 *
 * Nothing here moves focus. The caret stays in the field it was typed in —
 * blurring on submit is exactly the focus loss DoD-A6 is about.
 */
const onSubmit = (): void => {
  cancel()
  publish(draft.value)
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

/* --- rows ---------------------------------------------------------------- */

/**
 * The score as data, not as a picture — see "No relevance meter" above.
 *
 * Clamped, because `score` is contracted to 0–1 and a value outside it is a
 * page bug that should read as the nearest bound rather than as a new number;
 * and fixed to two places, because the attribute is for reading and a float
 * with sixteen digits is not.
 */
const scoreOf = (row: SearchResultRow): string =>
  Math.min(Math.max(row.score, 0), 1).toFixed(2)

/**
 * The count line's trailing clause — only while there is an order to name.
 */
const countSuffix = computed<string | undefined>(() =>
  props.resultCount > 0 ? ', ranked by relevance' : undefined
)

/**
 * `#130`, as on every card wrapper: an empty heading means no heading element
 * and no anchor at all, rather than a stretched link with nothing to announce.
 * `SearchResultRow.heading` is a non-nullable `string` that can still be `''`.
 */
const headingOf = (row: SearchResultRow): string => (row.heading ?? '').trim()
</script>

<template>
  <!--
    `$attrs` falls through to this single root on its own (`inheritAttrs` left
    at its default), so a consumer's `class` merges with `bf-search-shell |
    stack` rather than replacing it, and `data-gap` from a caller reaches the
    composition layer's `.stack` — which is why the gap is written as a
    `data-gap` attribute here rather than as a declaration in this file's own
    layer, where it would outrank the consumer (the `bfByline` lesson, gh#38).

    `<search>` **and** `role="search"` (gh#227) — see the block comment's
    §Accessibility for why both, why exactly one element carries the role, and
    why `nuxt.config.ts` has to tell Vue 3.5 that this tag is an element.

    A tag swap and nothing else: `<search>` is `display: block`, like the `div`
    it replaces, and `.stack`/`.stack > *`/`.stack > * + *` are class selectors
    (`public/css/composition/stack.css:2,10,14`), so no rule that matched
    before stops matching now. `<search>` carries no UA margin or padding.
  -->
  <search class="bf-search-shell | stack" role="search" data-gap="m">
    <!--
      The form (gh#227). It is the query control's owner, which is the fact
      Enter actually depends on — before this, the input had no form at all and
      Enter did nothing.

      `@submit.prevent`: the default action is cancelled, so submitting never
      navigates the document. `onSubmit` flushes the debounce instead; the live
      filtering above it is untouched.

      A block box that becomes the stack's **first** child, so `.stack > * + *`
      still draws the same gap between the same visible boxes as before, and
      `.bf-form-field`'s own root rule (`FormField.vue:290`) declares no block
      margin for `.stack > * { margin-block: 0 }` to have been zeroing.

      `data-measure="normal"` (refined pass): a query is a sentence, not a
      table row, and a field running the full 1100px column left a caret
      adrift in a white bar at desktop. Capped at the reading measure the
      page's tagline and prompt already use, it lines up with them.
    -->
    <form
      class="bf-search-shell__form"
      data-measure="normal"
      @submit.prevent="onSubmit"
    >
      <!--
        The query control. `type="search"` needs no widening: `FormFieldProps.
        type` is a deliberately open `string` handed straight to
        `<input :type="type">`, so the platform resolves it — see the field's own
        contract note. `placeholder` falls through `bfFormField`'s `$attrs` onto
        the control, which is the one element it can usefully land on.

        The `label` prop is untouched by gh#227 and must stay that way: it is a
        real visible `<label for>` ("Search insights, projects and people" on
        `/search`), not an `aria-label` and not the placeholder.
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
        The submit control: hidden, out of the tab order, and load-bearing
        anyway. The block comment's §Accessibility has the two reasons in full.
        `visually-hidden` is the shared utility in `public/css/utils/utils.css`
        (gh#219), consumed rather than restated (D27) — so this component
        declares no rule for it and adds no visual property.
      -->
      <button
        type="submit"
        class="bf-search-shell__submit | visually-hidden"
        tabindex="-1"
        data-bf-search-shell="submit"
      >
        Search
      </button>
    </form>

    <!--
      The facet row. Rendered only when there is a vocabulary to render: an
      empty `role="group"` announces a named group containing nothing.

      `:model-value` + `@update:model-value` rather than `v-model`, because the
      selection is the page's (it lives in `route.query` on `/search`), and the
      array `bfFilterBar` emits is forwarded **as it arrives** — it is already
      a new array, never the mutated prop, which is a guarantee this component
      would only weaken by rebuilding it.

      A filled `facets` slot takes the row's place, in the same position and
      under the same hooks, so the count line and the results follow it
      exactly as they follow the single bar.
    -->
    <div
      v-if="$slots.facets"
      class="bf-search-shell__facets"
      data-bf-search-shell="facets"
    >
      <slot name="facets" />
    </div>
    <bfFilterBar
      v-else-if="filters.length"
      class="bf-search-shell__facets"
      data-bf-search-shell="facets"
      :filters="filters"
      :model-value="selectedFilters"
      @update:model-value="$emit('update:selectedFilters', $event)"
    />

    <!--
      The count line, and the live region (residual #169) — `bfResultCount`
      since gh#226, which is the same markup with the same guarantee lifted out
      of here so `/insights` and `/search` can hold it too (#233). The element
      is still rendered in EVERY state, including zero results, and it is still
      the atom's whole reason for existing: a region that enters the DOM already
      containing its message is not reliably announced, so it persists and only
      its text changes. `role="status"` alone — no `aria-live`, no
      `aria-atomic` — is the atom's too, for the same reason it was written
      here.

      `class` and `data-bf-search-shell` fall through `$attrs` onto the atom's
      single `<p>` root, so both hooks stay exactly where they were. The
      `data-` one is load-bearing rather than decorative: `pages/search.vue`
      addresses it by name to hide this line while the page is idle, and
      dropping it here would silently un-hide the idle count — which would
      *look* like #233 had landed.

      `suffix` carries the comma. How the trailing clause joins the sentence is
      this caller's sentence to write, not the atom's to guess — and it is
      written only while there are rows to be in an order (`countSuffix`).
    -->
    <bfResultCount
      class="bf-search-shell__count"
      data-bf-search-shell="count"
      :count="resultCount"
      :query="query"
      :suffix="countSuffix"
    />

    <!--
      The results. `<ol>` — the order is the ranking, which is the one fact
      about this list that a `<ul>` would throw away.

      `role="list"` is not redundant: this element sets its own
      `list-style: none` at the foot of this file, and `base/reset.css:95-103`
      sets it again for `ol[class]`. WebKit reads that declaration as the author
      no longer meaning a list — VoiceOver stops saying "list, N items" and
      stops offering list navigation, which on a ranked result set is the whole
      point of the `<ol>`. Restating the implicit role puts the semantics back
      without putting the markers back. Same fix and same reason as
      `nav/Dropdown.vue:109` and `Breadcrumb.vue:238-240` (gh#220, D27).
    -->
    <ol
      v-if="results.length"
      class="bf-search-shell__results"
      role="list"
      data-bf-search-shell="results"
    >
      <!--
        `bfCard` renders the `<li>`, so the list has real list items. See
        D-43.1 in the block comment above for why this is the base plus its
        row modifier rather than `<bfCardRow>`.

        Keyed on `to` **and** `slug`, neither alone. A slug is unique within a
        collection and this list is deliberately cross-collection — issue 54's
        ranking pool merges insights, projects and people, and a person and a
        project may honestly share one (review finding gh#52-P2-1). But `to`
        is not unique either: every person routes to `/about#team`, so a query
        matching two people ("nato") keyed two rows alike — a Vue warning,
        and a row free to render another's content (refined pass, Sep 2026).
        Together they are: rows that share a route come from one collection,
        where the slug tells them apart.

        Heading first in the DOM (the base's rule, never reordered): heading
        navigation lands at the start of the row, the chips and then the
        kicker are pulled ahead of it visually, and the date follows it —
        the same row `bfCardRow` draws on `/archive`.

        `data-score` is the ranking as data (see "No relevance meter" in the
        block comment); it draws nothing.
      -->
      <bfCard
        v-for="row in results"
        :key="`${row.to} ${row.slug}`"
        class="bf-card-row bf-search-shell__row"
        data-bf-search-shell="row"
        :data-score="scoreOf(row)"
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
          The excerpt, when the page hands one over: a line of its own under
          the title and meta run, clamped to one line by the row modifier
          ("The row's excerpt" in `Card.vue`). It tells two similar titles
          apart before either is opened. A plain string, like every other
          field of the row.
        -->
        <p v-if="row.excerpt">{{ row.excerpt }}</p>

        <template v-if="row.kicker" #kicker>{{ row.kicker }}</template>

        <!--
          Filled on every row, chips or none, so every row has the chip
          cluster: on a wide row it is the fixed track the titles line up
          after (see "The chip track" at the foot of this file), and a row
          whose kicker already names its format keeps the track open as an
          empty cell rather than pulling its title back to the edge. Empty,
          it holds only Vue's comment anchors, so it names nothing to
          assistive tech, and a narrow row drops it.
        -->
        <template #chips>
          <bfChip v-if="row.chip" tone="neutral">{{ row.chip }}</bfChip>
          <bfChip v-if="row.archived" tone="neutral">Archive</bfChip>
        </template>
      </bfCard>
    </ol>

    <!--
      The empty state, outside the live region on purpose: the count line above
      has already announced "0 results for …", and repeating it inside a second
      announcement is noise. Its copy is the frozen source's own sentence
      (`search.vue:47`), verbatim.
    -->
    <!--
      `:heading-level="2"`, added by issue 54 (gh#63) — the first page to mount
      this shell, and the finding that surfaced it. `EmptyStateProps.
      headingLevel` defaults to `1` and its contract note names the caller
      allowed to lower it in as many words: *"only a caller that knows its page
      already has an `h1` — an empty results band under a `bfPageHeader`,
      `bfSearchShell`'s no-matches branch — may lower it"* (residual #173).
      This is that branch, and it never said so, so `/search` rendered a second
      `<h1>` under `bfPageHeader`'s (BRIEF §5 rule 9: one `h1` per page).

      `2`, not `headingLevel`: the rows' rank is a caller's choice, but this
      heading is the band's own, one level under the page title, whatever the
      rows are. Probe 43 § 6 asserts the element, not just the text.

      Since the refined pass the block is the **fallback** of the `empty`
      slot, inside one wrapper that carries the class and the `data-` hook
      whichever renders — so a page that says something else in this place
      is still addressed by the same name. The wrapper is a `stack`, because
      a page's answer here is usually more than one thing: a reply, then a
      way on.
    -->
    <div
      v-else
      class="bf-search-shell__empty | stack"
      data-gap="l"
      data-bf-search-shell="empty"
    >
      <slot name="empty">
        <bfEmptyState
          heading="No results"
          message="No records matched — try fewer or different words."
          :heading-level="2"
        />
      </slot>
    </div>
  </search>
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

  No colour at all: the rows are `bfCard`'s row modifier and the empty state
  is `bfEmptyState`, each painting itself. The relevance meter's three hooks
  and its bar went with the meter (refined pass, Sep 2026). What the shell
  sets on its rows from outside is the chip track: a floor through `bfCard`'s
  hook on the list, and one `@layer overrides` rule at the foot of the file.
*/
@layer components {
  .bf-search-shell__results {
    --_bf-card-row-padding-block: var(--space-s);
    --_bf-card-row-line-gap: 0;

    /* Same heading and excerpt typography as the Insights list view. */
    --_bf-card-row-title-size: 1.25rem;
    --_bf-card-row-title-leading: 1.3;
    --_bf-card-row-excerpt-size: 1rem;

    /*
      The rows' chip track, inherited by every row — see the foot of this
      file — and the excerpt set under the titles rather than under the
      chips: the floor plus the row's column gap (`bfCard`'s `xs` default).
    */
    --_bf-card-row-chips-min: 12.5rem;
    --_bf-card-row-excerpt-indent: calc(var(--_bf-card-row-chips-min) + var(--space-xs));

    /*
      An `<ol>` inside `@layer composition`'s `.stack` — the markers and the
      indent are the browser's defaults, and the frozen source turns both off
      inline (`style="list-style: none; padding: 0"`). Stated here as ordinary
      rules so a consumer can still put them back.

      `base/reset.css` covers `ol[class]` as well as `ul[class]`, so this list
      is reached by that rule too; the declarations are restated here anyway so
      the component reads on its own and does not silently depend on a global
      whose selector list could change. (An earlier version of this comment said
      the reset did *not* reach an `<ol>`. It does — `reset.css:95-103` lists
      all four selectors. Corrected in gh#220, which is the issue that had to
      read the rule carefully.)
    */
    list-style: none;
    padding-inline-start: 0;
  }
}

/*
  ## The chip track

  A wide row is one line: chips, then the title. The chips' width set where
  each title began, so a list mixing `ARTICLE`, `ARTICLE · ARCHIVE` and
  `INFOGRAPHIC · ARCHIVE` started its titles up to ~120px apart, and a reader
  scanning down the title column lost its edge from row to row. The relevance
  meter used to hide that ragged edge; with the meter gone it showed.

  So the list gives the rows' chip cluster a floor as wide as the widest chip
  set a result can carry, through `bfCard`'s own `--_bf-card-row-chips-min`
  hook ("The chip track" in `Card.vue`, which owns the container condition),
  and every title starts at the same x. The widest set is `INFOGRAPHIC` +
  `ARCHIVE`: 196.7px at the top of the fluid ramp (the chip text is a fixed
  step, the padding and the gap grow), so `12.5rem` covers it with a few
  pixels to spare at every width. A documented floor, not a token: it is a
  measurement of these labels, not a step of the scale. A new chip label
  wider than `INFOGRAPHIC` needs it re-measured. Set on the list (the
  `.bf-search-shell__results` rule above), and inherited by every row.

  Below the row's 36rem the row stacks (chips on a line of their own, the
  title under them from the left edge), which already aligns every title;
  there the empty cluster of a chipless row would only add a blank line, so
  it goes. `@layer overrides`: that one rule reaches into `bfCard`'s row from
  outside it.
*/
@layer overrides {
  @container bf-card-row (max-width: 36rem) {
    .bf-search-shell__row :deep(.bf-card__chips:empty) {
      display: none;
    }
  }
}
</style>
