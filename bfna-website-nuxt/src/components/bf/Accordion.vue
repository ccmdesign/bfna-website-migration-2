<script setup lang="ts">
/**
 * `bfAccordion` — a styled skin over a native `<details>`/`<summary>`.
 *
 * Builds from the hand-rolled per-year blocks in
 * `src/pages/wireframes/archive.vue:14-23` (frozen, D2):
 *
 * ```vue
 * <details v-for="y in years" :key="y.year" :open="y === years[0]">
 *   <summary><strong>{{ y.year }}</strong> ({{ y.items.length }})</summary>
 *   …
 * </details>
 * ```
 *
 * The wireframe is **right about the element** and unstyled. This component
 * keeps the element and styles it. That is the entire brief, and the
 * temptation it exists to refuse is the one every design system eventually
 * gives in to: reaching for a `<button aria-expanded>` + `v-show` pair the
 * moment the marker needs to look different.
 *
 * ## What is deliberately absent
 *
 * | Not here | Why |
 * |---|---|
 * | `aria-expanded`, `role="button"`, `aria-controls` | The browser already maps `<details>`/`<summary>` onto exactly that. Writing them by hand does not add the semantics — it *duplicates* them, and a duplicate that can drift is worse than none. |
 * | An open-state `ref`, `v-model`, `@toggle` | The DOM element owns the state. Nothing here re-renders that node, so the user's click is never overwritten. |
 * | Enter/Space key handlers | Native. Both keys activate a focused `<summary>` with no script on the page. |
 * | `hidden` / `v-show` on the body | Native. A closed `<details>` takes its contents out of the tab order for free — the single hardest property of a hand-rolled disclosure to get right, and the one most often shipped broken. |
 * | A height animation | Spec § Out of scope. No wireframe evidence, and it needs a wrapper element whose only job is to be animated. |
 * | Single-open / accordion-group behaviour | Spec § Out of scope. Each `<details>` is independent, matching the wireframe, where several years may be open at once. |
 *
 * ## What native does *not* give us, and this file adds
 *
 * **1. A visible focus ring on the `<summary>`.** Chrome paints a UA ring;
 * other engines vary, and the CUBE stack declares no `summary:focus-visible`
 * rule anywhere — `base/forms.css` covers inputs, textareas and selects and
 * stops there. That is the same gap `bfBreadcrumb` found for `a:focus-visible`
 * (gh#37 P2-1). The ring is drawn *outside* the summary, on the page ground, so
 * its colour is `--color-text` through `--_bf-accordion-focus-color` and never
 * `currentcolor` — the gh#24-P2-1 finding: a control whose own colour is the
 * light one would otherwise paint a white ring on a white page (WCAG 1.4.11).
 *
 * **2. A marker that announces nothing.** The UA disclosure triangle arrives as
 * `::marker` (and, in WebKit, `::-webkit-details-marker`), and generated
 * content is concatenated into the accessible name computation — the
 * `bfBreadcrumb` separator lesson at a different pseudo-element. So both are
 * removed and the affordance is redrawn as a `::after` whose `content` is the
 * **empty string**: a box with two borders, rotated. There is no glyph, so
 * there is no alternative text to get wrong and no font to fail to load. The
 * accessible name of the summary is the `label` and nothing else.
 *
 * **3. Band rhythm from Utopia tokens.** A rule line and block padding, so a
 * stack of these reads as a list of bands inside a section without a pinned
 * pixel anywhere.
 *
 * Presentational-only (BRIEF D8): two props in, nothing out. No data access, no
 * store, no composable. `inheritAttrs` is left at its default — one root, so a
 * consumer's `class`, `style` and `data-*` land on the `<details>`, which is the
 * element a consumer would want to reach.
 */
import type { AccordionProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfAccordion' })

defineProps<AccordionProps>()
</script>

<template>
  <!--
    `:open` binds the **content attribute**, which is what makes this the
    initial state rather than a controlled one: Vue writes it on the first
    render and never touches the node again, so the `open` *property* the
    browser flips on every toggle is left alone.
  -->
  <details class="bf-accordion" :open="open">
    <!--
      The label is text, not markup. `archive.vue`'s per-year block wraps the year
      in a `<strong>`; that is a caller's typographic choice about a composed
      string, and the spec puts the composition on the caller (issue 55) rather
      than growing a slot here before there is a second occurrence to justify
      one.
    -->
    <summary class="bf-accordion__summary">{{ label }}</summary>

    <!--
      A wrapper element, not a bare `<slot />`. `<details>`'s own box holds the
      summary too, so the body's padding and gap need somewhere to live that is
      not "everything after the first child" — which would be a `:not(summary)`
      or a `summary ~ *`, and the first of those is banned outright (D-20.5).
    -->
    <div class="bf-accordion__body">
      <slot />
    </div>
  </details>
</template>

<style scoped>
/*
  `@layer components` must survive into the built stylesheet — the note in
  `Button.vue` has the history: `postcss-preset-env`'s cascade-layers polyfill
  used to flatten these blocks into unlayered rules, which then outranked every
  layer. The feature is off in `nuxt.config.ts`; probe 31 reads the live CSSOM,
  so a regression fails the run rather than shipping quietly.

  No negation pseudo-class anywhere in this file. D-20.5 (gh#29):
  `postcss-preset-env` mis-lowers a `:not()` containing a complex selector,
  silently breaking the rule. The open/closed branches are `details[open]` and
  the base rule; neither needs a negation.
*/
@layer components {
  .bf-accordion {
    /*
      Declared in the rule, not bound inline through a `cssVars` computed — the
      `bfMedia` lesson from gh#26. A component that writes its own custom
      properties inline on every instance is no more overridable than one that
      writes flat declarations inline, because an ordinary consumer rule cannot
      outrank an inline style. This component emits no inline `style` at all.
    */

    /** Summary ↔ marker, and the block rhythm of the band. Utopia, per spec. */
    --_bf-accordion-gap: var(--space-2xs);

    /** Padding above and below the summary row — its click/tap target. */
    --_bf-accordion-padding-block: var(--space-xs);

    /** Space between the summary row and the disclosed content. */
    --_bf-accordion-body-gap: var(--space-2xs);

    /*
      An existing semantic shade token (`semantic-colors-shades-and-tints.css`,
      derived from `--color-neutral`). No new colour, no literal, and not a
      primitive — BRIEF §5 rule 2.
    */
    --_bf-accordion-marker-color: var(--color-neutral-tint-60);
    --_bf-accordion-rule-color: var(--color-neutral-tint-20);

    /*
      The ring is painted on the page ground, outside the summary — so
      `--color-text`, never `currentcolor` (gh#24-P2-1).
    */
    --_bf-accordion-focus-color: var(--color-text);

    border-block-end: var(--border-width-thin) solid var(--_bf-accordion-rule-color);
  }

  .bf-accordion__summary {
    /*
      `display: flex` so the label and the marker sit on one baseline-aligned
      row with a real gap. It also removes the `list-item` display that carries
      the UA marker in Chromium and Firefox — `list-style` below states the same
      thing explicitly rather than relying on that side effect, and the WebKit
      pseudo-element gets its own rule, because neither engine's marker is
      reachable through the other's selector.
    */
    display: flex;
    align-items: baseline;
    gap: var(--_bf-accordion-gap);
    list-style: none;

    padding-block: var(--_bf-accordion-padding-block);

    /*
      The summary is the control. A pointer says so, and the UA's text cursor
      over a thing that is not selectable text says the opposite.
    */
    cursor: pointer;
  }

  /*
    WebKit's marker. `display: none` rather than `content: ""` — the latter
    leaves a zero-width box that still participates in the row's gap.
  */
  .bf-accordion__summary::-webkit-details-marker {
    display: none;
  }

  /*
    …and the standard one, for engines that keep `::marker` alive through the
    `display` change above. `content: ""` empties it; there is no glyph left to
    reach the accessibility tree.
  */
  .bf-accordion__summary::marker {
    content: "";
  }

  /*
    The marker, redrawn. Two borders on an empty box, rotated 45° — a chevron
    with **no text content at all**, so unlike a `▸` or a `⌄` there is nothing
    for an engine to concatenate into the summary's accessible name and no
    alternative-text half to be dropped by a build step. It also cannot fail to
    load: it is a border, not a font.

    `::after`, so it trails the label: the wireframe's UA triangle leads it, but
    a leading pseudo-element would sit between the disclosure control's start
    edge and its name, and the redrawn glyph has no `list-item` box to align
    with. Trailing is the arrangement that survives a wrapping label.
  */
  .bf-accordion__summary::after {
    content: "";
    flex: none;

    /*
      `em`, so the marker tracks the summary's own font size wherever a caller
      puts this — inside a section heading's scale or a footnote's.
    */
    inline-size: 0.4em;
    block-size: 0.4em;

    border-inline-end: var(--border-width-medium) solid var(--_bf-accordion-marker-color);
    border-block-end: var(--border-width-medium) solid var(--_bf-accordion-marker-color);

    /* Closed: pointing along the inline axis, i.e. "there is more this way". */
    transform: rotate(-45deg);
    transform-origin: center;

    /*
      Nudged off the baseline the flex row aligns to, so the chevron reads as
      centred against the label's x-height rather than sitting on its feet.
    */
    translate: 0 -0.15em;

    transition: transform 150ms ease;
  }

  /*
    Open: the same chevron turned a quarter, pointing at the content it has
    revealed. `[open]` is the browser's own attribute — the state is read from
    the element, never from a class this component would have to maintain.
  */
  .bf-accordion[open] .bf-accordion__summary::after {
    transform: rotate(45deg);
  }

  /*
    Motion is decoration here; the state change is carried by the position of
    the chevron, not by the movement between positions.
  */
  @media (prefers-reduced-motion: reduce) {
    .bf-accordion__summary::after {
      transition: none;
    }
  }

  /*
    The focus ring the stack does not otherwise declare for a `<summary>`. Same
    two-ring treatment as `bfButton` (:259), `bfSkipLink` and `bfBreadcrumb`, for
    the same two reasons: `--outline-focus` supplies the halo, and the `outline`
    is what survives forced-colors mode, where `box-shadow` is dropped.

    `:focus-visible`, not `:focus` — a ring on every mouse click is noise, and
    this control is clicked far more often than it is tabbed to.
  */
  .bf-accordion__summary:focus-visible {
    outline: var(--border-width-medium) solid var(--_bf-accordion-focus-color);
    outline-offset: var(--border-width-medium);
    box-shadow: var(--outline-focus);
  }

  .bf-accordion__body {
    /*
      Review finding (gh#40 P2-1). Both of these are **padding**, not margin, and
      that is the whole content of the fix: a `margin-block-start` here has no
      border or padding between it and the body's first child, so the two
      margins collapse into one and the gap becomes `max(hook, whatever the
      caller's first paragraph declares)`. The hook would then govern the
      spacing only for content that happens to have no top margin of its own —
      a custom property that silently stops working depending on what is slotted
      into it. Padding does not collapse.
    */
    padding-block-start: var(--_bf-accordion-body-gap);
    padding-block-end: var(--_bf-accordion-padding-block);
  }
}
</style>
