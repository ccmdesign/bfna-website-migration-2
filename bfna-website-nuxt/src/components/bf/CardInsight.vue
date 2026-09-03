<script setup lang="ts">
/**
 * `bfCardInsight` — the insight card: a **typed wrapper** over `bfCard`.
 *
 * Ports `components/wireframe/wfCardInsight.vue` (issue 21 / gh#30). That file
 * is frozen (D2) and is not touched here.
 *
 * This is the first of the six typed wrappers (#30–#35) and the row variant
 * (#36), so the wrapper contract is written down once, here, rather than
 * re-decided five more times. Four rules, each with a reason:
 *
 * ## 1. The wrapper owns no DOM
 *
 * `inheritAttrs: false`, and the root is `<bfCard v-bind="$attrs">`. A caller's
 * `class`, `style`, `data-*` and listeners therefore land on the base's `<li>`
 * exactly where they would land on a bare `bfCard` — a wrapper is a *shape*,
 * not a layer of markup, and nothing here should make `<bfCardInsight>` behave
 * differently from `<bfCard>` at the call site.
 *
 * Left at the default, `inheritAttrs` would apply those attributes to the root
 * a *second* time (once automatically, once through the explicit `v-bind`),
 * which merges duplicate classes and double-binds listeners.
 *
 * The forwarding is also what keeps `span` working through the wrapper without
 * this component redeclaring it: `span` is undeclared here, so it falls into
 * `$attrs`, and `v-bind`ing `$attrs` onto a *component* matches keys against
 * that component's declared props — `bfCard` declares `span`, so it arrives as
 * the prop and not as a stray `span=""` attribute on the `<li>`. The raw
 * `data-span="full"` path (`wfCardProduct.vue`'s call shape) works through the
 * same binding. Both are asserted on `/bf-probe/21-bf-card-insight`.
 *
 * ## 2. The prop is the entity, not its fields
 *
 * `insight: Insight` — the zod-inferred type from `content.config.ts`,
 * imported from `~/types/bf-contracts` (BRIEF §5 rule 11). Never redeclared
 * inline, never narrowed to a hand-written subset: a card that spelled out
 * `{ slug, heading, excerpt, publish_date, format, archived }` would keep
 * compiling after the schema renamed one of them.
 *
 * Everything else is a presentation switch (`extraChips`, `excerpt`,
 * `excerptLength`), which is the only kind of prop a card is allowed to grow.
 *
 * ## 3. Presentational-only (BRIEF D8)
 *
 * Props in, nothing out. No `queryCollection`, no store, no data composable,
 * no `useAsyncData` — the caller (a grid, #42, or a template page) fetches and
 * hands over one row. The only import beyond the type is `formatLabel`, a pure
 * function.
 *
 * Notably **`plain()` is not called**. `wfCardInsight.vue:19` strips HTML from
 * the excerpt at render time; that work moved into the build-time normaliser
 * (issue 07) and the helper is retired (issue 10), so `insight.excerpt` is
 * already plain text and re-deriving the strip here would be a second,
 * drifting copy of it.
 *
 * ## 4. No stylesheet
 *
 * This component ships no `<style>` block at all, deliberately. Everything it
 * renders — the heading and its stretched link, the excerpt paragraph, the
 * bottom-aligned `<time>`, the chip cluster — is styled by `bfCard`'s own
 * `@layer components` rules and by the `--_bf-time-*` / `--_bf-chip-*` hooks
 * the two atoms bring. A wrapper stylesheet would have to re-answer the layer
 * question and the `:not()` ban (D-20.5) for no new pixels.
 *
 * ## The one content delta from the wireframe
 *
 * The heading link points at `/insights/${slug}` — the bf-* site's route —
 * where `wfCardInsight.vue:22` points at `/wireframes/insights/${slug}`. That
 * is the single deliberate divergence in this file, named by the spec, and the
 * probe asserts the rendered `href` does not contain `/wireframes/`.
 *
 * ## Two contract additions, retrofitted in gh#31
 *
 * Both were raised as residuals against this file's own review and both were
 * settled once for the whole wrapper family rather than six times:
 *
 * - **`headingLevel`** (#128), from the shared `CardWrapperProps`. `bfCard`
 *   styles `:is(h2, h3, h4)` (D-20.4) because heading level belongs to the
 *   page outline; this is how a wrapper reaches the other two.
 * - **A blank heading renders no link** (#130). See `hasHeading` below.
 */
import type { CardWrapperProps, Insight } from '~/types/bf-contracts'
import { formatLabel } from '~/utils/format'

defineOptions({
  name: 'BfCardInsight',
  /* See rule 1 above: the explicit `v-bind="$attrs"` is the only application. */
  inheritAttrs: false
})

interface Props extends CardWrapperProps {
  /** One `bfInsights` row. Passed whole; this component fetches nothing. */
  insight: Insight
  /**
   * Extra chips rendered after the format chip and before `Archive`, in the
   * order given. The wireframe's call sites use it for a programme or a
   * project name the row itself does not carry.
   */
  extraChips?: string[]
  /**
   * Show the excerpt paragraph. **On by default** — insight cards show
   * excerpts everywhere (Claudio, Aug 3), which is why the flag exists to turn
   * one *off* rather than on.
   */
  excerpt?: boolean
  /** Character budget for the excerpt before it is cut and given an ellipsis. */
  excerptLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  /*
   * `3` is the no-change value — it is the level this file hard-coded before
   * #128 and the level every existing call site renders — so adopting the prop
   * moved no pixel. See `CardWrapperProps` for why the default lives here and
   * not in the type.
   */
  headingLevel: 3,
  extraChips: undefined,
  excerpt: true,
  excerptLength: 140
})

/**
 * The heading text, trimmed — and the guard behind #130.
 *
 * `bfInsightSchema` types `heading` as `z.string().nullable()`. Rendered
 * straight into the link, a null one produces an anchor with **no accessible
 * name**, and because `bfCard` stretches that anchor's `::after` over the whole
 * card the result is a card-sized link a screen-reader user cannot identify
 * (WCAG 2.4.4 / 4.1.2) and a sighted user cannot see the label of. Latent
 * today — 0 of the 371 real rows are affected — and permitted by the type,
 * which is the definition of a trap.
 *
 * So a blank heading renders **no heading element and no link at all**: the
 * card keeps its excerpt, chips and date and simply is not a navigation
 * target. The two alternatives were both rejected for the same reason — the
 * slug (`'dual-vocational-training'`) and a literal `'Untitled'` each invent
 * user-visible content the data does not carry, which BRIEF §5 rule 10
 * forbids, and each *hides* the defect behind a plausible-looking card instead
 * of surfacing it.
 *
 * `''` is treated as `null`: a heading of one space is no more nameable than a
 * missing one, and `.trim()` is what tells them apart from a real title.
 */
const headingText = computed(() => (props.insight.heading ?? '').trim())

const hasHeading = computed(() => headingText.value !== '')

/**
 * …and the defect is announced rather than swallowed. Same shape as `bfMedia`'s
 * missing-`alt` warning (gh#26) and `bfCard`'s outside-a-list warning (gh#29):
 * a dev-time `console.warn`, never a thrown error, with `import.meta.dev`
 * keeping it out of the production bundle.
 */
if (import.meta.dev) {
  watchEffect(() => {
    if (!hasHeading.value) {
      console.warn(
        '[bfCardInsight] `insight.heading` is empty, so the card renders no '
        + 'heading and no link — a stretched link with no accessible name is '
        + `the alternative. slug: ${props.insight.slug}`
      )
    }
  })
}

/**
 * The excerpt, truncated. Same arithmetic as `wfCardInsight.vue:21-24` minus
 * the `plain()` call (see rule 3).
 *
 * `?? ''` because `excerpt` is `string | null` in `bfInsightSchema` and 195 of
 * the 371 real rows carry no excerpt at all; the empty string then fails the
 * template's `v-if` and no empty `<p>` is rendered — which matters in a flex
 * column, where an empty child still contributes a `gap`.
 *
 * `trimEnd()` before the ellipsis so a cut landing on a space does not ship
 * `"… "`-with-a-hole; the `…` is the single character, not three periods.
 */
const excerptText = computed(() => {
  const text = props.insight.excerpt ?? ''
  return text.length > props.excerptLength
    ? text.slice(0, props.excerptLength).trimEnd() + '…'
    : text
})
</script>

<template>
  <!--
    Order is `bfCard`'s, not this file's: heading **first in the DOM** so
    heading navigation lands at the start of the card, with the chips pulled
    above it visually by `order: -1` in the base's stylesheet. Never reorder
    the markup to change the picture.
  -->
  <bfCard v-bind="$attrs">
    <!--
      `h2` / `h3` / `h4` from `headingLevel` (#128) — the three levels
      `bfCard`'s stylesheet matches. `v-if="hasHeading"` is #130: no heading
      text means no element and no anchor, rather than a card-sized link with
      nothing to announce.
    -->
    <component :is="`h${headingLevel}`" v-if="hasHeading">
      <NuxtLink :to="`/insights/${insight.slug}`">{{ headingText }}</NuxtLink>
    </component>

    <p v-if="excerpt && excerptText">{{ excerptText }}</p>

    <!--
      `bfTime` in place of the wireframe's bare `<time>{{ monthYear(…) }}</time>`,
      which carries no `datetime` attribute and is therefore, to every machine
      that reads the page, a `<span>` spelled differently. It renders **no
      element** for a null or unparseable date (20 real rows), so a card
      without one grows no phantom flex child — and it stays a *direct* child
      of the `<li>`, which is what `.bf-card > time { margin-block-start: auto }`
      needs to float the date to the card's bottom edge.
    -->
    <bfTime :date="insight.publish_date" />

    <template #chips>
      <bfChip>{{ formatLabel(insight.format) }}</bfChip>
      <bfChip v-for="chip in extraChips" :key="chip">{{ chip }}</bfChip>
      <!--
        `archived` is `boolean | null`, so the guard is truthiness rather than
        `=== true`; 256 of the 371 real rows are archived.
      -->
      <bfChip v-if="insight.archived">Archive</bfChip>
    </template>
  </bfCard>
</template>
