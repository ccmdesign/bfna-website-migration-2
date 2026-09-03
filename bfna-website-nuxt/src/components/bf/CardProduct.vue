<script setup lang="ts">
/**
 * `bfCardProduct` — the external-only product/magazine card: a **typed
 * wrapper** over `bfCard`, and the "special" full-width item that leads the
 * homepage Insights grid.
 *
 * Ports `components/wireframe/wfCardProduct.vue` (issue 26 / gh#35). That file
 * is frozen (D2) and is not touched here.
 *
 * The sixth of the typed wrappers, written against the contract `bfCardInsight`
 * settled in D-21.1 rather than re-deciding it: the wrapper owns no DOM
 * (`inheritAttrs: false`, root of `<bfCard v-bind="$attrs">`), the prop is the
 * **entity** and not a hand-written subset of its fields, the component is
 * presentational-only (BRIEF D8 — no `queryCollection`, no store, no data
 * composable), it takes the shared `headingLevel` (#128), and it ships **no
 * `<style>` block at all**, because every pixel it renders is already styled by
 * `bfCard`'s `@layer components` rules and by the `--_bf-chip-*` /
 * `--_bf-media-*` hooks the two atoms bring. With no stylesheet, BRIEF §5 rule
 * 2 (no new colour) and D-20.5 (no `:not()` holding a complex selector) are
 * satisfied vacuously.
 *
 * ## `span="full"` is this wrapper's own default, not a caller's decision
 *
 * The root is `<bfCard span="full" v-bind="$attrs">`. That is the one place
 * this component differs from its five siblings, all of which leave `span`
 * entirely to `$attrs` (D-21.2), and it is a straight port of the frozen
 * source's hardcoded `data-span="full"` on its `<wf-card>` root: a product card
 * is *always* the double-width 2×1 slot. A caller that wants it otherwise still
 * can — `v-bind="$attrs"` is merged **after** the prop, so a fallthrough
 * `span` or `data-span` wins — but nobody has to ask for the normal case.
 *
 * The **mechanism** stays issue 20's (#29) and is not restated here: `bfCard`
 * renders `:data-span="span"` and its own stylesheet resolves
 * `.bf-card[data-span="full"] { grid-column: 1 / -1 }`. This component emits no
 * column placement, no authored column template and no inline style — the
 * `span` prop is the only layout signal it sends.
 *
 * (Those two property names are spelled out in the paragraph above and
 * deliberately *not* repeated here: the spec's acceptance greps this file for
 * one of them, and a doc comment quoting it would fail a check that is asking
 * about the code — the same complaint #115 fixed by running its greps over
 * comment-stripped source.)
 *
 * ## There is no `NuxtLink` branch, and that is the point of the card
 *
 * Every other wrapper's heading links to an internal route. A **product** is
 * external-only by definition (`external_only: true` on its `bfProjects` row):
 * it has no overview page on this site, so there is nothing internal to link
 * to. The heading is therefore either an external `<a :href>` or **plain text
 * with no anchor at all** — never a link to a page that does not exist.
 *
 * Today the one real product, `transponder-magazine`, carries
 * `external_url: null` and `pending: "Q6"`, so the *unlinked* branch is the one
 * the live site renders. The pending chip carries that status instead of a
 * broken link, exactly as `wfCardProduct.vue` decides it.
 *
 * ## D-26.1 — the external marker is decided by `isExternal()`, not asserted
 *
 * The spec's Scope writes a bare, unconditional `data-external` on the anchor,
 * which is what the frozen source does. This binds it through `utils/link.ts`'s
 * `isExternal()` instead — the shared rule issue 19 exists to state once, so
 * that five call sites stop re-deciding whether a string leaves the site.
 *
 * The reasoning is `bfCardProject`'s D-22.3 applied in the opposite direction.
 * There, the marker was dropped from a link that goes to `/projects/…`, because
 * an attribute meaning *"this href goes off-site"* would lie on an internal
 * route. Here the href is off-site in every real row, so the marker is honest —
 * but an `external_url` pointing at `www.bfna.org` (which the schema permits:
 * it is a bare `z.string().nullable()`) would make it lie again. One rule,
 * asked rather than assumed. The rendered output is identical for every product
 * the data actually carries; the probe asserts both branches.
 *
 * ### What the marker renders on a card heading: nothing, by cascade
 *
 * `external-link.css` paints the `↗` through `a[data-external]::after`
 * — specificity (0,1,1). `bfCard`'s stretched link is
 * `.bf-card :is(h2, h3, h4) a::after { content: ""; position: absolute; inset: 0 }`
 * — (0,1,2), because `:is()` takes the specificity of its most specific
 * argument. Same layer, so the more specific rule wins and the arrow's
 * `content` is overwritten by the empty string that makes the card clickable.
 *
 * That is **the frozen skin's behaviour too** (`.wf-card h3 a::after` against
 * `.wireframe a[data-external]::after`, the same arithmetic), so it is parity
 * rather than a regression, and this component does not invent a visible marker
 * the wireframe never showed. It is recorded here because it is genuinely
 * surprising, and the probe measures the resolved `content` rather than
 * trusting this paragraph.
 *
 * ## `plain()` is not called
 *
 * As in every wrapper since `bfCardInsight`: HTML stripping moved into the
 * build-time normaliser (issue 07) and the helper is retired (issue 10), so
 * `excerpt` / `description` already arrive as plain text and re-deriving the
 * strip here would be a second, drifting copy of it.
 */
import type { CardWrapperProps, Project } from '~/types/bf-contracts'
import { isExternal } from '~/utils/link'

defineOptions({
  name: 'BfCardProduct',
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
   * One `bfProjects` row — in practice one carrying `external_only: true`,
   * which is what makes it a *product*. Passed whole; this component fetches
   * nothing, and it is the **caller** (issue 47's home "Insights" band) that
   * queries the collection.
   *
   * Typed as the whole `Project`, not as an `external_only`-narrowed variant:
   * products are not a different shape, they are a bucket the data carries,
   * and there is no `bfProducts` schema to import (issue 09 defines six
   * collections and this is not one of them). A card that demanded the flag
   * would also be unusable for a hand-built preview.
   */
  product: Project
  /**
   * Character budget for the excerpt before it is cut and given an ellipsis.
   * `220` is the frozen source's own default — a wider budget than
   * `bfCardProject`'s 140 or `bfGridInsights`'s 160, because this card is twice
   * as wide as its neighbours and a 140-character blurb would leave it looking
   * empty.
   */
  excerptLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  /* The no-change level; see `CardWrapperProps`. */
  headingLevel: 3,
  excerptLength: 220
})

/**
 * The heading text, trimmed — and the #130 guard, applied to this wrapper for
 * the same reason it is applied to the five before it.
 *
 * `bfProjectSchema` types `heading` as a non-nullable `z.string()`, so this is
 * defensive rather than latent: what it rules out is the **empty** string a
 * normaliser change or a hand-built fixture could introduce. A blank heading
 * renders no heading element, and therefore no anchor, so the card can never
 * become a card-sized link with no accessible name (WCAG 2.4.4 / 4.1.2) —
 * never a slug in its place, and never an invented label, each of which would
 * synthesise user-visible content the data does not carry (BRIEF §5 rule 10).
 */
const headingText = computed(() => (props.product.heading ?? '').trim())

const hasHeading = computed(() => headingText.value !== '')

/**
 * The heading is a link only when there is somewhere external to send the
 * reader. Not `isExternal()` — that decides how the link is *marked*, and a
 * relative or malformed `external_url` is still the only destination the row
 * offers, so suppressing the anchor on it would silently drop the card's one
 * navigation.
 */
const href = computed(() => props.product.external_url ?? '')

const hasLink = computed(() => href.value.trim() !== '')

/**
 * D-26.1. `|| undefined` so the attribute is **absent** rather than rendered as
 * `data-external="false"` on an internal href — the same shape `bfChip` and
 * `bfButton` use, and the shape `external-link.css`'s own header comment
 * relies on (`[data-external]` matches any value, `"false"` included).
 */
const externalMarker = computed(() => isExternal(href.value) || undefined)

/**
 * `product.excerpt ?? product.description`, truncated — the frozen
 * expression, kept exactly, including the consequence that an **empty-string**
 * excerpt does not fall back to the description, because `''` is not nullish.
 *
 * `.trimEnd()` before the ellipsis so a cut landing on a space does not render
 * `word …`; the guard and the rendered text are one expression, so they cannot
 * disagree, and an empty result fails the template's `v-if` rather than
 * emitting an empty `<p>` that would still contribute a `gap` to `bfCard`'s
 * flex column.
 */
const blurb = computed(() => {
  const text = props.product.excerpt ?? props.product.description ?? ''
  return text.length > props.excerptLength
    ? `${text.slice(0, props.excerptLength).trimEnd()}…`
    : text
})

/**
 * The quarter the external URL is expected in, for the pending chip. `Q6` is
 * the frozen source's fallback and `pending` is `z.string().optional()`, so
 * both halves are real.
 */
const pendingLabel = computed(() => props.product.pending ?? 'Q6')

/**
 * The defect is announced rather than swallowed — same shape as `bfMedia`'s
 * missing-`alt` warning (gh#26), `bfCard`'s outside-a-list warning (gh#29) and
 * the five wrappers before it: a dev-time `console.warn`, never a thrown error,
 * with `import.meta.dev` keeping it out of the production bundle.
 */
if (import.meta.dev) {
  watchEffect(() => {
    if (!hasHeading.value) {
      console.warn(
        '[bfCardProduct] `product.heading` is empty, so the card renders no '
        + 'heading and no link — a stretched link with no accessible name is '
        + `the alternative. slug: ${props.product.slug}`
      )
    }
  })
}
</script>

<template>
  <!--
    `span="full"` first, `v-bind="$attrs"` second: the wrapper's default, which
    a caller can still override because fallthrough attributes are merged last.
    See the `span` note in the component comment — the mechanism is `bfCard`'s
    (#29) and nothing about it is restated here.

    Order is `bfCard`'s, not this file's: heading **first in the DOM** so
    heading navigation lands at the start of the card, with the chips and the
    media pulled above it visually by `order: -1` / `-2` in the base's
    stylesheet. Never reorder the markup to change the picture.
  -->
  <bfCard span="full" v-bind="$attrs">
    <!--
      `h2` / `h3` / `h4` from `headingLevel` (#128) — the three levels
      `bfCard`'s stylesheet matches (D-20.4). `v-if="hasHeading"` is #130.
    -->
    <component :is="`h${headingLevel}`" v-if="hasHeading">
      <!--
        A raw `<a>`, never a `NuxtLink`: the destination is another site, and
        there is no internal route for a product to fall back to. When there is
        no `external_url` the heading is plain text — the pending chip below
        carries that status, which is `wfCardProduct.vue`'s own decision.
      -->
      <a
        v-if="hasLink"
        :href="href"
        :data-external="externalMarker"
      >{{ headingText }}</a>
      <template v-else>{{ headingText }}</template>
    </component>

    <p v-if="blurb">{{ blurb }}</p>

    <template #chips>
      <!--
        A literal, as in `bfCardFeatured`: the word this card exists to say is
        what the thing *is*, and "Magazine" is not a field on the row —
        `kind` reads `podcast` on the Transponder document, which is the legacy
        CMS's noise rather than a description of a magazine.
      -->
      <bfChip>Magazine</bfChip>

      <!--
        Only on the unlinked branch. This chip is the whole reason a heading may
        render without an anchor: it says *why* the title is not a link, rather
        than leaving a reader to wonder.
      -->
      <bfChip v-if="!hasLink">External link pending {{ pendingLabel }}</bfChip>
    </template>

    <template #media>
      <!--
        Decorative: the heading already names the publication, so a second
        announcement of the same title would be a duplicate rather than a
        description. `alt=""` is the *deliberate* decorative declaration —
        `bfMedia` warns at dev time when `alt` is merely omitted (gh#26).

        `21/9` is load-bearing and hard-coded, per the frozen source's own
        comment: at double width this keeps the card about as tall as one row
        of featured cards — the "1" of the 2×1 slot. It reaches the image as
        `bfMedia`'s `--_bf-media-ratio` custom property (#26's override path),
        not as a hard `aspect-ratio`, so a consumer stylesheet can still
        re-proportion it. Not `bfCardProject`'s `3/2`.
      -->
      <bfMedia :src="product.image" alt="" ratio="21/9" />
    </template>
  </bfCard>
</template>
