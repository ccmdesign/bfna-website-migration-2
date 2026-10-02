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
 * There is **no `font-size` on the band's type**. `h1` already resolves to
 * `var(--size-4)` and the `<p>` to the body size, both from the Utopia scale
 * in `base/typography.css`'s `@layer defaults`. A bespoke size here is exactly
 * what the spec forbids, and would also mean this component disagreed with
 * every other `h1` in the system. The one size below is the pause control's
 * — UI chrome, not the band's copy — and it is a Utopia step too
 * (`--size--1`).
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
 *
 * ## The ink mode, `scrim="none"` (refined pass, Sep 2026)
 *
 * A light photograph whose sky or ground dark type reads over — the home
 * page's Capitol ↔ Reichstag pair — takes no scrim and keeps the page's ink.
 * The band is then `bf-hero--ink` instead of `bf-hero--media`, so none of the
 * three inversions below applies: the type, the focus ring and the buttons
 * keep their light-page paint, and `bfHeroMedia` paints no fill. The home
 * page used to reach the same place by overriding five of this file's rules
 * from outside, each winning by one extra class. The contrast in this mode is
 * the photograph's, so it is measured per photograph (`HeroScrimMode`).
 *
 * ## The crossfade's pause control (WCAG 2.2.2)
 *
 * `imageSecondary` creates a 20s two-photo loop; `imageSequence` extends it
 * with one photograph every 10s. Anything moving beside the heading and other
 * content needs a way to stop it. The control is this band's, not
 * `bfHeroMedia`'s: that layer paints at `z-index: -1` under the band's
 * content, where a button would sit beneath the content's own boxes. It is a
 * small opaque pill in the band's bottom-end corner — opaque, so it reads
 * over any photograph (navy on white, 11.66:1) — last in the DOM, after the
 * actions, so the tab order is heading, call to action, then the pause.
 *
 * It says what it will do ("Pause" / "Play", named "… the photographs")
 * rather than carrying `aria-pressed` under a fixed label, and it sets
 * `data-motion="paused"` on the band and passes `paused` to `bfHeroMedia`,
 * freezing either loop where it is. It renders only after mount, so the
 * prerendered page has no button that does nothing before hydration. It hides under
 * `prefers-reduced-motion`, where nothing moves.
 * Every value below still comes from a token; no colour literal appears in
 * this file, which is what `docs/ds-epic/issues/37-bf-hero.md`'s narrowed
 * acceptance grep asserts (gh#249).
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

const props = withDefaults(defineProps<HeroProps>(), { imageAlt: '', imageSizes: undefined, scrim: 'full' })

const slots = useSlots()

/** Is the crossfade frozen by the reader? See "The crossfade's pause control". */
const paused = ref(false)

/**
 * The control exists only once the page is interactive, and only when there
 * is a crossfade to control.
 */
const hydrated = ref(false)
onMounted(() => { hydrated.value = true })

const showMotionControl = computed<boolean>(() =>
  hydrated.value && Boolean(props.image) && (Boolean(props.imageSecondary) || Boolean(props.imageSequence?.length))
)

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
    :class="{
      'bf-hero--media': Boolean(image) && scrim !== 'none',
      'bf-hero--ink': Boolean(image) && scrim === 'none'
    }"
    :data-scrim="image ? scrim : undefined"
    :data-motion="paused ? 'paused' : undefined"
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
    <bfHeroMedia
      v-if="image"
      :src="image"
      :src-secondary="imageSecondary"
      :sequence="imageSequence"
      :paused="paused"
      :alt="imageAlt"
      :sizes="imageSizes"
    >
      <!--
        On the scrim, not in the content column: a child of `.bf-hero-media`
        (`z-index: -1`) paints above the photograph and below the copy.
      -->
      <slot name="overlay" />
    </bfHeroMedia>

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

    <!--
      The crossfade's pause (header, "The crossfade's pause control"). A
      direct child of the band, positioned in its bottom-end corner, and last
      in the DOM so it is the last stop in the band's tab order. The icon is
      drawn (two bars, or a triangle) and `aria-hidden`; the name is the
      words — "Pause" or "Play" on the pill, "the photographs" after it for
      assistive tech only, so the pill stays small over the picture and the
      visible word still starts the accessible name (WCAG 2.5.3).
    -->
    <button
      v-if="showMotionControl"
      type="button"
      class="bf-hero__motion"
      @click="paused = !paused"
    >
      <span class="bf-hero__motion-icon" :data-state="paused ? 'play' : 'pause'" aria-hidden="true" />
      {{ paused ? 'Play' : 'Pause' }}<span class="visually-hidden"> the photographs</span>
    </button>
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

    **Two rules, and the second is not redundant.** The bare pseudo-class
    compiles to `.bf-hero--media[data-v-…] :focus-visible` — a class, a scope
    attribute and a pseudo-class, so (0,3,0). `bfButton`'s own rule compiles
    to `.bf-button[data-v-…]:focus-visible`, which is **also (0,3,0)**, in the
    same layer. That is a tie, and a tie is decided by source order in the
    built stylesheet — where `bfButton`'s rule happens to come last. Review
    caught it in the generated output: the primary variant writes
    `--_bf-button-focus-color: var(--color-text)` *inline*
    (`Button.vue`, `cssVars`), so the CTA's ring resolved to near-black on the
    navy scrim in a production build while looking correct in dev, which is
    the worst shape a defect can have.

    Naming the control adds a compound and makes it (0,4,0), which wins
    outright and does not depend on which stylesheet the bundler emitted
    first. The bare rule stays for every other focusable thing a band can
    hold.
  */
  .bf-hero--media :deep(:focus-visible) {
    outline-color: var(--color-text-inverse);
  }

  .bf-hero--media :deep(.bf-button:focus-visible) {
    outline-color: var(--color-text-inverse);
  }

  /*
    Label colour only. `primary` already writes `--color-text-inverse` inline;
    this is for a `default` button, whose own label is navy and would vanish
    on the scrim. The border is left alone: `primary` is an opaque navy fill,
    and a white keyline here was the old blue-fill fix (`--color-primary` at
    1.22:1 against this scrim). That stroke is not the Paper primary.
  */
  .bf-hero--media :deep(.bf-button) {
    --_bf-button-color: var(--color-text-inverse);
  }

  /*
    The pause control. An opaque pill, so it reads over any photograph and
    under any scrim mode: the page ground and navy (`--color-accent`,
    11.66:1), the UI face a step under the body, and the site's pill radius
    and low elevation. In the band's bottom-end corner, inset one step from
    both edges; `z-index: 1` keeps it over `bfHeroMedia`'s `-1` layer and
    over the content's boxes (the band isolates, so it cannot climb out).

    `min-block-size` keeps a 24px target (WCAG 2.5.8) — `1.5rem`, because the
    space scale has no fixed 24px step. The focus ring is the band's: it is
    drawn outside the pill, over the band's own ground, so it inverts with
    the band under a scrim (the rule above) and stays dark in the ink mode.
  */
  .bf-hero__motion {
    position: absolute;
    inset-block-end: var(--space-s);
    inset-inline-end: var(--space-s);
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    min-block-size: 1.5rem;
    padding: var(--space-3xs) var(--space-xs);
    border: 0;
    border-radius: var(--radius-pill);
    background-color: var(--color-surface-page);
    box-shadow: var(--shadow-elevation-low);
    color: var(--color-accent);
    font-family: var(--font-family-ui);
    font-size: var(--size--1);
    font-weight: var(--font-weight-medium);
    line-height: 1.2;
    cursor: pointer;
  }

  .bf-hero__motion:hover {
    text-decoration-line: underline;
    text-decoration-thickness: var(--border-width-thin);
    text-underline-offset: 0.2em;
  }

  /*
    The icon, drawn: two bars while the photographs move (the control will
    pause them), a triangle while they are still (it will play them). An
    empty box painted in `currentcolor`, so it is the label's navy and
    announces nothing.
  */
  .bf-hero__motion-icon {
    flex: none;
    inline-size: 0.75em;
    block-size: 0.75em;
  }

  /* Two bars: the box's two inline borders, with nothing between them. */
  .bf-hero__motion-icon[data-state="pause"] {
    border-inline: 0.26em solid currentcolor;
  }

  .bf-hero__motion-icon[data-state="play"] {
    background-color: currentcolor;
    clip-path: polygon(10% 0, 100% 50%, 10% 100%);
  }

  @media (prefers-reduced-motion: reduce) {
    .bf-hero__motion {
      display: none;
    }
  }
}
</style>
