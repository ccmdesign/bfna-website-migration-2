<script setup lang="ts">
/**
 * `bfNav` — the top bar (issue 35 / gh#44).
 *
 * Evolves `src/components/wireframe/wfNav.vue` + `wfNavDropdown.vue` +
 * `wfMenuLink.vue`, all three frozen (D2) and read, not edited. BRIEF §5
 * rule 5 names this trio as one of the four permitted bundles: the children
 * are internal to this component and only mean anything demoed with it.
 *
 * ## The one thing this issue exists to fix
 *
 * The whole script block of `wfNav.vue` is a single line that destructures
 * `menus` out of the wireframe's content composable — a component reaching
 * into the data layer for its own content. That is the exact anti-pattern
 * D8/ADR-1 exists to remove, and the issue body names it as such. `bfNav`
 * takes **`menus: Menu[]` as a prop and has no other source of anything**: no
 * composable, no collection query, no store, in this file or in either child.
 * The layout (#46) is what reads the data and passes it down; this component
 * cannot be rendered without being handed its content, which is the property
 * that makes it testable from a fixture array.
 *
 * The two forbidden names are deliberately not written out anywhere in this
 * file — not even inside this comment. The spec's acceptance is a literal
 * `grep -L` over these three sources, and a docblock that quotes the thing it
 * refuses would fail it while the code was perfectly correct. Same call
 * `bfLogo` recorded for colour literals (gh#23).
 *
 * ## How the two children are registered — and why not by auto-import
 *
 * `nuxt.config.ts` registers `components/bf` with `pathPrefix: false` and
 * `prefix: 'bf'`, which flattens the directory away: `bf/nav/MenuLink.vue`
 * would auto-import as **`<bfMenuLink>`** and `bf/nav/Dropdown.vue` as
 * **`<bfDropdown>`** — top-level-looking names in the `bf` namespace for two
 * things that are internal to this component, and `bfDropdown` in particular
 * is a name a real future component would want.
 *
 * So both are imported here **by explicit relative path**, which the spec asks
 * for and which has three properties the auto-import name does not: the
 * dependency is visible in this file, it does not depend on how the
 * `components` array happens to be configured, and it survives `bfFooter`
 * (#45) importing `./nav/MenuLink.vue` the same way. The auto-import
 * registration still exists as a side effect — nothing in the epic relies on
 * it, and `issues.md` plans no top-level component that would collide with it.
 * Recorded in the spec's Decisions.
 *
 * ## Structure — the wireframe's three tiers, unchanged
 *
 * ```
 * bfNav          logo, one entry per `menus` item, search
 *  └ Dropdown    an item with `items` — a native <details>
 *     └ MenuLink one item inside a panel
 * ```
 *
 * A `menus` entry is a plain link when it carries `href` or `to` and a
 * dropdown when it carries `items`, in that order of precedence — the same
 * `v-if` / `v-else-if` / `v-else` chain `wfNav` writes.
 *
 * The `to` branch renders through `MenuLink` rather than through a bare
 * `NuxtLink` as `wfNav` does. A `MenuItem` is a `MenuItem` wherever it appears,
 * and routing the one branch that can occur at both tiers through one component
 * means a top-level entry carrying `strong` behaves the way a panel entry
 * carrying it does, instead of silently ignoring the field. The `href` branch
 * stays inline because it differs: at the top level `data-external` is gated on
 * `m.external`, and inside a panel it is unconditional (see `MenuLink`).
 *
 * ## Search
 *
 * A plain `<NuxtLink to="/search">`, matching `wfNav`'s
 * `<NuxtLink to="/wireframes/search">Search</NuxtLink>` retargeted to the real
 * route (BRIEF §7). Not a `bfChip` and not a `bfButton`: the spec offers the
 * choice and the wireframe's own answer is a link, because this is navigation
 * to a page, not an action, and a control that *looks* like a button but
 * navigates is the more common of the two mistakes. Recorded in Decisions.
 *
 * No Subscribe button — removed with the newsletter band (D2, and the frozen
 * source's own comment says so).
 *
 * Presentational-only (D8): one prop in, nothing out.
 */
import type { Menu } from '~/types/bf-contracts'
import MenuLink from './nav/MenuLink.vue'
import Dropdown from './nav/Dropdown.vue'
import { newTabAttrs } from '~/utils/link'

defineOptions({ name: 'BfNav' })

defineProps<{
  menus: Menu[]
}>()
</script>

<template>
  <!--
    `$attrs` falls through to this root (no `inheritAttrs: false` — this is not
    a wrapper around a base component), so a consumer's `class`, `style`
    (including the `--_bf-nav-*` hooks) and `data-*` land on the `<header>`.
  -->
  <header class="bf-nav">
    <nav
      class="bf-nav__bar | center cluster"
      aria-label="Main"
      data-gap="s"
    >
      <!--
        Home. `bfLogo` carries its own `<title>` ("Bertelsmann Foundation North
        America") referenced by `aria-labelledby`, which becomes this link's
        accessible name — so no `aria-label` here, which would override it with
        a second, drifting copy of the same string.
      -->
      <NuxtLink to="/" class="bf-nav__logo">
        <bfLogo />
      </NuxtLink>

      <template
        v-for="m in menus"
        :key="m.label"
      >
        <!--
          Precedence matches `wfNav`: an entry that names a destination is a
          link, whether or not it also carries `items`; only an entry with no
          destination becomes a disclosure. `data-external` is gated on
          `m.external` — at the top level an `href` is not by itself evidence of
          an off-site target, unlike inside a panel (see `MenuLink`).

          `|| undefined` rather than `|| false`: an attribute bound to `false` is
          removed, but one bound to the *string* `"false"` is not, and
          `[data-external]` matches on presence.
        -->
        <a
          v-if="m.href"
          :href="m.href"
          class="bf-nav__link"
          :data-external="m.external || undefined"
          v-bind="newTabAttrs(m.href)"
        >{{ m.label }}</a>
        <MenuLink
          v-else-if="m.to"
          class="bf-nav__link"
          :item="m"
        />
        <Dropdown
          v-else
          :label="m.label"
          :items="m.items ?? []"
        />
      </template>

      <NuxtLink to="/search" class="bf-nav__search">Search</NuxtLink>
    </nav>
  </header>
</template>

<style scoped>
/*
  No `:not()` anywhere in this file (D-20.5, gh#29): `postcss-preset-env`
  mis-lowers a `:not()` containing a complex selector and silently breaks the
  rule, so the ban is on the construct rather than on the mistake.

  `@layer components` must survive into the built stylesheet — the
  cascade-layer polyfill that used to flatten these blocks into unlayered rules
  is off in `nuxt.config.ts`, and the probe reads the live CSSOM so a
  regression fails the run rather than shipping quietly.

  No focus rule anywhere in this file, either. `base/focus.css` (#146) declares
  `:focus-visible` in `@layer defaults` for every element — links and
  `<summary>` included — and a nav has no reason to want a different ring from
  the rest of the page. That file exists precisely so the six atoms that each
  shipped a private copy of those three declarations stop doing it.
*/
@layer components {
  .bf-nav {
    /*
      Declared in the rule, not bound inline through a `cssVars` computed (the
      `bfMedia` lesson, gh#26): a component that writes its own custom
      properties inline is no more overridable than one writing flat
      declarations inline, because an ordinary consumer rule cannot outrank an
      inline style. This component emits no inline `style` at all.

      The three the spec names, plus the hooks the children read through
      inheritance — all sourced from existing semantic tokens. No new colour and
      no colour literal (BRIEF §5 rule 2, DoD-6).
    */

    /** The band the bar occupies. A floor, not a fix: the bar grows if it wraps. */
    --_bf-nav-height: var(--space-xl);

    /** The bar's ground, and the dropdown panels' — they must read as one surface. */
    --_bf-nav-bg: var(--color-surface-page);

    /** Every link, summary and menu item in the bar inherits this. */
    --_bf-nav-link-color: var(--color-text);

    /** The rule under the bar. The wireframe's 2px, in the token that names it. */
    --_bf-nav-border-color: var(--color-neutral-tint-40);

    /** Read by `nav/Dropdown.vue` through inheritance; declared here so one place owns them. */
    --_bf-nav-open-bg: var(--color-neutral-tint-10);
    --_bf-nav-panel-border-color: var(--color-neutral-tint-40);
    --_bf-nav-item-padding: 0.25em 0.5em;

    /*
      The size container the dropdowns' narrow rule queries. Named, so the
      `@container bf-nav (…)` in `nav/Dropdown.vue` cannot be captured by some
      other container a consumer wraps this in.

      `inline-size` computes to `contain: layout style inline-size` — **not**
      paint, so nothing is clipped, and the panels' containing block is
      `.bf-nav__group` (`position: relative`), not this element. Sticky
      positioning on the same element is unaffected: containment governs this
      box's descendants, not its own placement in its scroll container.
    */
    container-type: inline-size;
    container-name: bf-nav;

    position: sticky;
    inset-block-start: 0;

    background-color: var(--_bf-nav-bg);
    color: var(--_bf-nav-link-color);
    border-block-end: var(--border-width-medium) solid var(--_bf-nav-border-color);

    /*
      Over the page. The panels take a higher one *inside* this element's
      stacking context, which is the arrangement the wireframe's two `z-index: 10`
      declarations resolve to.
    */
    z-index: var(--_bf-nav-z, 10);
  }

  .bf-nav__bar {
    /*
      `center cluster` supplies the measure and the wrapping row; this adds only
      the band height and the block padding around it. `min-block-size`, so a
      nav that wraps to two lines at a narrow width grows instead of clipping —
      a fixed `block-size` here is the single most common way a responsive
      header loses its second row.
    */
    min-block-size: var(--_bf-nav-height);
    padding-block: var(--space-2xs);
  }

  .bf-nav__logo {
    /*
      Pushes everything after it to the end of the row — the wireframe's
      `margin-inline-end: auto` on `.wf-nav__logo`, unchanged. `flex` so the
      inline-block SVG inside does not sit on the text baseline with a descender
      gap under it.
    */
    display: flex;
    margin-inline-end: auto;

    /*
      Was `1.25rem` — the wireframe's own logo slot, which `bfLogo` also
      defaults to. Raised 40% by design review: at 1.25rem the wordmark's
      lower band (an inverted shape with the letterforms knocked out) closed
      up at nav scale and read as a solid bar. The nav row is taller than the
      mark either way, so nothing else in the bar reflows.
    */
    --_bf-logo-size: 1.75rem;
  }

  /*
    Top-level plain links and the search link. Same padding as a dropdown
    summary so the row reads as one set of targets — the wireframe's
    `.wf-nav__link` comment makes exactly this point about the pruned-nav
    buttons, and the `↗` affordance still comes from `a[data-external]`
    (`components/external-link.css`, gh#28).
  */
  .bf-nav__link,
  .bf-nav__search {
    padding: var(--_bf-nav-item-padding);
    color: var(--_bf-nav-link-color);
    text-decoration: none;
  }

  .bf-nav__link:hover,
  .bf-nav__search:hover {
    text-decoration: underline;
  }
}
</style>
