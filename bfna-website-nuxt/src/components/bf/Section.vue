<script setup lang="ts">
/**
 * `bfSection` — the base band every template composes.
 *
 * Evolves `components/wireframe/wfSection.vue` (frozen, D2 — read, never
 * edited), whose whole body is:
 *
 * ```vue
 * <section class="wf-slot" :data-label="label">
 *   <div
 *     :class="layout === 'plain' ? 'center' : `center | ${layout}`"
 *     :data-gap="layout === 'plain' ? undefined : gap"
 *     :data-measure="measure"
 *     :style="padded ? 'padding-block: var(--space-l);' : undefined"
 *   >
 *     <h2 v-if="heading">{{ heading }}</h2>
 *     <slot />
 *   </div>
 * </section>
 * ```
 *
 * It is the most-reused `wf-*` component — 26 call sites across 9 wireframe
 * pages plus `wfCtaSection` — so the structure is kept element for element and
 * attribute for attribute. What changes is the two documented defects, and the
 * skin.
 *
 * Presentational-only (D8): props in, one slot, nothing out.
 *
 * ## Defect 1 — `fullWidth` was a no-op
 *
 * `ccmSection` documents a `fullWidth` prop and ships no CSS for it; the same
 * shape was carried into `wfSection`, which does not even declare the prop.
 * Here it is a real break-out rule, in `@layer components`, and probe 39
 * measures the broken-out band against its own parent's content box rather
 * than trusting the class name.
 *
 * ## Defect 2 — props leaked onto the DOM as junk attributes
 *
 * The inventory's example is an `image-left` rendered literally on the
 * `<section>`. Two mechanisms produce that, and both are closed here:
 *
 * 1. **A typed prop reaching the DOM.** Declared props never enter `$attrs`,
 *    so this half is closed by `defineProps` — but only for props that are
 *    *declared*. `fullWidth` is now one of them; upstream it was not, which is
 *    exactly why it rendered as `full-width="true"` instead of doing anything.
 * 2. **An undeclared, prop-shaped attribute falling through.** Plain
 *    fallthrough renders whatever the call site passed, junk included. So this
 *    component sets `inheritAttrs: false` and binds a **filtered** `$attrs` to
 *    the root: the attributes a band can legitimately compose from outside
 *    (ADR-1, BRIEF §5 rule 4) pass, and a prop-shaped stray like `image-left`
 *    is dropped.
 *
 * The filter is an allowlist rather than a denylist on purpose — a denylist
 * has to enumerate every prop name every future caller might mistype, which is
 * the same losing game the defect came from.
 *
 * ## No `split` and no `video` layout
 *
 * The inventory asks this component to absorb the "split section" and "video
 * section" variants as `layout` options. All 26 `wf-section` call sites were
 * surveyed: exactly one passes `layout="switcher"` (the Bertelsmann Stiftung
 * band on `about.vue` — media beside text, which *is* the split shape), one
 * passes `layout="plain"`, the rest take the `stack` default, and no video
 * band exists anywhere under `pages/wireframes/`. `switcher` covers it. See
 * `SectionLayout` in `types/bf-contracts.ts` and the spec's Decisions.
 */
import type { SectionProps } from '~/types/bf-contracts'

defineOptions({
  name: 'BfSection',
  /*
   * Half of defect 2. With fallthrough off, nothing reaches the DOM that this
   * component did not put there — see `rootAttrs` for what it puts there.
   */
  inheritAttrs: false
})

const props = withDefaults(defineProps<SectionProps>(), {
  gap: 'm',
  layout: 'stack'
})

/**
 * Attributes that may compose onto the band from outside, by exact name.
 *
 * `class` and `style` because a caller layering a template-level modifier or
 * setting one of this component's hooks is the documented contract; `id`
 * because the wireframe's own call sites use it as an in-page anchor target
 * (`about.vue` passes `id="board"` and `id="team"`, `[area].vue` passes
 * `id="projects"`); the rest because they are global attributes whose meaning
 * on a `<section>` is the platform's and not this component's to withhold.
 */
const PASS_THROUGH_ATTRS: ReadonlySet<string> = new Set([
  'class', 'style', 'id', 'role', 'title', 'lang', 'dir', 'hidden', 'tabindex'
])

/**
 * Attribute-name prefixes that pass wholesale: every `data-*` (the epic's own
 * probes and tests select on them) and every `aria-*` (withholding an ARIA
 * attribute would make the band less accessible, never more).
 */
const PASS_THROUGH_PREFIXES = ['data-', 'aria-'] as const

/**
 * `$attrs`, filtered to what a `<section>` may legitimately be given from
 * outside. Everything else — the `image-left`-shaped junk this issue exists to
 * stop — is dropped rather than rendered.
 *
 * Listeners (`onClick`, `onKeydown`, …) pass too: they are not attributes, they
 * never reach the DOM as markup, and dropping them would silently break any
 * caller that binds one.
 */
const attrs = useAttrs()

const rootAttrs = computed<Record<string, unknown>>(() => {
  const forwarded: Record<string, unknown> = {}

  for (const [name, value] of Object.entries(attrs)) {
    const lower = name.toLowerCase()
    const allowed
      = PASS_THROUGH_ATTRS.has(lower)
        || PASS_THROUGH_PREFIXES.some(prefix => lower.startsWith(prefix))
        /* Vue normalises listeners to `onXxx`; `on` alone is not one. */
        || /^on[A-Z]/.test(name)

    if (allowed) forwarded[name] = value
  }

  return forwarded
})

/**
 * The inner box's class list — `wfSection`'s own expression, unchanged.
 *
 * `|` is a real class token in this codebase's CUBE dialect, not punctuation:
 * it separates the block from the composition primitives that lay it out.
 */
const innerClass = computed(() =>
  props.layout === 'plain' ? 'center' : `center | ${props.layout}`
)

/**
 * `data-gap`, omitted for `plain` — `wfSection`'s own conditional. A `plain`
 * band renders no composition primitive, so a gap attribute on it would name a
 * rhythm nothing reads.
 */
const innerGap = computed(() =>
  props.layout === 'plain' ? undefined : props.gap
)
</script>

<template>
  <!--
    One root, so the filtered `$attrs` has exactly one destination.

    `v-bind="rootAttrs"` is last on purpose: an attribute the call site really
    passed wins over one derived from a prop, which is what "composes from
    outside" means. `class` is the exception the platform makes and Vue's
    `mergeProps` honours — it concatenates, so an outside `class` merges with
    `bf-section` rather than replacing it.
  -->
  <section
    class="bf-section"
    :class="{
      'bf-section--padded': padded,
      'bf-section--full-width': fullWidth
    }"
    :data-label="label"
    v-bind="rootAttrs"
  >
    <!--
      The wireframe's inner box, kept exactly: `.center` gives the column its
      measure and inline padding, the layout class lays the children out, and
      both live in `@layer composition` — nothing in this file re-states them.

      No `:style` binding. The wf source puts `padding-block` here inline when
      `padded` is set; that inline declaration is the "junk on the DOM" pattern
      this component retires, and it is also unbeatable by any ordinary rule a
      consumer might write (the `bfMedia` lesson, gh#26). It is a modifier
      class on the root instead.
    -->
    <div
      :class="innerClass"
      :data-gap="innerGap"
      :data-measure="measure"
    >
      <!--
        `v-if`, so an absent heading renders no element rather than an empty
        `<h2>` that would still take a gap in the stack. Rank fixed at 2 — see
        `SectionProps.heading`.
      -->
      <h2 v-if="heading" class="bf-section__heading">{{ heading }}</h2>
      <slot />
    </div>
  </section>
</template>

<style scoped>
/*
  `@layer components` must survive into the built stylesheet — see the note in
  `Button.vue`; `postcss-preset-env`'s cascade-layer polyfill would otherwise
  flatten this into unlayered rules that outrank every layer (gh#101). Probe 39
  reads the live CSSOM for this rule's layer membership.

  No colour of any kind is declared here (BRIEF §5 rule 2, D5): the band paints
  nothing, and the dashed border, the corner label and the grey ground of
  `.wireframe .wf-slot` are wireframe *skin*, not band geometry. No `:not()`
  appears below, complex-selector or otherwise (D-20.5).
*/
@layer components {
  .bf-section {
    /*
      The band's own vertical padding, applied only by `--padded`. The value is
      `.wireframe .wf-slot`'s own `padding-block` — the band rhythm the
      wireframe was approved at — ported by value rather than by class name,
      the way `bfHero` ported `min-height: 60svh` (gh#46).

      Declared in the rule rather than bound inline so a consumer can outrank
      it with an ordinary rule.
    */
    --_bf-section-padding-block: var(--space-3xl);

    /*
      Two pass-through hooks. Each *defaults to the value the composition layer
      would have used anyway*, so declaring them changes nothing until a call
      site sets one — and then the band's rhythm and measure retune from one
      place instead of from every child.

      `--theme-*` are the composition layer's own documented inputs
      (`composition/stack.css`, `switcher.css`, `center.css`;
      `themes/theme.css` lists them, commented out). They sit *below* the
      `data-gap` / `data-measure` rules, so a per-call-site attribute still
      wins — which is why these are written as theme inputs rather than as
      `--_stack-space` directly: a components-layer `--_stack-space` would beat
      `@layer composition` outright and make `data-gap` inert.
    */
    --_bf-section-gap: var(--space-s);
    --_bf-section-measure: var(--theme-center-measure, 1100px);

    /*
      The break-out width. Hooked, because `100vw` includes the vertical
      scrollbar's gutter: on a scrolling page a broken-out band is a scrollbar's
      width wider than the layout viewport and adds a horizontal scrollbar. A
      shell that would rather clip than scroll sets this to `100%` (or pins
      `scrollbar-gutter: stable` on the root) without touching this file.
      `100dvw` and `100cqw` were considered — the first has the identical
      behaviour, the second needs a container this band does not have.
    */
    --_bf-section-full-width: 100vw;
  }

  /*
    The `padded` modifier. A class plus a variable, never an inline style —
    `SectionProps.padded` says why.
  */
  .bf-section--padded {
    padding-block: var(--_bf-section-padding-block);
  }

  /*
    Defect 1, fixed: the break-out rule `fullWidth` never had.

    `margin-inline: calc(50% - 50vw)` pulls each edge out by exactly half the
    difference between the containing block's inline size and the viewport's —
    `50%` resolves against the parent's content box — so the band lands flush
    with both viewport edges whatever its container's measure is, and stays
    centred. `max-inline-size` is reset alongside `width` so an ancestor's
    measure cap cannot quietly re-narrow it.
  */
  .bf-section--full-width {
    width: var(--_bf-section-full-width);
    max-inline-size: var(--_bf-section-full-width);
    margin-inline: calc(50% - var(--_bf-section-full-width) / 2);
  }

  /*
    The two hooks, handed to the composition layer on the inner box only.

    `.cluster` is deliberately absent: `composition/cluster.css` reads
    `var(--_cluster-space, var(--space-s))` and exposes no `--theme-cluster-space`
    input, so there is nothing to write to. Writing `--_cluster-space` from this
    layer instead would outrank `@layer composition` and make
    `data-gap` inert on every clustered band — strictly worse than the hook
    being unavailable for one primitive. Recorded in the spec's Decisions; the
    composition layer is not this issue's to change.
  */
  .bf-section > .center {
    --theme-stack-space: var(--_bf-section-gap);
    --theme-switcher-space: var(--_bf-section-gap);
    --theme-center-measure: var(--_bf-section-measure);
  }
}
</style>
