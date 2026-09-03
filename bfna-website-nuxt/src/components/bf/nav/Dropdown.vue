<script setup lang="ts">
/**
 * One top-bar dropdown — internal child of `bfNav` (issue 35 / gh#44).
 *
 * Evolves `src/components/wireframe/wfNavDropdown.vue`, which is frozen (D2)
 * and was read, not edited.
 *
 * ## The element is native, and stays native
 *
 * A `<details>`/`<summary>` pair, exactly as the wireframe has it. The spec is
 * explicit — *"keep it, do not reinvent with `aria-expanded`/JS state"* — and
 * the reasoning is `bfAccordion`'s (gh#40), which applies here with one extra
 * consequence that matters more in a nav than anywhere else:
 *
 * | Not here | Why |
 * |---|---|
 * | `aria-expanded`, `role="button"`, `aria-controls` | The browser maps `<details>`/`<summary>` onto exactly that. A hand-written copy does not add the semantics, it duplicates them — and a duplicate can drift. |
 * | An open-state `ref` / `v-model` | The DOM element owns the state. `closeSiblings` below writes the `open` **property** on a sibling; nothing re-renders these nodes, so the write is not undone. |
 * | Enter/Space handlers | Native on a focused `<summary>`, with no script on the page. |
 * | `v-show` / `hidden` on the panel | Native, and this is the part a hand-rolled nav dropdown almost always ships broken: a closed `<details>` takes its links **out of the tab order** for free. A `v-show`-hidden panel does too; an `opacity: 0` one does not, and that is the most common menu bug on the web. |
 *
 * ## What is added, and why each addition is unavoidable
 *
 * **1. `closeSiblings` — only one menu open at a time.** Ported from the
 * wireframe. Native `<details>` has no group behaviour; `name=` (the
 * exclusive-accordion attribute) would give it, but it also makes the group
 * mutually exclusive *by name across the whole document*, which is a different
 * contract from "the siblings inside this one nav", and `bfNav` may appear
 * twice on a page (it does, on the probe). So: the same explicit `@toggle`
 * handler the wireframe uses, scoped to `parentElement`.
 *
 * **2. Esc closes it and returns focus to the `<summary>`.** New relative to
 * the wireframe, and required by the spec. Native `<details>` has **no** Esc
 * behaviour at all — a keyboard user who opens a menu, tabs into it and
 * changes their mind has no way out but to tab through every remaining item.
 * The listener sits on the `<details>`, so it sees Esc from the summary and
 * from every link inside the panel (both are in the event path), and it
 * returns focus to the trigger because closing the element the user is focused
 * *inside* would otherwise drop focus to `<body>` — losing their place in the
 * tab order entirely, which is worse than the problem being fixed.
 *
 * Presentational-only (D8): two props in, nothing out. No data access, no
 * store, no composable.
 */
import type { MenuItem } from '~/types/bf-contracts'
import MenuLink from './MenuLink.vue'

defineOptions({ name: 'BfNavDropdown' })

defineProps<{ label: string, items: MenuItem[] }>()

/**
 * Close every other open `<details>` in the same group. Ported from
 * `wfNavDropdown.vue`'s handler of the same name.
 *
 * Guarded on `self.open` so it does nothing on the *closing* toggle: without
 * that guard, closing a menu would walk its siblings for no reason on every
 * interaction.
 */
function closeSiblings(e: Event) {
  const self = e.target as HTMLDetailsElement
  if (!self.open) return
  /*
   * `:scope > details[open]` rather than the wireframe's bare
   * `details[open]` — review finding (gh#44 P2-2). The bare selector is a
   * **descendant** query, so it would reach a `<details>` nested inside a
   * sibling's panel and close it as if it were a peer. Nothing puts one there
   * today; the point is that the selector should say what the word "siblings"
   * in this function's name says, rather than being correct by accident of what
   * the panels currently contain.
   */
  for (const d of self.parentElement?.querySelectorAll(':scope > details[open]') ?? []) {
    if (d !== self) (d as HTMLDetailsElement).open = false
  }
}

/**
 * Esc closes this menu and puts focus back on its `<summary>`.
 *
 * `currentTarget`, not `target`: the event is delegated from whatever inside
 * the panel had focus, and the element to close is the one carrying the
 * listener.
 *
 * The early return when already closed is what keeps this from swallowing Esc
 * from anything else — a modal, a combobox, a page-level handler. A closed
 * dropdown has nothing to close, so it does not `stopPropagation` and does not
 * move focus. (`@keydown.esc` is not `.stop`ped even when it *does* act: other
 * handlers on the way up may legitimately want to know, and this one's effect
 * is already complete by then.)
 */
function closeOnEsc(e: KeyboardEvent) {
  const self = e.currentTarget as HTMLDetailsElement
  if (!self.open) return
  self.open = false
  // `:scope >` for the same reason as `closeSiblings` (gh#44 P2-2): the trigger
  // is *this* element's own summary, not the first one found beneath it.
  self.querySelector<HTMLElement>(':scope > summary')?.focus()
}
</script>

<template>
  <details
    class="bf-nav__group"
    @toggle="closeSiblings"
    @keydown.esc="closeOnEsc"
  >
    <summary class="bf-nav__summary">{{ label }}</summary>
    <!--
      `role="list"` is not redundant — review finding (gh#44 P2-1). The panel's
      `list-style: none` below is what removes the UA bullets, and WebKit treats
      that declaration as a signal that the author no longer means a list:
      VoiceOver stops announcing "list, 3 items" and stops offering list
      navigation. Restating the implicit role puts the semantics back without
      putting the bullets back. The frozen skin has the same `list-style: none`
      and does not restate it; that is the bug being fixed rather than copied.
    -->
    <ul class="bf-nav__panel" role="list">
      <li v-for="i in items" :key="i.label">
        <MenuLink :item="i" />
      </li>
    </ul>
  </details>
</template>

<style scoped>
/*
  No `:not()` anywhere in this file (D-20.5, gh#29). The open branch is
  `[open]`, the browser's own attribute — read from the element, never from a
  class this component would have to maintain.

  `@layer components` must survive into the built stylesheet; the cascade-layer
  polyfill that used to flatten these blocks is off in `nuxt.config.ts`, and the
  probe reads the live CSSOM so a regression fails the run.
*/
@layer components {
  .bf-nav__group {
    /*
      The panel's containing block. Note this is `position: relative` on the
      *group*, not on `.bf-nav` — which is why the container query below can
      make `.bf-nav` a size container without disturbing where the panel hangs.
    */
    position: relative;
  }

  .bf-nav__summary {
    /*
      `display: flex` removes the `list-item` display that carries the UA
      disclosure triangle in Chromium and Firefox; `list-style: none` states the
      same thing explicitly rather than relying on that side effect, and WebKit's
      pseudo-element gets its own rule below because neither engine's marker is
      reachable through the other's selector. The wireframe draws its own `" ▾"`
      and this keeps that decision.
    */
    display: flex;
    align-items: center;
    gap: var(--_bf-nav-marker-gap, 0.25em);
    list-style: none;

    padding: var(--_bf-nav-item-padding, 0.25em 0.5em);
    color: var(--_bf-nav-link-color, var(--color-text));
    cursor: pointer;
  }

  .bf-nav__summary::-webkit-details-marker {
    display: none;
  }

  .bf-nav__summary::marker {
    content: "";
  }

  /*
    The wireframe's `content: " ▾"` at `0.7em`, kept — this is the affordance
    being formalised, not redesigned, the same call `components/external-link.css`
    recorded for `" ↗"`. `em` rather than a Utopia step for the same reason it
    gives: the scale's steps are steps of the *page's* scale, and there is no
    token meaning "slightly smaller than whatever this sits in".

    The glyph is `▾` — a geometric shape with no reading, which some engines
    concatenate into the summary's accessible name. It is `aria-hidden` by way
    of being generated content on a pseudo-element that is itself marked
    presentational below; `content: "▾" / ""` supplies the empty alternative
    text explicitly, which is the standardised way to say "this glyph is
    decoration" and is honoured by Chromium and WebKit. Engines that ignore the
    alt-text syntax fall back to reading the glyph, which is why the label text
    is the summary's own child and not part of the pseudo-element.
  */
  .bf-nav__summary::after {
    content: "▾" / "";
    font-size: var(--_bf-nav-marker-font-size, 0.7em);
  }

  .bf-nav__group[open] .bf-nav__summary {
    background-color: var(--_bf-nav-open-bg, var(--color-neutral-tint-10));
  }

  .bf-nav__panel {
    position: absolute;
    inset-block-start: 100%;
    inset-inline-start: 0;

    min-inline-size: var(--_bf-nav-panel-min-width, 18rem);
    margin: 0;
    padding: var(--_bf-nav-panel-padding, var(--space-2xs));
    list-style: none;

    background-color: var(--_bf-nav-bg, var(--color-surface-page));
    border: var(--border-width-thin) solid var(--_bf-nav-panel-border-color, var(--color-neutral-tint-40));

    display: grid;
    gap: var(--_bf-nav-panel-gap, var(--space-2xs));

    /*
      Above the page, below the header's own stacking context — the wireframe's
      `z-index: 10` on both, which resolves to "the panel wins inside the sticky
      header, and the header wins over the page".
    */
    z-index: var(--_bf-nav-panel-z, 10);
  }

  /*
    Narrow: the panels stop floating and flow in the document, so the nav wraps
    into a stack of disclosures instead of a row of overlapping popovers. This is
    the wireframe's `@media (max-width: 768px)` block, restated as a **container**
    query against `.bf-nav`'s named container (declared in `Nav.vue`).

    Why a container query for a full-bleed header, where the two are equivalent:
    the thing this rule actually depends on is the nav's own width, and saying so
    makes the component correct inside a narrow column as well as a narrow
    window. It is also the only form of the rule a probe can assert — the probe
    harness runs at one fixed 1280px viewport (`docs/decisions/probe-harness.md`),
    so a media-query version could only ever be checked by reading the rule text
    back out of the CSSOM and taking its word for it.
  */
  @container bf-nav (max-width: 768px) {
    .bf-nav__panel {
      position: static;
      min-inline-size: 0;
      border: none;
      border-inline-start: var(--border-width-medium) solid var(--_bf-nav-panel-border-color, var(--color-neutral-tint-40));
    }
  }
}
</style>
