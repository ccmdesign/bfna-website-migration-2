<script setup lang="ts">
/**
 * `bfCardFeatured` — the homepage highlight card: a **typed wrapper** over
 * `bfCard`.
 *
 * Ports `components/wireframe/wfCardFeatured.vue` (issue 23 / gh#32). That file
 * is frozen (D2) and is not touched here.
 *
 * The third of the six typed wrappers, written against the contract
 * `bfCardInsight` settled in D-21.1 rather than re-deciding it: the wrapper
 * owns no DOM (`inheritAttrs: false`, root of `<bfCard v-bind="$attrs">`), the
 * prop is the **entity** and not a hand-written subset of its fields, the
 * component is presentational-only (BRIEF D8 — no `queryCollection`, no store,
 * no data composable), and it ships **no `<style>` block at all**, because
 * every pixel it renders is already styled by `bfCard`'s `@layer components`
 * rules and by the `--_bf-chip-*` / `--_bf-media-*` hooks the two atoms bring.
 * With no stylesheet, BRIEF §5 rule 2 (no new colour) and D-20.5 (no `:not()`
 * holding a complex selector) are satisfied vacuously.
 *
 * ## Why this is a separate wrapper and not a `featured` flag on `bfCardInsight`
 *
 * They take the same entity and they are still two components, per the
 * inventory and the spec's Out-of-scope paragraph. The two cards disagree on
 * every presentational decision a flag would have to fork: this one always
 * shows media (`bfCardInsight` has no media slot at all), always shows the
 * literal chip `Featured` (rather than `formatLabel(format)`, `extraChips` and
 * `Archive`), shows **no** `<time>`, and does not truncate its excerpt. A
 * `featured` boolean would branch four ways inside one template and leave both
 * cards harder to read than either is alone.
 *
 * ## Thin by design — the rule of three, applied
 *
 * `wfCardFeatured.vue` is the thinnest of the three frozen sources: one
 * required prop, no presentation switches, a hard-coded chip and a hard-coded
 * ratio. So the props here are `item` and the inherited `headingLevel`, and
 * nothing else. BRIEF §5's rule of three is what keeps it that way — no
 * `media`, `chips`, `excerpt` or `excerptLength` switch appears until the need
 * shows up twice outside this single wireframe occurrence. `bfCardProject`
 * carries four such switches because four call sites asked for them; this card
 * has one call site (the home "Insights" band, issue 47) and therefore none.
 *
 * A caller who wants a different ratio or no chip is not blocked by that: it
 * composes `bfCard` directly, which is what the base is for.
 *
 * ## The excerpt is rendered whole
 *
 * No `excerptLength`, no ellipsis — a deliberate divergence from the two
 * earlier wrappers and a straight port of `wfCardFeatured.vue:18`, which
 * renders `plain(item.excerpt)` untruncated. The eight curated highlight rows
 * run 132–386 characters, they are hand-written strip copy rather than the
 * lead paragraph of an article, and cutting them at 140 would take the point
 * off the end of six of the eight. Truncation is a decision for the day a
 * second call site needs it.
 *
 * As in `bfCardInsight` and `bfCardProject`, **`plain()` is not called**: HTML
 * stripping moved into the build-time normaliser (issue 07) and the helper is
 * retired (issue 10), so `item.excerpt` already arrives as plain text and
 * re-deriving the strip here would be a second, drifting copy of it.
 *
 * ## The one content delta from the wireframe
 *
 * The heading link points at `/insights/${slug}` — the bf-* site's route —
 * where `wfCardFeatured.vue:15` points at `/wireframes/insights/${slug}`. That
 * is the single deliberate divergence in this file, named by the spec, and the
 * probe asserts no rendered `href` contains `/wireframes/`.
 */
import type { CardWrapperProps, Insight } from '~/types/bf-contracts'

defineOptions({
  name: 'BfCardFeatured',
  /*
   * Paired with the explicit `v-bind="$attrs"` below — both halves, or neither
   * (D-21.1). Left at the default, a caller's `class`, `style`, `data-*` and
   * listeners would be applied to the root twice: once automatically, once
   * through the `v-bind`.
   */
  inheritAttrs: false
})

interface Props extends CardWrapperProps {
  /**
   * One `bfInsights` row — in practice one of the eight the normaliser flagged
   * `featured`, which `useBfInsights().highlights()` returns. Passed whole;
   * this component fetches nothing, and it is the **caller** (issue 47's home
   * page) that calls the composable.
   *
   * Typed as the whole `Insight`, not as a `featured`-only narrowing: the flag
   * is a bucket the data carries, not a different shape, and a card that
   * required it would be unusable for a hand-built preview.
   */
  item: Insight
}

const props = withDefaults(defineProps<Props>(), {
  /* The no-change level; see `CardWrapperProps`. */
  headingLevel: 3
})

/**
 * The heading text, trimmed — and the #130 guard, applied to this wrapper for
 * the same reason it is applied to the other two.
 *
 * `bfInsightSchema` types `heading` as `z.string().nullable()`, so this is the
 * same latent-but-permitted trap `bfCardInsight` documents: rendered straight
 * into the link, a null heading produces an anchor with **no accessible name**,
 * and because `bfCard` stretches that anchor's `::after` over the whole card
 * the result is a card-sized link a screen-reader user cannot identify (WCAG
 * 2.4.4 / 4.1.2). It bites harder here than on an insight card, because this
 * card is always the largest thing in its band.
 *
 * So a blank heading renders **no heading element and no link at all**: the
 * card keeps its excerpt, chip and media and simply is not a navigation
 * target. Never a slug or an `'Untitled'` in its place — each invents
 * user-visible content the data does not carry (BRIEF §5 rule 10) and hides
 * the defect behind a plausible-looking card. `''` counts as blank: a heading
 * of one space is no more nameable than a missing one.
 */
const headingText = computed(() => (props.item.heading ?? '').trim())

const hasHeading = computed(() => headingText.value !== '')

/**
 * The excerpt, whole. `?? ''` because `excerpt` is `string | null` in
 * `bfInsightSchema`; the empty string then fails the template's `v-if` and no
 * empty `<p>` is rendered — which matters in a flex column, where an empty
 * child still contributes a `gap`.
 *
 * This is `wfCardFeatured.vue:18`'s `v-if="plain(item.excerpt)"` with the
 * retired helper removed: the guard and the rendered text stay one expression,
 * so they cannot disagree.
 */
const excerptText = computed(() => props.item.excerpt ?? '')

/**
 * …and the defect is announced rather than swallowed. Same shape as `bfMedia`'s
 * missing-`alt` warning (gh#26), `bfCard`'s outside-a-list warning (gh#29) and
 * the two earlier wrappers': a dev-time `console.warn`, never a thrown error,
 * with `import.meta.dev` keeping it out of the production bundle.
 */
if (import.meta.dev) {
  watchEffect(() => {
    if (!hasHeading.value) {
      console.warn(
        '[bfCardFeatured] `item.heading` is empty, so the card renders no '
        + 'heading and no link — a stretched link with no accessible name is '
        + `the alternative. slug: ${props.item.slug}`
      )
    }
  })
}
</script>

<template>
  <!--
    Order is `bfCard`'s, not this file's: heading **first in the DOM** so
    heading navigation lands at the start of the card, with the chip and the
    media pulled above it visually by `order: -1` / `-2` in the base's
    stylesheet. Never reorder the markup to change the picture.
  -->
  <bfCard v-bind="$attrs">
    <!--
      `h2` / `h3` / `h4` from `headingLevel` (#128) — the three levels
      `bfCard`'s stylesheet matches (D-20.4). `v-if="hasHeading"` is #130: no
      heading text means no element and no anchor, rather than a card-sized
      link with nothing to announce.

      One link per card, stretched over the whole card by `bfCard`'s `::after`,
      with the heading text as its accessible name — no "View" CTA repeated
      down the strip. `wfCardFeatured.vue`'s own header comment records that
      the old `href="#"` "View" link was dropped for exactly that reason; this
      is that decision, kept.
    -->
    <component :is="`h${headingLevel}`" v-if="hasHeading">
      <NuxtLink :to="`/insights/${item.slug}`">{{ headingText }}</NuxtLink>
    </component>

    <p v-if="excerptText">{{ excerptText }}</p>

    <template #chips>
      <!--
        A literal, not `formatLabel(item.format)`. All eight curated rows carry
        `format: null`, and the word this card exists to say is the *curation*
        ("we picked this"), which is not a field on the row.
      -->
      <bfChip>Featured</bfChip>
    </template>

    <template #media>
      <!--
        Decorative: the heading already names the destination, so a second
        announcement of the same title would be a duplicate rather than a
        description. `alt=""` is the *deliberate* decorative declaration —
        `bfMedia` warns at dev time when `alt` is merely omitted (gh#26).

        `16/9` is hard-coded rather than a `mediaRatio` prop: one call site, so
        the rule of three is not met. It is `bfMedia`'s `ratio`, which lands as
        a `--_bf-media-ratio` declaration a consumer stylesheet can still
        re-proportion.
      -->
      <bfMedia :src="item.image" alt="" ratio="16/9" />
    </template>
  </bfCard>
</template>
