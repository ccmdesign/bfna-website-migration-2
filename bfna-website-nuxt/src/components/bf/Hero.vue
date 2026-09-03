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
 * ## What is not here
 *
 * No background image and no art direction (D5) — the band paints nothing at
 * all, so it also declares no colour of any kind and adds no token (BRIEF §5
 * rule 2). No carousel: no wireframe evidence for one. No `:not()` appears in
 * the stylesheet, complex-selector or otherwise (D-20.5).
 */
import { Comment, Fragment, Text, useSlots, type VNode } from 'vue'
import type { HeroProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfHero' })

defineProps<HeroProps>()

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
  <section class="bf-hero">
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
  }
}
</style>
