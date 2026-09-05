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
import type { VNode } from 'vue'
import type { SectionProps } from '~/types/bf-contracts'

defineOptions({
  name: 'BfSection',
  /*
   * Half of defect 2. With fallthrough off, nothing reaches the DOM that this
   * component did not put there — see `rootAttrs` for what it puts there.
   */
  inheritAttrs: false
})

/**
 * The two slots, declared so the `bleed` contract is visible where a consumer
 * looks — in the type surface — rather than only in the template's comments.
 *
 * Added with `bleed` in gh#253. This component previously declared none at
 * all, which meant a mistyped slot name compiled and silently rendered
 * nothing; `bfPageHeader` beside it has always declared its two.
 */
defineSlots<{
  /** The band's content. Rendered **inside** `.center`, on the measure. */
  default?: () => VNode[]
  /**
   * A full-bleed layer behind the content, outside the measure — a
   * photograph, a scrim, a texture. See the template comment for why it
   * cannot go through the default slot.
   *
   * **The consumer owns the containing block.** This component adds no rule
   * for the slot, so a layer that positions itself absolutely needs the band
   * root to establish one: declare `position: relative` (and, for a layer
   * that paints behind the content with a negative `z-index`,
   * `isolation: isolate`) on your own class on the root. `bfPageHeader` does
   * exactly that on `.bf-page-header--media`.
   */
  bleed?: () => VNode[]
}>()

const props = withDefaults(defineProps<SectionProps>(), {
  gap: 'm',
  layout: 'stack',
  /*
   * The rank this component hard-coded before gh#223, so adopting the prop
   * changes no markup at any of the 25 existing call sites. See
   * `SectionProps.headingLevel` for why the rank stopped being fixed.
   */
  headingLevel: 2
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

/**
 * The id the band's `<h2>` carries, so the `<section>` can point an
 * `aria-labelledby` at it — residual #164, folded into gh#55.
 *
 * A bare `<section>` is **not** a landmark. `region` is one of the roles the
 * HTML-AAM spec gates on an accessible name: without one, a `<section>` is
 * mapped to a generic container and disappears from the landmark list every
 * screen-reader user navigates a page by. So a band that renders a visible
 * heading was announcing the heading as ordinary text and offering no way to
 * jump between bands — the whole point of composing a page out of them.
 *
 * Nuxt's SSR-stable `useId()`, not `crypto.randomUUID()` and not a counter: the
 * value has to survive the server render and hydrate to the same string, or the
 * idref points at nothing for the first frame and Vue logs a mismatch.
 * (`bfLogo` and `bfFormField` set the precedent.)
 */
const headingId = useId()

/**
 * The idref, **only** when there is a heading to point at.
 *
 * `undefined` rather than `''` when there is not: `aria-labelledby=""` is a
 * different, invalid thing, and an idref naming an element that does not exist
 * is worse than no name at all — some screen readers fall back to the element's
 * content, others announce nothing. Vue drops the attribute entirely on
 * `undefined`.
 *
 * A `label`-only band is deliberately left unnamed. `label` renders as
 * `data-label`, not as text, and naming a landmark from an attribute nothing
 * displays would give the band an accessible name no sighted user can see.
 */
const headingLabelledBy = computed(() => (props.heading ? headingId : undefined))

/**
 * The heading element, as a tag name — `h2` by default, the rank this
 * component hard-coded before gh#223.
 *
 * `<component :is>` with a string resolves to that HTML element, which is the
 * repo's own idiom for a variable heading rank: every typed card wrapper
 * renders `` `h${headingLevel}` `` this way (gh#128, D27). The union in
 * `SectionHeadingLevel` is what stops the template interpolating a rank that
 * is not an element.
 */
const headingTag = computed(() => `h${props.headingLevel}`)

/**
 * The band's root, so the dev-time assertion below can read what this
 * component actually rendered. Never bound as an attribute; `$attrs` and
 * `rootAttrs` are untouched by it.
 */
const root = ref<HTMLElement | null>(null)

/**
 * Dev-time assertion: a band that renders an `<h2>` and has **no accessible
 * name** is almost certainly a call site that read `label` as naming the
 * landmark.
 *
 * It does not. `label` renders as `data-label` — invisible to the
 * accessibility tree by design (`SectionProps.label`), and a name taken from
 * an attribute nothing displays would be a name no sighted user can see. That
 * behaviour **stands** (a11y BRIEF D26): this component is not changed to name
 * itself from `label`, and a `label`-only band is still deliberately unnamed.
 * What is added is a way for the call sites that got it wrong to say so out
 * loud, which is gh#230's list to work from. Measured on a clean dev load:
 * `/about` warns twice (`data-label="Bertelsmann Stiftung"` and `"Contact"`),
 * `/projects` warns not at all — its three bands slot their own `<h2>` and
 * name themselves at the call site, which is the correct pattern — and the
 * article-body band warns on the 76 insight pages whose bodies author `##`.
 *
 * ## Why this is a warning and not a type
 *
 * gh#222 deleted a dev-only `console.warn` from `bfMedia` (D25) and was right
 * to: it was compensating for a missing type guarantee, and once `MediaProps.alt`
 * became required the warning was dead weight — "a warning that does not run in
 * production is not a gate" applies exactly when a type could have been the
 * gate instead.
 *
 * There is no type here to promote it to. The proposition is a relationship
 * between *the content a slot rendered* and *an ARIA attribute on a different
 * element* — `<h2>` appeared in my subtree, and nothing named me. A slot's
 * rendered content has no type surface (`v-slot` is untyped structure, not a
 * shape), and `aria-labelledby` arrives through `$attrs`, which is
 * `Record<string, unknown>` by construction. TypeScript cannot state this, so
 * a runtime assertion is the only place it can be stated at all. That is the
 * difference from the warning gh#222 removed, and it is why this one is worth
 * its bytes.
 *
 * ## Why the DOM, and why `onMounted`
 *
 * `Card.vue:129-144` is the precedent and this is its shape: a `ref` on the
 * root, `onMounted`, `console.warn`, never a silent fallback and never a throw,
 * with `import.meta.dev` keeping the whole block out of the production bundle.
 *
 * Not vnode inspection, which is `PageHeader.vue`'s `hasRenderedContent`
 * shape: that one is called *from the template*, inside a render. Calling
 * `slots.default()` from `onMounted` is outside one, and Vue's own dev build
 * logs *"Slot … invoked outside of the render function"* when it happens —
 * trading one warning for two. Reading the DOM also answers the question more
 * honestly: it sees the `<h2>` a child component emitted, not only the one the
 * call site typed.
 *
 * ## The three conditions
 *
 * 1. **No accessible name on the root.** The rendered attribute, not
 *    `props.heading` — that is one test covering both ways a band gets named:
 *    this component's own `aria-labelledby` (`headingLabelledBy`, above) *and*
 *    a call site that wires its own. The second is not hypothetical:
 *    `projects/index.vue:169-183` slots an `<h2>` because the heading has to be
 *    a link, and passes `:aria-labelledby` at the call site. It is **correct**,
 *    and it stays silent here. `aria-label` counts too — a band named by a
 *    string rather than by an element is still a named band.
 * 2. **An `<h2>` in the subtree.** Rank 2 specifically, because rank 2 is what
 *    a band's own heading is by default, so an `<h2>` inside an unnamed band is
 *    the call site saying "this band has a heading" in the one way this
 *    component cannot see.
 * 3. **Whose nearest `<section>` ancestor is this root.** A nested `bfSection`
 *    renders its own `<h2>` inside its own `<section>`; attributing it to the
 *    outer band would fire on markup that is already correct.
 */
if (import.meta.dev) {
  onMounted(() => {
    const el = root.value
    if (!el) return

    const named
      = el.getAttribute('aria-labelledby') !== null
        || el.getAttribute('aria-label') !== null

    if (named) return

    const ownH2 = Array.from(el.querySelectorAll('h2'))
      .some(h2 => h2.closest('section') === el)

    if (!ownH2) return

    console.warn(
      '[bfSection] renders an <h2> but has no accessible name, so it is a generic '
      + 'container rather than a region landmark. `label` renders as data-label and '
      + 'does not name it. Pass the `heading` prop, or keep the slotted heading and '
      + 'point `aria-labelledby` at its id (the idiom at projects/index.vue:169-183).'
      + (props.label === undefined ? '' : ` Band: data-label="${props.label}".`)
    )
  })
}
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
    ref="root"
    class="bf-section"
    :class="{
      'bf-section--padded': padded,
      'bf-section--full-width': fullWidth
    }"
    :data-label="label"
    :aria-labelledby="headingLabelledBy"
    v-bind="rootAttrs"
  >
    <!--
      A full-bleed layer, outside the measure. gh#253.

      The default slot below renders **inside** `.center`, and `.center` is
      `content-box` with `padding-inline` (`center.css:50-58`) — its rendered
      width is `measure + 2 x padding`, and it is centred. So nothing passed
      through the default slot can paint edge to edge, and a band that wants a
      photograph behind its own copy has nowhere to put one.

      This is that place: a direct child of the band root, before the column,
      taking the band's whole box. `bfPageHeader` puts `bfHeroMedia` here.

      Purely additive — unused, it renders **no element**, and the 25 call
      sites that composed this component before gh#253 are untouched. Not
      "byte for byte", though: an unfilled slot still emits Vue's pair of SSR
      fragment-anchor comment nodes into the prerendered HTML. Comment nodes
      are not elements, so `:first-child`, the sibling combinators and
      `.stack`'s `> * + *` are all unaffected — but the markup is not
      literally identical, and review was right to say so.

      And deliberately unopinionated: this component adds **no rule** for it.
      A layer here positions itself, and the *consumer* declares the
      containing block it needs on the root — `bfPageHeader` writes
      `position: relative; isolation: isolate` onto `.bf-page-header--media`,
      which is this same `<section>` under the consumer's own class. A band
      that has no bleed layer therefore keeps exactly the box model it had,
      and this file keeps paying nothing for a feature one caller uses.
    -->
    <slot name="bleed" />

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
        heading that would still take a gap in the stack.

        The rank is `headingLevel`, defaulting to the `2` this was hard-coded
        at before gh#223 — see `SectionProps.headingLevel` for why a band's
        rank stopped being fixed and why the default is the no-change value.
        `<component :is>` on a tag-name string is the card wrappers' own idiom
        (gh#128, D27); `SectionHeadingLevel` is what stops it interpolating a
        rank that is not an element.

        The `id` is the target of the root's `aria-labelledby` (#164): together
        they are what makes a band with a heading a named `region` landmark
        rather than a generic container. Both appear and disappear on the same
        `heading` condition, so there is never an idref without an element.
      -->
      <component
        :is="headingTag"
        v-if="heading"
        :id="headingId"
        class="bf-section__heading"
      >{{ heading }}</component>
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
    /*
      `inline-size`, not `width`: `margin-inline` and `max-inline-size` beside
      it are logical, and in a vertical writing mode a physical `width` here
      would set the *block* size while the margins went on the inline axis —
      an incoherent rule. Identical in `horizontal-tb`, which is every page
      this ships on today.
    */
    inline-size: var(--_bf-section-full-width);
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
