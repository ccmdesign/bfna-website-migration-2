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
 * An icon opens a search field over the desktop menu. The field reveals from
 * right to left as the entries fade upward; closing restores them in reverse.
 * Hidden controls are inert, Escape returns focus, and submission uses /search?q=.
 * On small screens the same field opens in a row below the bar.
 *
 * No Subscribe button — removed with the newsletter band (D2, and the frozen
 * source's own comment says so).
 *
 * ## Small screens — one "Menu" disclosure (Wave 1)
 *
 * Below `60rem` of the nav's own width the row used to wrap to three lines
 * above every page at 375px. Now the entries collapse behind a single
 * **Menu** button and open as a sheet hanging under the bar:
 *
 * ```
 * bfNav
 *  ├ logo
 *  ├ Menu button     aria-expanded / aria-controls → the menu
 *  └ menu            every entry above plus Search; a row on desktop,
 *                    a sheet on small screens, hidden until opened
 * ```
 *
 * Same entries, same order, same `Dropdown`s — on the sheet the dropdown
 * panels stop floating and flow as indented lists (`nav/Dropdown.vue`,
 * whose container query uses the same `60rem`). Desktop renders exactly the
 * row it did before; the button does not exist there (`display: none`, so it
 * is out of the accessibility tree too).
 *
 * **Why a `<button aria-expanded>` here when `Dropdown` refuses one.** The
 * dropdowns are native `<details>`, and the reasons in `Dropdown.vue` still
 * hold for them. This disclosure cannot be one: its content must be *always
 * visible* on desktop whatever its open state, and a closed `<details>` hides
 * its content with no author-reachable way to overrule that across engines.
 * So the state is one local `ref`, surfaced as `data-open` on the root for
 * the CSS and as `aria-expanded` on the button for assistive technology.
 * Local UI state is not data: the `menus` prop is still the only input.
 *
 * Behaviour, each one because a disclosure menu without it is broken:
 *
 * - **Esc** closes the sheet and returns focus to the button. An open
 *   dropdown inside the sheet takes the first Esc (it marks the event
 *   `defaultPrevented`), so Esc unwinds one level at a time.
 * - **Focus leaving the nav** closes it. The sheet covers the top of the
 *   page; tabbing past its last entry into content hidden underneath it is
 *   the "focus leak" this prevents, without trapping focus — it is not a
 *   modal and must not act like one.
 * - **A pointer press outside** closes it, and so does **navigation**
 *   (`route.fullPath`, the same watch `Dropdown` keeps).
 * - The sheet is `display: none` when closed, so its links are out of the
 *   tab order — never `opacity: 0` (see `Dropdown.vue`'s table).
 *
 * Before hydration the button does nothing, so a no-JS visitor on a phone
 * has no sheet. The footer carries the same entries as plain links, which is
 * the fallback; rendering the sheet open until hydration would instead shift
 * every page down and back on load.
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

/** Whether the small-screen sheet is open. Meaningless, and never set, on desktop. */
const open = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const searchButton = ref<HTMLButtonElement | null>(null)
const searchId = useId()

const root = ref<HTMLElement | null>(null)
const toggleButton = ref<HTMLButtonElement | null>(null)

/** SSR-stable, and unique per instance — `bfNav` may be mounted twice on a page. */
const menuId = useId()

const route = useRoute()
watch(() => route.fullPath, () => {
  open.value = false
  searchOpen.value = false
})

function toggle() {
  searchOpen.value = false
  open.value = !open.value
}

function closeSearch(returnFocus = false) {
  searchOpen.value = false
  if (returnFocus) searchButton.value?.focus()
}

async function toggleSearch() {
  if (searchOpen.value) {
    closeSearch(true)
    return
  }

  open.value = false
  for (const details of root.value?.querySelectorAll<HTMLDetailsElement>('details[open]') ?? []) {
    details.open = false
  }
  searchOpen.value = true
  await nextTick()
  if (searchOpen.value) searchInput.value?.focus({ preventScroll: true })
}

function submitSearch() {
  const query = searchQuery.value.trim()
  if (!query) {
    searchInput.value?.focus()
    return
  }
  closeSearch(true)
  return navigateTo({ path: '/search', query: { q: query } })
}

/**
 * Esc from anywhere inside the nav closes the active disclosure and focuses its
 * button — closing the element the user is focused inside would otherwise drop
 * focus to `<body>`. `defaultPrevented` is how an open dropdown says it has
 * already spent this Esc on itself.
 */
function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || e.defaultPrevented) return
  if (searchOpen.value) {
    e.preventDefault()
    closeSearch(true)
  } else if (open.value) {
    e.preventDefault()
    open.value = false
    toggleButton.value?.focus()
  }
}

/**
 * Focus moving to something outside the nav closes its disclosures. A `null`
 * `relatedTarget` is the window losing focus (switching apps), not the user
 * leaving the menu, so it is left open.
 */
function onFocusout(e: FocusEvent) {
  const next = e.relatedTarget as Node | null
  if (next === null || root.value?.contains(next)) return
  open.value = false
  closeSearch()
}

/** A press outside the nav closes its active disclosure. */
function onDocumentPointerdown(e: PointerEvent) {
  if (!root.value?.contains(e.target as Node)) {
    open.value = false
    closeSearch()
  }
}

/*
 * Listen outside only while a menu or search disclosure is open.
 */
watch([open, searchOpen], ([menuOpen, isSearchOpen]) => {
  if (menuOpen || isSearchOpen) document.addEventListener('pointerdown', onDocumentPointerdown)
  else document.removeEventListener('pointerdown', onDocumentPointerdown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerdown)
})
</script>

<template>
  <!--
    `$attrs` falls through to this root (no `inheritAttrs: false` — this is not
    a wrapper around a base component), so a consumer's `class`, `style`
    (including the `--_bf-nav-*` hooks) and `data-*` land on the `<header>`.
  -->
  <header
    ref="root"
    class="bf-nav"
    :data-open="open || undefined"
    :data-search-open="searchOpen || undefined"
    @keydown="onKeydown"
    @focusout="onFocusout"
  >
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

      <!--
        The small-screen disclosure. Icon-only by design review, so its name
        comes from `aria-label` — "Menu", and it stays "Menu" when open:
        `aria-expanded` already says which state it is in, and a label that
        flips to "Close" would announce the state twice.
        `aria-expanded` is bound to a string so it renders `"false"` rather than
        disappearing — an absent attribute means "not a disclosure at all".

        The icon is drawn, not a glyph: three strokes that fold into a cross
        when open, with no movement under reduced motion.
      -->
      <button
        ref="toggleButton"
        type="button"
        class="bf-nav__toggle"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="menuId"
        aria-label="Menu"
        @click="toggle"
      >
        <svg
          class="bf-nav__toggle-icon"
          viewBox="0 0 20 20"
          aria-hidden="true"
          focusable="false"
        >
          <path class="bf-nav__toggle-line bf-nav__toggle-line--top" d="M3 5.5h14" />
          <path class="bf-nav__toggle-line bf-nav__toggle-line--middle" d="M3 10h14" />
          <path class="bf-nav__toggle-line bf-nav__toggle-line--bottom" d="M3 14.5h14" />
        </svg>
      </button>

      <div
        class="bf-nav__navigation"
        :style="{ '--_bf-nav-count': menus.length }"
      >
        <!-- Keep dropdowns as direct siblings so their native grouping survives. -->
        <div
          :id="menuId"
          class="bf-nav__menu cluster"
          data-gap="s"
          :inert="searchOpen"
          :aria-hidden="searchOpen || undefined"
        >
          <template v-for="(m, index) in menus" :key="m.label">
            <a
              v-if="m.href"
              :href="m.href"
              class="bf-nav__link bf-nav__entry"
              :style="{ '--_bf-nav-order': index }"
              :data-external="m.external || undefined"
              v-bind="newTabAttrs(m.href)"
            >{{ m.label }}</a>
            <MenuLink
              v-else-if="m.to"
              class="bf-nav__link bf-nav__entry"
              :style="{ '--_bf-nav-order': index }"
              :item="m"
            />
            <Dropdown
              v-else
              class="bf-nav__entry"
              :style="{ '--_bf-nav-order': index }"
              :label="m.label"
              :items="m.items ?? []"
            />
          </template>
        </div>

        <form
          :id="`${searchId}-form`"
          class="bf-nav__search-form"
          role="search"
          aria-label="Site search"
          action="/search"
          method="get"
          :inert="!searchOpen"
          :aria-hidden="!searchOpen || undefined"
          @submit.prevent="submitSearch"
        >
          <label :for="searchId" class="visually-hidden">Search insights, projects and people</label>
          <input
            :id="searchId"
            ref="searchInput"
            v-model="searchQuery"
            class="bf-nav__search-input"
            type="search"
            name="q"
            placeholder="Search insights, projects and people"
            enterkeyhint="search"
          >
          <button class="bf-nav__search-submit" type="submit" aria-label="Submit search">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m15.5 15.5 5 5" />
            </svg>
          </button>
        </form>

        <button
          ref="searchButton"
          class="bf-nav__search-toggle"
          type="button"
          :aria-label="searchOpen ? 'Close search' : 'Search'"
          :aria-expanded="searchOpen"
          :aria-controls="`${searchId}-form`"
          @click="toggleSearch"
        >
          <svg v-if="searchOpen" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m15.5 15.5 5 5" />
          </svg>
        </button>
      </div>
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

  The search input restores a real outline above the base form styles.
  Links and buttons retain the shared focus treatment.
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
    /*
      Wide bar: every top-level entry is a full-height target (see the
      `width > 60rem` block below), so its padding is inline only, and the
      dropdown panels indent their items by the same inline value so a panel's
      text starts on its trigger's text. Was `0.25em 0.5em`.
    */
    --_bf-nav-item-padding-inline: var(--space-s);
    --_bf-nav-item-padding: 0 var(--_bf-nav-item-padding-inline);

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

    /*
      Elevation instead of a rule. The grey hairline that used to close the bar
      sat directly on the navy announcement band and read as a seam between
      two strips; a shadow lifts the bar over the band and the hero instead,
      and keeps doing so over whatever scrolls under the sticky bar. The deep
      variant because the band is navy: the standard medium shadow is tinted
      lighter than it and disappears there. The z-index below is what keeps the
      shadow painting on top of the band that follows.
    */
    box-shadow: var(--_bf-nav-shadow, var(--shadow-elevation-medium-deep));

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

  /*
    Wide bar: the entries fill the bar's full height, so hover and the open
    tint are a whole column of the bar rather than a chip floating in it, and
    a dropdown hangs from the bar's bottom edge. The bar's block padding moves
    into its height (same 76px band); the logo stays centred by the cluster.
    `width > 60rem` is the exact complement of the sheet's `max-width: 60rem`
    below, so the two never both apply. `nav/Dropdown.vue` carries the same
    query for the summary and panel it owns.
  */
  @container bf-nav (width > 60rem) {
    .bf-nav__bar {
      min-block-size: calc(var(--_bf-nav-height) + 2 * var(--space-2xs));
      padding-block: 0;
    }

    .bf-nav__menu {
      align-self: stretch;
      align-items: stretch;
      gap: 0;
    }

    .bf-nav__link {
      display: flex;
      align-items: center;
    }
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
      defaults to.

      Raised by design review, in two passes. The first tried +40% (1.75rem,
      28px) and was rejected on sight: the mark's lower band is an inverted
      shape with the letterforms knocked out, so below roughly 40px it fills
      in and reads as a solid bar rather than as the word FOUNDATION. +40% of
      a 20px mark is +8px inside a 76px-tall row — a real change that looks
      like none.

      `3.25rem` (52px) is where the two lines of the wordmark become legible
      at 1x. It leaves ~12px of breathing room above and below inside the
      76px row, so the bar does not grow and nothing else in it reflows.
      Roughly 56px is the ceiling before the row itself has to give.

      Then brought back down 20% by design review (2.6rem, ~42px): with the
      menu entries set in the new type, 52px outweighed the row. Still above
      the ~40px floor. The small-screen size is set in the container query
      below.
    */
    --_bf-logo-size: 2.6rem;
  }

  /*
    Top-level plain links. Same padding as a dropdown
    summary so the row reads as one set of targets — the wireframe's
    `.wf-nav__link` comment makes exactly this point about the pruned-nav
    buttons, and the `↗` affordance still comes from `a[data-external]`
    (`components/external-link.css`, gh#28).
  */
  .bf-nav__link {
    padding: var(--_bf-nav-item-padding);
    color: var(--_bf-nav-link-color);
    text-decoration: none;
  }

  .bf-nav__link:hover {
    text-decoration: underline;
  }

  .bf-nav__navigation {
    --_bf-nav-search-target: 2.75rem;
    --_bf-nav-search-stagger: 45ms;
    --_bf-nav-search-duration: calc(240ms + (var(--_bf-nav-count) - 1) * var(--_bf-nav-search-stagger));

    display: contents;
  }

  .bf-nav__search-toggle,
  .bf-nav__search-submit {
    display: inline-flex;
    flex: 0 0 var(--_bf-nav-search-target);
    align-items: center;
    justify-content: center;
    inline-size: var(--_bf-nav-search-target);
    min-block-size: var(--_bf-nav-search-target);
    padding: 0;
    border: 0;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-accent);
    cursor: pointer;
  }

  .bf-nav__search-toggle {
    align-self: center;
  }

  .bf-nav__search-toggle:hover,
  .bf-nav__search-submit:hover {
    background: var(--_bf-nav-open-bg);
  }

  .bf-nav__search-toggle svg,
  .bf-nav__search-submit svg {
    inline-size: 1.4rem;
    block-size: 1.4rem;
    fill: none;
    stroke: currentcolor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .bf-nav__search-form {
    position: absolute;
    display: flex;
    align-items: center;
    gap: var(--space-2xs);
    min-inline-size: 0;
    margin: 0;
    background: var(--_bf-nav-bg);
    visibility: hidden;
    pointer-events: none;
    clip-path: inset(-6px 0 -6px 100%);
  }

  .bf-nav[data-search-open] .bf-nav__search-form {
    visibility: visible;
    pointer-events: auto;
    clip-path: inset(-6px);
  }

  .bf-nav .bf-nav__search-input {
    min-inline-size: 0;
    min-block-size: var(--_bf-nav-search-target);
    padding: var(--space-2xs) var(--space-xs);
    border: 0;
    border-block-end: var(--border-width-thin) solid var(--color-accent);
    border-radius: 0;
    background: var(--_bf-nav-bg);
    color: var(--color-accent);
    caret-color: var(--color-accent);
    font: inherit;
    font-size: max(1rem, var(--size--1));
    box-shadow: none;
  }

  .bf-nav .bf-nav__search-input::placeholder {
    color: var(--color-text-muted);
    opacity: 1;
  }

  .bf-nav .bf-nav__search-input:focus-visible {
    outline: var(--border-width-medium) solid var(--color-accent);
    outline-offset: var(--border-width-medium);
  }

  @container bf-nav (width > 60rem) {
    .bf-nav__navigation {
      position: relative;
      display: flex;
      align-self: stretch;
      align-items: stretch;
      min-inline-size: 0;
    }

    .bf-nav__search-form {
      inset-block: 0;
      inset-inline: 0 calc(var(--_bf-nav-search-target) + var(--space-xs));
    }

    .bf-nav__entry {
      opacity: 1;
      transform: translateY(0);
    }

    .bf-nav[data-search-open] .bf-nav__entry {
      opacity: 0;
      transform: translateY(calc(-1 * var(--space-xs)));
    }
  }

  @container bf-nav (width <= 60rem) {
    .bf-nav__search-form {
      inset-block-start: 100%;
      inset-inline: 0;
      padding: var(--space-s);
      box-shadow: var(--shadow-elevation-medium-deep);
    }
  }

  /*
    The disclosure button, absent on desktop. `display: none` rather than a
    visually-hidden pattern: on a wide nav there is nothing for it to disclose,
    so it must not be in the accessibility tree either.
  */
  .bf-nav__toggle {
    display: none;
  }

  /*
    Small screens. `60rem` is where the row stops fitting on one line beside
    the logo (the logo, six entries and Search measure ~56rem at the body
    size), so below it the entries move into the sheet instead of wrapping.
    `nav/Dropdown.vue`'s container query uses the same number; container
    queries cannot read a custom property, so the two are kept in step by
    hand and each names the other.
  */
  @container bf-nav (max-width: 60rem) {
    /*
      30% under the original 52px (2.275rem, ~36px), by design review: beside
      the Menu button the wordmark only has to identify the site, and the bar
      is the one thing above every page on a phone. This sits under the ~40px
      floor noted on `.bf-nav__logo`; the knocked-out FOUNDATION band is the
      part to watch at 1x.
    */
    .bf-nav__logo {
      --_bf-logo-size: 2.275rem;
    }

    .bf-nav__toggle {
      /*
        A real 44px target (WCAG 2.5.8's comfortable size, 2.75rem), in the
        nav's own type and colour so it reads as part of the bar rather than as
        a call to action. The hairline border is what makes it read as a
        control at all without a filled ground competing with the logo.
        Square now that it carries only the icon: 44px both ways.
      */
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-block-size: 2.75rem;
      min-inline-size: 2.75rem;
      padding: 0;
      border: var(--border-width-thin) solid var(--_bf-nav-border-color);
      border-radius: var(--border-radius-s);
      background-color: var(--_bf-nav-bg);
      color: var(--_bf-nav-link-color);
      font: inherit;
      cursor: pointer;
    }

    .bf-nav[data-open] .bf-nav__toggle {
      background-color: var(--_bf-nav-open-bg);
    }

    .bf-nav__toggle-icon {
      inline-size: 1.25em;
      block-size: 1.25em;
      overflow: visible;
    }

    .bf-nav__toggle-line {
      fill: none;
      stroke: currentcolor;
      stroke-width: 1.5;
      stroke-linecap: round;
      transform-box: fill-box;
      transform-origin: center;
    }

    /* Open: the outer strokes cross, the middle one goes. */
    .bf-nav[data-open] .bf-nav__toggle-line--top {
      transform: translateY(4.5px) rotate(45deg);
    }

    .bf-nav[data-open] .bf-nav__toggle-line--middle {
      opacity: 0;
    }

    .bf-nav[data-open] .bf-nav__toggle-line--bottom {
      transform: translateY(-4.5px) rotate(-45deg);
    }

    /*
      The sheet. Hangs from the header's bottom edge (`.bf-nav` is sticky, so it
      is the containing block) and spans the full width, over the page rather
      than pushing it down — opening the menu must not reflow the page under it.

      `display: none` while closed takes every link out of the tab order.
      Capped at the viewport below the bar and scrolls on its own, because a
      sticky header taller than the screen has a bottom no one can reach.
    */
    .bf-nav__menu {
      display: none;
      position: absolute;
      inset-block-start: 100%;
      inset-inline: 0;
      flex-flow: column nowrap;
      align-items: stretch;
      gap: 0;
      max-block-size: calc(100svh - var(--_bf-nav-height) - var(--space-m));
      overflow-y: auto;
      overscroll-behavior: contain;

      /* The bar's own inline padding, so entries start on the logo's edge. */
      padding-block: var(--space-2xs) var(--space-s);
      padding-inline: var(--theme-center-padding, var(--space-s));
      background-color: var(--_bf-nav-bg);

      /* No closing rule: the sheet lifts off the page on the bar's own shadow. */
      box-shadow: var(--_bf-nav-shadow, var(--shadow-elevation-medium-deep));

      /*
        Touch-sized rows: every entry and summary in the sheet inherits this
        instead of the desktop row's `0.25em 0.5em`.
      */
      --_bf-nav-item-padding: var(--space-xs) 0;
    }

    .bf-nav[data-open] .bf-nav__menu {
      display: flex;
    }

    /* A hairline between entries, so a column of plain words reads as a list. */
    .bf-nav__menu > * + * {
      border-block-start: var(--border-width-thin) solid var(--_bf-nav-border-color);
    }

    .bf-nav__menu .bf-nav__link {
      display: block;
    }
  }

  /*
    The search reveal and menu stagger share a duration. The mobile sheet
    settles in from above and its icon folds. Reduced motion skips the movement.
  */
  @media (prefers-reduced-motion: no-preference) {
    .bf-nav {
      --_bf-nav-motion: 180ms;
    }

    .bf-nav__search-form {
      transition:
        clip-path var(--_bf-nav-search-duration) cubic-bezier(0.65, 0, 0.35, 1),
        visibility 0s var(--_bf-nav-search-duration);
    }

    .bf-nav[data-search-open] .bf-nav__search-form {
      transition-delay: 60ms, 0s;
    }

    @container bf-nav (width > 60rem) {
      .bf-nav__entry {
        transition:
          opacity 180ms ease-out,
          transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
        transition-delay: calc(90ms + var(--_bf-nav-order) * var(--_bf-nav-search-stagger));
      }

      .bf-nav[data-search-open] .bf-nav__entry {
        transition-delay: calc((var(--_bf-nav-count) - 1 - var(--_bf-nav-order)) * var(--_bf-nav-search-stagger));
      }
    }

    .bf-nav__toggle-line {
      transition:
        transform var(--_bf-nav-motion) cubic-bezier(0.16, 1, 0.3, 1),
        opacity var(--_bf-nav-motion) cubic-bezier(0.16, 1, 0.3, 1);
    }

    .bf-nav[data-open] .bf-nav__menu {
      animation: bf-nav-sheet-in var(--_bf-nav-motion) cubic-bezier(0.16, 1, 0.3, 1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bf-nav__entry {
      transition: opacity 90ms;
    }

    .bf-nav[data-search-open] .bf-nav__entry {
      transform: none;
    }
  }

  @keyframes bf-nav-sheet-in {
    from {
      opacity: 0;
      transform: translateY(calc(-1 * var(--space-2xs)));
    }
  }
}
</style>
