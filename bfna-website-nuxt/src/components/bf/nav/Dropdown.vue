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
 * **3. A press outside closes it** (design review). Native `<details>` has no
 * light dismiss either; see `onDocumentPointerdown`.
 *
 * Presentational-only (D8): two props in, nothing out. No data access, no
 * store, no composable.
 */
import type { MenuItem } from '~/types/bf-contracts'
import MenuLink from './MenuLink.vue'

defineOptions({ name: 'BfNavDropdown' })

defineProps<{ label: string, items: MenuItem[] }>()

const root = ref<HTMLDetailsElement | null>(null)
const route = useRoute()

/**
 * A click inside the panel navigates and leaves `<details open>` sitting
 * on the next page — the panel is leftover chrome from the previous
 * location. `fullPath` (not `path`) so `/insights` → `/insights?format=`
 * closes too: those are the Insights submenu's own targets.
 */
watch(() => route.fullPath, () => {
  if (root.value?.open) root.value.open = false
})

/**
 * Close every other open `<details>` in the same group. Ported from
 * `wfNavDropdown.vue`'s handler of the same name.
 *
 * Guarded on `self.open` so it does nothing on the *closing* toggle: without
 * that guard, closing a menu would walk its siblings for no reason on every
 * interaction.
 */
function onToggle(e: Event) {
  const self = e.target as HTMLDetailsElement
  watchOutside(self.open)
  closeSiblings(self)
}

/**
 * Light dismiss: a press anywhere outside this menu closes it, the way a
 * popover would. `<details>` has none of its own. Listening only while open
 * keeps an idle page free of document listeners; `pointerdown` rather than
 * `click` so the menu is gone before a press on the page lands. Focus is left
 * where the press put it — the user chose somewhere else to be.
 */
function onDocumentPointerdown(e: PointerEvent) {
  const self = root.value
  if (self?.open && !self.contains(e.target as Node)) self.open = false
}

function watchOutside(isOpen: boolean) {
  if (isOpen) document.addEventListener('pointerdown', onDocumentPointerdown)
  else document.removeEventListener('pointerdown', onDocumentPointerdown)
}

onBeforeUnmount(() => watchOutside(false))

function closeSiblings(self: HTMLDetailsElement) {
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
 *
 * What it does do when it acts is `preventDefault()` — the standard "this key
 * has been handled" flag, which lets a listener further up tell the two cases
 * apart without being starved of the event. `bfNav`'s small-screen sheet reads
 * it (Wave 1): the first Esc closes an open dropdown inside the sheet, the next
 * one closes the sheet. Esc has no default action to cancel, so the call
 * changes nothing else.
 */
function closeOnEsc(e: KeyboardEvent) {
  const self = e.currentTarget as HTMLDetailsElement
  if (!self.open) return
  e.preventDefault()
  self.open = false
  // `:scope >` for the same reason as `closeSiblings` (gh#44 P2-2): the trigger
  // is *this* element's own summary, not the first one found beneath it.
  self.querySelector<HTMLElement>(':scope > summary')?.focus()
}
</script>

<template>
  <details
    ref="root"
    class="bf-nav__group"
    @toggle="onToggle"
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

    /*
      Elevation instead of a frame, matching the bar it hangs from (`Nav.vue`):
      the panel opens over the navy announcement band and the hero, where a grey
      hairline read as a seam and the light-tinted medium shadow vanished. The
      narrow branch below resets it, because there the panel is an inline list.
    */
    box-shadow: var(--_bf-nav-panel-shadow, var(--shadow-elevation-medium-deep));
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
    Wide bar (`Nav.vue`'s `width > 60rem` block): the summary fills the full
    height of the bar like the plain links beside it, and the panel drops its
    inline padding so each item's text starts on the summary's text — both
    indent by `--_bf-nav-item-padding-inline`.
  */
  @container bf-nav (width > 60rem) {
    .bf-nav__summary {
      block-size: 100%;
    }

    .bf-nav__panel {
      padding-inline: 0;

      /*
        The bar's shadow, redrawn across the panel's top edge: the panel is the
        bar's descendant and paints over the shadow the bar casts, so without
        this the panel reads as fused to the bar instead of hanging below it.
      */
      box-shadow:
        var(--shadow-inset-top-deep),
        var(--_bf-nav-panel-shadow, var(--shadow-elevation-medium-deep));
    }

    .bf-nav__panel .bf-nav__item {
      display: block;
      padding-inline: var(--_bf-nav-item-padding-inline, var(--space-s));
    }
  }

  /*
    Narrow: the panels stop floating and flow in the document, so inside
    `bfNav`'s small-screen sheet each dropdown is an inline disclosure with an
    indented list under it instead of a popover. This was the wireframe's
    `@media (max-width: 768px)` block, restated as a **container** query
    against `.bf-nav`'s named container (declared in `Nav.vue`).

    `60rem`, not the wireframe's 768px — the width at which `Nav.vue` swaps the
    row for the sheet (Wave 1). The two numbers must agree: between them a
    floating panel would open inside the scrolling sheet and be clipped by it.
    Container queries cannot read a custom property, so `Nav.vue` names this
    rule and this rule names `Nav.vue`.

    Why a container query for a full-bleed header, where the two are equivalent:
    the thing this rule actually depends on is the nav's own width, and saying so
    makes the component correct inside a narrow column as well as a narrow
    window. It is also the only form of the rule a probe can assert — the probe
    harness runs at one fixed 1280px viewport (`docs/decisions/probe-harness.md`),
    so a media-query version could only ever be checked by reading the rule text
    back out of the CSSOM and taking its word for it.
  */
  @container bf-nav (max-width: 60rem) {
    /* Full-width row, marker at the far end — where a thumb expects it. */
    .bf-nav__summary {
      justify-content: space-between;
    }

    /*
      In a full-width row with no inline padding the desktop's open tint would
      be a grey slab with the label flush against its edge. The indented list
      below already says "open"; the marker turning over says it at the
      trigger.
    */
    .bf-nav__group[open] .bf-nav__summary {
      background-color: transparent;
    }

    /*
      At the far end of a full-width row the desktop's 0.7em `▾` shrinks to a
      stray dot. On the sheet the marker is drawn instead: a chevron built from
      two borders, in the same 1.5-unit stroke as `Nav.vue`'s Menu icon, that
      turns over when the group opens. Still generated content with empty
      alternative text, so the summary's name is still only its label.
    */
    .bf-nav__summary::after {
      content: "" / "";
      inline-size: 0.45em;
      block-size: 0.45em;
      margin-inline-end: 0.2em;
      border-block-end: 0.09em solid currentcolor;
      border-inline-end: 0.09em solid currentcolor;
      transform: translateY(-0.15em) rotate(45deg);
    }

    .bf-nav__group[open] .bf-nav__summary::after {
      transform: translateY(0.1em) rotate(-135deg);
    }

    .bf-nav__panel {
      position: static;
      min-inline-size: 0;
      margin-block-end: var(--space-2xs);
      padding-block: 0;
      padding-inline: var(--space-s) 0;
      gap: 0;
      box-shadow: none;
      border-inline-start: var(--border-width-medium) solid var(--_bf-nav-panel-border-color, var(--color-neutral-tint-40));
    }

    /*
      Touch-sized items. `MenuLink`'s root carries this component's scope too
      (a child's root always does), so the rule reaches it without `:deep`.
    */
    .bf-nav__panel .bf-nav__item {
      display: block;
      padding-block: var(--space-2xs);
    }
  }
}
</style>
