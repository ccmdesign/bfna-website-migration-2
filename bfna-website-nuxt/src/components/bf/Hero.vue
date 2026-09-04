<script setup lang="ts">
/**
 * `bfHero` — the homepage hero band.
 *
 * Evolves `components/wireframe/wfHero.vue` (frozen, D2 — read, never
 * edited), whose whole body is:
 *
 * ```vue
 * <section class="wf-slot wf-hero" data-label="Hero">
 *   <div class="center | stack" data-gap="s">
 *     <h1>{{ heading }}</h1>
 *     <p v-if="description" data-measure="normal">{{ description }}</p>
 *     <div v-if="$slots.default" class="cluster" data-gap="s">
 *       <slot />
 *     </div>
 *   </div>
 * </section>
 * ```
 *
 * That structure is already composition-driven, so it is kept element for
 * element and attribute for attribute. Four things change, and only four: the
 * wireframe skin's class names go, the band's own geometry moves out of
 * `public/css/wireframe.css` and into this file, the props type moves to
 * `types/bf-contracts.ts` (BRIEF §5 rule 11), and the actions wrapper is
 * guarded on what the slot *renders* rather than on whether one was passed —
 * residual #162, taken at the first real consumer (gh#56) and explained on
 * `hasRenderedContent` below.
 *
 * Presentational-only (D8): two props in, one slot, nothing out. No data
 * access, no store, no composable.
 *
 * ## The band geometry, ported by value
 *
 * `wireframe.css` says, of the hero and nothing else:
 *
 * ```css
 * .wireframe .wf-hero { min-height: 60svh; display: grid; align-content: center; }
 * ```
 *
 * All three are ported below — the **values**, not the class name, which is
 * what the spec asks for and what D2 requires of anything that reads a frozen
 * file. They are what makes this a *band* rather than a paragraph with a big
 * first line: a tall box whose single grid row is centred in it, so the copy
 * sits in the optical middle of the fold regardless of how long it is.
 *
 * `min-height`, not `min-block-size`, deliberately: the ported declaration is
 * the property the source writes, and the two are only interchangeable while
 * the writing mode is horizontal.
 *
 * The height alone is variable — a hub or a campaign page may want a shorter
 * band — so it is the one value behind a hook, `--_bf-hero-min-height`
 * (BRIEF §5 rule 4's `--_bf-{component}-{property}`). `display` and
 * `align-content` are not hooks: a caller that wants a different layout
 * inside this section wants a different section.
 *
 * ## Exactly one `<h1>`, unconditionally
 *
 * The `<h1>` is not guarded, and there is no prop to change its rank — see
 * `HeroProps` for why, and for why `heading` is nonetheless optional. A hero
 * is what a page is about; it renders the page's heading or it renders an
 * empty one, and a caller that wants this shape lower down the page wants
 * `bfPageHeader` (issue 38).
 *
 * ## Spacing and size come from layers this file does not touch
 *
 * `.center | stack` with `data-gap="s"` is the wireframe's own class list,
 * kept exactly: the measure, the centring and the vertical rhythm are
 * `composition/center.css` and `composition/stack.css`'s, and the actions'
 * horizontal rhythm is `composition/cluster.css`'s. `data-measure="normal"`
 * caps the standfirst at 75ch through the same layer.
 *
 * There is **no `font-size` anywhere below**. `h1` already resolves to
 * `var(--size-4)` and the `<p>` to the body size, both from the Utopia scale
 * in `base/typography.css`'s `@layer defaults`. A bespoke size here is exactly
 * what the spec forbids, and would also mean this component disagreed with
 * every other `h1` in the system.
 *
 * ## The photograph and the scrim (gh#253)
 *
 * This band did paint nothing at all until gh#253, and its own comment said
 * so. The design phase gave it an image, and the rule that comes with one is
 * measured rather than chosen: a navy scrim at **0.70** is the first alpha at
 * which white clears 4.5:1 over a blown-out white photograph, which is BFNA's
 * house style, and at that alpha nothing else in the palette clears it at all
 * — the ceiling over that ground is 4.840 and pure white is what reaches it.
 * **So over media, type is white; programme colour appears only as an opaque
 * fill, never as text.**
 *
 * The whole treatment is `bfHeroMedia`, shared with `bfPageHeader` — read
 * that component for the argument. This band contributes four things and no
 * more: the containing block and stacking context it needs, the `data-scrim`
 * attribute that selects its mode, the inverted text colour, and the two
 * inversions a dark ground forces on the controls inside it — a visible focus
 * ring and a visible control boundary.
 * Every value below still comes from a token; no colour literal appears in
 * this file, which is what `docs/ds-epic/issues/37-bf-hero.md:67`'s narrowed
 * gate asserts.
 *
 * ## What is still not here
 *
 * No carousel: no wireframe evidence for one. No `:not()` appears in the
 * stylesheet, complex-selector or otherwise (D-20.5). No `.cover`, `.frame`
 * or `.imposter` — all three are written and used zero times, and `.cover`
 * would regress the `svh` fix below by defaulting to `100vh`.
 */
import { Comment, Fragment, Text, useSlots, type VNode } from 'vue'
import type { HeroProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfHero' })

withDefaults(defineProps<HeroProps>(), { imageAlt: '', scrim: 'full' })

const slots = useSlots()

/**
 * Does the default slot actually render something?
 *
 * **This is the one behavioural change from the frozen source**, and it closes
 * residual [#162](https://github.com/ccmdesign/bfna-website-migration-2/issues/162),
 * which asked for the decision to be taken at the first real consumer — the
 * home page (#47 / gh#56), where this component finally serves a `/` route
 * rather than a probe.
 *
 * The source guards the actions wrapper with `$slots.default`, which is truthy
 * whenever the parent *passed* a slot — including one whose content is `v-if`'d
 * away. A call site written
 *
 * ```vue
 * <bfHero …>
 *   <bfButton v-if="cta" :to="cta.to">{{ cta.label }}</bfButton>
 * </bfHero>
 * ```
 *
 * would then render an empty `.cluster` on every page with no CTA: a
 * zero-height flex box that is still a `.stack` child and still takes a
 * `data-gap="s"` gap under the copy. Probe 37 found it from its own template on
 * the first run, which is why that probe mounts two branches rather than one
 * `<template v-if>` inside a slot.
 *
 * The shape is `bfPageHeader`'s (gh#47), adopted here verbatim rather than
 * lifted into a shared helper: two components is not yet a pattern, and the
 * two guards can still be judged against each other while they are both in
 * view. If a third wants it, that is the issue that extracts it.
 *
 * Every honest call site behaves exactly as it did on the wireframe, because a
 * slot that renders content still renders content. A comment is what
 * `v-if="false"` leaves behind; a fragment is what a `<template>` wrapper
 * produces and is recursed into; a whitespace-only text node is the newline
 * between two tags. Anything else — an element, a component, real text —
 * counts.
 */
const hasRenderedContent = (nodes: VNode[] | undefined): boolean => {
  if (!nodes) return false

  return nodes.some((node) => {
    if (node.type === Comment) return false
    if (node.type === Text) return String(node.children ?? '').trim() !== ''
    /*
      A fragment is what a `<template>` wrapper produces. Its children are an
      array in every case Vue's compiler emits, but the vnode type also admits a
      string and a slots object, and `.some` on either would throw inside a
      render — so the array check is the guard, not the cast.
    */
    if (node.type === Fragment) {
      return Array.isArray(node.children)
        ? hasRenderedContent(node.children as VNode[])
        : false
    }
    return true
  })
}

/**
 * Called from the template rather than wrapped in a `computed`, on purpose: a
 * slot's rendered content is not a reactive dependency, so a cached computed
 * could hold a stale answer across a parent re-render that changed it. A
 * template expression is re-evaluated on every render, which is exactly the
 * cadence the slot itself is re-created on.
 */
const showActions = (): boolean => hasRenderedContent(slots.default?.())
</script>

<template>
  <!--
    One root, so `$attrs` has exactly one destination and `inheritAttrs` is
    left at its default: a caller's `class` merges with `bf-hero` rather than
    replacing it, and a caller's `style` can set the height hook.
  -->
  <section
    class="bf-hero"
    :class="{ 'bf-hero--media': Boolean(image) }"
    :data-scrim="image ? scrim : undefined"
  >
    <!--
      The photograph and its scrim, gh#253. A **sibling** of the inner box and
      a direct child of the band, never a `.stack` child: `composition/stack.css`
      spaces with `> * + *` margin rather than `gap`, so an absolutely
      positioned layer inside one still takes a `margin-block-start` that
      shrinks and offsets it. `bfHeroMedia` carries the whole treatment; this
      band contributes only the containing block and the attribute.

      `v-if`, so a hero with no image renders exactly the markup it rendered
      before this prop existed — no wrapper, no scrim, no `data-scrim`.
    -->
    <bfHeroMedia v-if="image" :src="image" :alt="imageAlt" />

    <!--
      The wireframe's inner box, unchanged. `.center` gives the column its
      measure and its inline padding; `.stack` makes it a column and owns the
      gap between the three children. Both live in `@layer composition`;
      nothing in this file re-states them.
    -->
    <div class="center | stack" data-gap="s">
      <!--
        Unconditional, and the page's own heading. See the block comment.
      -->
      <h1 class="bf-hero__heading">{{ heading }}</h1>

      <!--
        `v-if`, so an absent or null description renders no element — an empty
        `<p>` would still be a `.stack` child and would still take a gap.
      -->
      <p v-if="description" class="bf-hero__description" data-measure="normal">
        {{ description }}
      </p>

      <!--
        The actions wrapper exists only when the slot renders something —
        `showActions()`, not `$slots.default`. That is residual #162's fix and
        the one place this component diverges from the frozen source; the
        reasoning is on `hasRenderedContent` above. Rendered unconditionally it
        would put an empty flex box, and the gap above it, under every
        actionless hero.

        `.cluster` rather than a second `.stack`: the buttons read as a row
        that wraps, which is what a cluster is for.
      -->
      <div v-if="showActions()" class="cluster bf-hero__actions" data-gap="s">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
/*
  `@layer components` must survive into the built stylesheet — see the note in
  `Button.vue`; `postcss-preset-env`'s cascade-layer polyfill would otherwise
  flatten this into unlayered rules that outrank every layer (gh#101). Probe 37
  reads the live CSSOM for this rule's layer membership.
*/
@layer components {
  /*
    The three declarations `.wireframe .wf-hero` carries, and nothing else.
    Probe 37 asserts that this rule declares no `font-size` and no colour, so a
    later "small fix" that reaches for a bespoke type size or paints a ground
    fails a row rather than quietly landing.
  */
  .bf-hero {
    /*
      Declared in the rule rather than bound inline, so a consumer can outrank
      it with an ordinary rule; an inline style cannot be outranked by one —
      the `bfMedia` lesson from gh#26.

      `60svh` is `wireframe.css`'s own value. `svh`, not `vh`: on a mobile
      browser whose toolbars retract, `vh` resolves to the *large* viewport and
      the band overflows the first screen it is measured against.
    */
    --_bf-hero-min-height: 60svh;

    min-height: var(--_bf-hero-min-height);

    /*
      A one-row grid whose row is centred in the band. This is the pair that
      makes the copy sit in the optical middle rather than at the top of a tall
      box, and it is why `min-height` is a floor rather than a fixed height:
      copy longer than the band grows it instead of spilling out.
    */
    display: grid;
    align-content: center;

    /*
      The containing block for `bfHeroMedia`, and the stacking context that
      makes its `z-index: -1` safe. gh#253.

      `isolation: isolate` is the load-bearing half: it makes this element a
      stacking context, so the media layer paints above this band's own
      background and below every in-flow descendant, and cannot slide behind
      the page. The alternative — raising the content column with
      `position: relative; z-index: 1` — is what `bfPageHeader` could not do,
      because its column belongs to `bfSection`; using the same mechanism in
      both places is what makes `bfHeroMedia` one component rather than two.

      Declared unconditionally rather than under the `--media` modifier. Both
      are inert on a band with no positioned descendant, and a band whose
      geometry changes when a photograph arrives is the kind of thing that
      makes a layout bug depend on the content.
    */
    position: relative;
    isolation: isolate;
  }

  /*
    With a photograph, the band is dark and its type is white — the rule the
    scrim's alpha was chosen to make true (`--color-scrim`, 0.70, white at
    4.840 over the worst case). `color` on the band rather than on each
    element, so the `<h1>`, the standfirst and anything a template puts in the
    actions cluster all inherit it.

    No programme colour anywhere in this rule, deliberately. At this alpha the
    programme hues measure 1.92 / 1.64 / 1.87 as text over the scrim; they
    appear in a hero only as an opaque fill, which does not composite with the
    photograph. That also means nothing this component declares is scoped by
    `[data-program]`, so the band does not recolour per route.
  */
  .bf-hero--media {
    color: var(--color-text-inverse);
  }

  /*
    The focus ring, inverted. `base/focus.css:76-82` outlines with
    `--color-text` — near-black — and the stack has no inverse variant, so on
    a navy scrim the indicator all but disappears (WCAG 2.4.7). That file sits
    in `@layer defaults` precisely so a component layer can win, which this
    does.

    `:deep()` because the controls in a hero are slot content and
    child-component roots, and neither carries this component's scope id.

    `outline-color` as a longhand at specificity (0,3,0) also outranks
    `bfButton`'s and `bfBreadcrumb`'s own `outline:` shorthands at (0,2,0) in
    this same layer, so one rule covers every control the band can hold
    without reaching into any of their `--_bf-*-focus-color` hooks.
  */
  .bf-hero--media :deep(:focus-visible) {
    outline-color: var(--color-text-inverse);
  }

  /*
    The controls' visible boundary, gh#253 — WCAG 1.4.11, and a regression
    this band would otherwise introduce rather than an adjacent issue.

    `bfButton`'s `primary` variant fills and outlines itself with
    `--color-primary`. Against a white page that reads at 6.3:1; against this
    band's scrim over the real photograph it measured **1.22:1**, so the
    control had no discernible edge at all. The `default` variant is worse
    still on a dark ground: `--color-text` label on `--_bf-button-bg: none`.

    `border-color` as a longhand rather than through `--_bf-button-border`,
    because `primary` writes that hook **inline** (`Button.vue:135-139`) and
    an inline declaration cannot be outranked by any rule. The longhand at
    (0,3,0) beats the component's own `border:` shorthand at (0,1,0) in the
    same layer, so it lands on both variants. White on this scrim is 4.84:1,
    comfortably past the 3:1 floor.

    `--_bf-button-color` *is* written through the hook, because it is only the
    `default` variant that needs it — `primary` already writes
    `--color-text-inverse` inline, and an inline value winning there is the
    right outcome.

    The focus ring stays distinguishable from this keyline: it is an `outline`
    with `outline-offset`, so it draws a second ring outside the border with
    the band's ground showing between them.
  */
  .bf-hero--media :deep(.bf-button) {
    --_bf-button-color: var(--color-text-inverse);

    border-color: var(--color-text-inverse);
  }
}
</style>
