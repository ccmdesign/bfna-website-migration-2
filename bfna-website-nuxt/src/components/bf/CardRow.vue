<script setup lang="ts">
/**
 * `bfCardRow` — the dense list row (issue 27 / gh#36). The sixth typed
 * wrapper, and the first that is **new** rather than a port: the wireframe
 * left this row un-componentised, as inline chip + `NuxtLink` + `<time>`
 * markup in two places.
 *
 * | Source | Markup it replaces |
 * |---|---|
 * | `pages/wireframes/search.vue:50-56` | the results list row |
 * | `pages/wireframes/archive.vue:17-21` | the per-year accordion row |
 *
 * Both are frozen (D2) and are not touched. This component reproduces their
 * one-line structure — chip, linked heading, date — on `bfCard`, so the row
 * inherits the family's stretched link, hover and focus behaviour instead of
 * being a fourth thing that looks like a card.
 *
 * Presentational-only (BRIEF D8): props in, nothing else. No
 * `queryCollection`, no store, no data composable. The two consumers (#43
 * `bfSearchShell`, #55 the `/archive` accordion) own the containers and the
 * data; this owns one row.
 *
 * ## One prop, two entity types
 *
 * The acceptance for this issue is that **both entity types render from a
 * single prop union**, from one `v-for` over a mixed array — which is the
 * shape both consumers actually have. Search results interleave insights and
 * projects by relevance; the archive is insights today and is not typed
 * against ever being anything else.
 *
 * So `item: Insight | Project`, and a **structural type guard** rather than an
 * `instanceof`: both are plain data objects deserialised from JSON, with no
 * constructor and no discriminant field of their own.
 *
 * ### Which field does the narrowing (D-27.2)
 *
 * The spec names "`publish_date`/`format`" for the `Insight` branch and
 * "`kind`/`external_url`" for the `Project` branch. Three of those four are
 * usable and one is not:
 *
 * - `external_url` is on **both** schemas (`bfInsightSchema:55`,
 *   `bfProjectSchema:79`), so it narrows nothing. Using it would have made
 *   every insight with an external URL render as a project — silently, since
 *   the fields the project branch reads (`slug`, `heading`) exist on an
 *   insight too, so the row would have rendered a plausible-looking link to
 *   `/projects/<an-insight-slug>`, i.e. a 404 that typechecks.
 * - `publish_date`, `format` and `kind` are each on exactly one schema.
 *
 * `publish_date` is the one used, because it is also the field the Insight
 * branch *reads*: the guard and the thing it protects are the same key, so a
 * schema change that removes it breaks the narrowing loudly rather than
 * leaving a guard that passes on a shape the branch can no longer render.
 *
 * `in` rather than a truthiness test, and this is the load-bearing detail:
 * `publish_date` is `z.string().nullable()` and **20 of the 371 real rows
 * carry `null`**. `if (item.publish_date)` would have routed every one of
 * those twenty insights down the project branch. `in` asks whether the *key*
 * exists, which is the actual question.
 *
 * ## What each branch renders
 *
 * | | Insight | Project |
 * |---|---|---|
 * | chip | `formatLabel(format)`, + `Archive` when `archived` | `kindLabel(kind)` |
 * | link | `/insights/:slug` | `/projects/:slug` |
 * | date | `<bfTime :date="publish_date">` | — |
 *
 * The project branch renders **no date**, following the wireframe row markup
 * it ports: `bfProjectSchema` has no display date field at all, so there is
 * nothing to render rather than a decision not to.
 *
 * ## The layout is the base's, not this file's
 *
 * This component ships **no stylesheet**. The one-line arrangement is
 * `bfCard`'s `.bf-card-row` modifier — see the `## The row modifier` block in
 * `Card.vue` — which this file composes by rendering that class on the base.
 * The heading takes no `white-space: nowrap` and no fixed width, so a very
 * long one wraps inside the row instead of overflowing it; probe 27 asserts
 * that with a 980-character heading.
 *
 * Chips go in the base's `chips` slot, so they arrive inside the
 * `.bf-card__chips | cluster` wrapper with its own `data-gap="xs"` — the same
 * cluster the frozen `archive.vue:17` row builds by hand.
 */
import type { CardRowProps, Insight, CardRowItem } from '~/types/bf-contracts'
import { formatLabel, kindLabel } from '~/utils/format'

defineOptions({
  name: 'BfCardRow',
  /*
   * As on every wrapper (D-21.1): `$attrs` is applied once, explicitly, on the
   * `<bfCard>` below. Left at the default it would land on this component's
   * root *and* be merged again by the `v-bind`, so a caller's `class` would be
   * written twice and `span="full"` would arrive as both a prop and an
   * attribute.
   */
  inheritAttrs: false
})

const props = withDefaults(defineProps<CardRowProps>(), {
  /* The no-change level; see `CardWrapperProps` in `bf-contracts.ts`. */
  headingLevel: 3,
  variant: undefined
})

/**
 * The type guard. See "Which field does the narrowing" above for why it is
 * `'publish_date' in item` and not any of the three other candidates the spec
 * mentions.
 *
 * A predicate signature (`item is Insight`) rather than a `boolean`, so the
 * template's `v-if` narrows `item` for TypeScript in both directions — the
 * `v-else` branch is a `Project` without a cast.
 */
function isInsight(item: CardRowItem): item is Insight {
  return 'publish_date' in item
}

const insight = computed<Insight | null>(() =>
  isInsight(props.item) ? props.item : null
)

/**
 * The heading text, trimmed. `bfInsightSchema` types `heading` as nullable and
 * `bfProjectSchema` types it as a non-nullable `string` that can still be
 * empty, so the two defects converge on one check.
 */
const headingText = computed(() => (props.item.heading ?? '').trim())

const hasHeading = computed(() => headingText.value !== '')

/**
 * Where the row points. Two collections, two route prefixes, and the slug is
 * on both schemas so only the prefix is a branch.
 */
const to = computed(() =>
  `${isInsight(props.item) ? '/insights' : '/projects'}/${props.item.slug}`
)

/**
 * The chip labels, in the order the frozen rows put them: the kind/format chip
 * first, then the `Archive` marker that `search.vue:53` renders conditionally.
 *
 * `kindLabel` returns `null` for a project with no `kind` (5 real rows), and
 * that `null` is filtered rather than rendered as an empty chip. `formatLabel`
 * always returns a label — it falls back to `'Article'` — so the insight
 * branch always has at least one.
 *
 * `archived` is a non-nullable `boolean` on both schemas since gh#140, so the
 * truthiness test and `=== true` now agree; the truthiness form is kept because
 * it is the shape every other consumer uses.
 */
const chips = computed<string[]>(() => {
  const row = props.item
  const first = isInsight(row) ? formatLabel(row.format) : kindLabel(row.kind)
  return [first, row.archived ? 'Archive' : null].filter(
    (label): label is string => Boolean(label)
  )
})

/**
 * #130, as on every wrapper: an empty heading means **no heading element and
 * no anchor**, rather than a card-sized stretched link with nothing to
 * announce. Warned at dev time so the data defect surfaces on the row that has
 * it rather than as a silently link-less row.
 */
if (import.meta.dev) {
  watchEffect(() => {
    if (!hasHeading.value) {
      console.warn(
        '[bfCardRow] `item.heading` is empty, so the row renders no heading and '
        + 'no link — a stretched link with no accessible name is the '
        + `alternative. slug: ${props.item.slug}`
      )
    }
  })
}
</script>

<template>
  <!--
    `class="bf-card-row"` is the modifier, defined in `Card.vue`'s
    `@layer components` block. Vue **merges** a `class` from `$attrs` with this
    one rather than replacing it, so a caller composing
    `<bfCardRow class="probe__tinted">` gets all three of `.bf-card`,
    `.bf-card-row` and their own — which is exactly what the base's
    `inheritAttrs` note describes for `bfCardInsight`'s `stack`.

    `:data-variant` renders nothing when the prop is absent (Vue omits an
    attribute bound to `undefined`), so an unstyled row carries no empty hook.

    Order is `bfCard`'s, not this file's: the heading is **first in the DOM**
    so heading navigation lands at the start of the row, with the chips pulled
    ahead of it visually by the base's `order: -1`. Never reorder the markup to
    change the picture.
  -->
  <bfCard class="bf-card-row" :data-variant="variant" v-bind="$attrs">
    <component :is="`h${headingLevel}`" v-if="hasHeading">
      <NuxtLink :to="to">{{ headingText }}</NuxtLink>
    </component>

    <!--
      `bfTime` in place of the frozen row's bare `<time>{{ monthYear(…) }}</time>`,
      which carries no `datetime` attribute and is therefore, to every machine
      reading the page, a `<span>` spelled differently. It renders **no
      element** for a null or unparseable date (20 real rows), so a row without
      one grows no phantom flex child and no stray `gap`.

      Guarded by `insight` rather than by `item.publish_date`: the project
      branch has no such field at all, and reaching for one through the union
      would need a cast.
    -->
    <bfTime v-if="insight" :date="insight.publish_date" />

    <template v-if="chips.length" #chips>
      <bfChip v-for="chip in chips" :key="chip">{{ chip }}</bfChip>
    </template>
  </bfCard>
</template>
