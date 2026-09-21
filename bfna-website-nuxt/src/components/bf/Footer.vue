<script setup lang="ts">
/**
 * `bfFooter` — the site footer (issue 36 / gh#45).
 *
 * Evolves `src/components/wireframe/wfFooter.vue`, which is frozen (D2) and was read, not edited.
 *
 * ## The two things this issue exists to fix
 *
 * **1. The content source.** The whole script block of the wireframe footer begins by destructuring `menus` out of the wireframe's content composable — the same D8/ADR-1 anti-pattern `bfNav` carried and #44 removed. `bfFooter` takes **`menus: Menu[]` as a prop and has no other source of anything**: no composable, no collection query, no store. The layout (#46) reads the data and passes it down; this component cannot render without being handed its content, which is the property that makes it probeable from a fixture array.
 *
 * As in `Nav.vue`, the two forbidden identifiers are deliberately not written anywhere in this file — not even inside this comment. The spec's acceptance is a literal `grep -L` over this source, and a docblock that quoted the thing it refuses would fail it while the code was perfectly correct. Same call `bfLogo` recorded for colour literals (gh#23).
 *
 * **2. The hand-pinned column count.** The wireframe pins `repeat(4, 1fr)` in an inline `style` on the menu row — one of the seven sites D9 names, and the one the BRIEF calls out as the `bf-*` successor case. Here the row is a `.grid` carrying `data-min-width` (issue 04 / gh#13): the column count is never authored, it is derived from the available inline size against a per-instance track floor, so the row reflows with no media query. The string this replaces appears nowhere in this file, which the spec also greps for.
 *
 * ### Why `data-min-width="s"` (a 200px floor)
 *
 * `.grid` is `auto-fill` over `minmax(min(floor, 100%), 1fr)`, so the track count is `floor((W + gap) / (track + gap))`. This row sits inside `.center` (content-box, `max-inline-size: 1100px`) with `data-gap="l"`, and `--space-l` is `clamp(1.75rem, 1.4914rem + 1.2931vw, 2.5rem)`. Against the 1200 / 800 / 400px reflow points issue 04's probe established:
 *
 * | viewport | container | gap | `s` (200px) | `m` (240px) | `l` (300px) |
 * |---|---|---|---|---|---|
 * | 1200px | 1100 | 39.4 | **4** | 4 | 3 ✗ |
 * | 800px  | ~766 | 34.2 | **3** | 2 | 2 |
 * | 400px  | ~371 | 29.0 | **1** | 1 | 1 |
 *
 * `l` fails the spec outright — three columns at the wide end. Between the two that pass, `s` is chosen because its middle step is 3 rather than 2: a four-column menu row keeps more of itself through the tablet band, and the cells hold short menu labels that have no use for a 240px floor. Recorded in the spec's Decisions.
 *
 * The 200px floor is still the floor, but the row does not keep the utility's `1fr` *maximum*: the `<style>` block re-sizes these tracks to grow toward their own `max-content`, because two of the six columns hold a link wider than an equal share of the row. The count above is unaffected — `auto-fill` resolves it from the track minimum, which is untouched. The why is with the declaration.
 *
 * ## The menu-link child
 *
 * Imported from `bfNav`'s `./nav/MenuLink.vue` **by explicit relative path**, which is what that component's own docblock anticipates for this issue and what `Nav.vue` and `nav/Dropdown.vue` already do. Not by its auto-import name: `nuxt.config.ts` registers `components/bf` with `pathPrefix: false` and `prefix: 'bf'`, which would flatten it to a top-level-looking `<bfMenuLink>`. The relative import makes the dependency visible in this file and does not depend on how the `components` array happens to be configured.
 *
 * Reuse rather than duplication is the point: the two chrome surfaces must render `MenuItem` data identically, which is exactly what the frozen `wfMenuLink`'s own comment says about its pair. `MenuLink` styles itself from `--_bf-nav-link-color` with a `var(--color-text)` fallback precisely so it stays legible mounted outside a nav — this component is that case.
 *
 * ## Structure — the wireframe's four bands, reordered
 *
 * ```
 * bfFooter
 *  ├ brand row     on-dark lockup · mission line ——— search field
 *  ├ social strip  ──◉──◉──◉──◉──◉──◉──   six marks ON the hairline
 *  ├ menu grid     one column per `menus` entry, each a <nav>
 *  │  ──────────── hairline
 *  └ legal row     © <year> · Privacy Policy · Site by ccm.design
 * ```
 *
 * The four bands are the frozen source's; what they carry is unchanged. Two things moved (Claudio, round 2). The lockup and the mission are one line rather than a stack, so the top band is a masthead — who this is on the left, the way in on the right. And the social strip moved from below the menu grid up to where the first hairline was, and then **became** it: the rule is drawn through the strip's own centre and each mark masks the segment beneath it with the band's ground, so the line survives as short dashes between the glyphs. There is no separate divider element left above the menu grid — two would be two lines.
 *
 * What changed with the skin is the *treatment*: the band inverts onto the institutional ground, the two rules between bands are hairlines rather than a border above the whole footer, and the brand block gains the mission line it never had. All of it is declared in the `<style>` block — the table of roles, tokens and measured contrast ratios lives there, next to the declarations it describes.
 *
 * The column heading repeats the wireframe's `v-if` / `v-else-if` / `v-else` precedence exactly: an entry that names a destination is a link (`href` first, then `to`), and one that names none is plain `<strong>` text. Unlike `bfNav` there is no disclosure tier here — a footer column shows its items.
 *
 * ## The search field — and why it is NOT a `<form>`
 *
 * A query input and a submit button replacing the ghost "Search →" link the frozen source carried. Enter in the field and a press of the button both run `goToSearch()`, which is one `navigateTo('/search?q=…')`; `/search` reads `q` off `route.query` (`pages/search.vue:126-131`) and needs nothing else.
 *
 * **The obvious implementation — `<form role="search" action="/search" method="get">` — was written first, verified working, and then removed**, because it fails a gate this repo enforces. `scripts/check-routes.ts`'s gh#227 group asserts that `/search` exposes *exactly one* `[role="search"], search` element and *exactly one* `<form>`: one, not at least one, because a second search region makes "jump to search" ambiguous for a screen-reader user, and because that route's shell owns the only form ownership the page's implicit submission is defined against. The footer is site chrome, so it renders on `/search` too — a `<form role="search">` here is a second of both, on that one route, and the gate fails red.
 *
 * So this control carries **no `role="search"` and no `<form>`**. The spec anticipated the handler as the alternative and named `navigateTo` for it. What is given up is real: the field does not work with scripting off, and the footer's search is a labelled control rather than a named landmark. Changing gh#227 instead — to count landmarks inside `<main>`, say — would be the other way to spend it, and it is a decision about an accessibility guard rather than about this component, so it is not taken here.
 *
 * `goToSearch` is navigation, not state: nothing is emitted and nothing is stored beyond the field's own text, so the "presentational-only" property below still holds in the sense D8 means it — this component is still not a source of content.
 *
 * The label is `aria-label` on the input rather than a `<label>` element: the placeholder is not a label (it disappears on the first keystroke), and a visible label above a single field in a footer band is a line of chrome for a control whose purpose its own placeholder and adjacent arrow already state. The button's name comes from a visually-hidden "Search", not from the arrow, which is `aria-hidden` — the same split `nav/MenuLink.vue` makes for the arrow that arrives as data (gh#221).
 *
 * ## What is deliberately absent
 *
 * - **No subscribe band** (D2). The frozen source's header comment already says the subscribe band was never the footer's, and D2 killed it outright.
 *
 * Presentational-only (D8): one prop in, nothing out.
 */
import type { Menu } from '~/types/bf-contracts'
import MenuLink from './nav/MenuLink.vue'
import { newTabAttrs } from '~/utils/link'

defineOptions({ name: 'BfFooter' })

defineProps<{
  menus: Menu[]
}>()

/**
 * Real social profiles (`static-content.json`, legacy Frame). Order and the Twitter→Bluesky swap per Irene (widget feedback, Aug 5). Order and URLs ported verbatim from the frozen source, this note included.
 *
 * NOTE: Bluesky profile URL is a PLACEHOLDER — Irene to supply the real one.
 *
 * ## Why the glyph is a `d` string in this array and not six components
 *
 * Each `path` is the single-shape Simple Icons mark for the network, on the family's own 24×24 viewBox (`simple-icons` 11.14/16.31, CC0). One subpath per brand, no groups, no per-brand colour — which is what lets the whole strip be painted by `currentColor` and dimmed with one `opacity` rule instead of six. LinkedIn's row is the 11.x path: the brand asked to be removed from the package after that release, so the current version no longer ships it, and the mark itself has not changed.
 *
 * Six `<svg>` blocks in the template would be six near-identical wrappers differing only in one attribute, and a shared `bfIcon` component would be a new dependency for one strip in one component. The data already loops; the glyph rides along with the name and the URL it belongs to.
 *
 * No colour literal: the paths carry geometry only, and the `<path>` is filled with `currentColor` in the template (BRIEF §5 rule 2, DoD-6).
 */
const socials = [
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/company/bertelsmann-foundation-north-america-inc.',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/bertelsmannfoundation/',
    path: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077'
  },
  {
    name: 'Bluesky',
    url: '#bluesky-profile-url',
    path: 'M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026'
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/BertelsmannFoundation/',
    path: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z'
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'
  },
  {
    name: 'Vimeo',
    url: 'https://vimeo.com/bfna',
    path: 'M23.9765 6.4168c-.105 2.338-1.739 5.5429-4.894 9.6088-3.2679 4.247-6.0258 6.3699-8.2898 6.3699-1.409 0-2.578-1.294-3.553-3.881l-1.9179-7.1138c-.719-2.584-1.488-3.878-2.312-3.878-.179 0-.806.378-1.8809 1.132l-1.129-1.457a315.06 315.06 0 003.501-3.1279c1.579-1.368 2.765-2.085 3.5539-2.159 1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.5069.5389 2.45 1.1309 3.674 1.7759 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.8679 3.434-5.7568 6.7619-5.6368 2.4729.06 3.6279 1.664 3.4929 4.7969z'
  }
]

/**
 * The submit arrow on the search field — decoration, so it is `aria-hidden` in the template and the button's accessible name comes from a visually-hidden "Search" instead. Same 24×24 viewBox as the social marks so one icon rule sizes both. Geometry only; painted with `currentColor`.
 */
const arrowPath = 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z'

/** What the reader has typed into the footer's query field. */
const searchQuery = ref('')

/**
 * Go to `/search`, carrying the query if there is one.
 *
 * `navigateTo` rather than a form submission — see the docblock for why this component may not ship a `<form>`. One function for both entry points (Enter in the field, a press of the button) so the two cannot drift.
 *
 * An empty field still navigates, and deliberately: pressing Enter in a search box should never look broken, and `/search` with no `q` is the search page's own resting state, which is a better answer than silence. `trim()` so a field holding only spaces counts as empty rather than searching for them, and the key is omitted entirely in that case so the URL stays `/search` rather than `/search?q=`.
 */
function goToSearch() {
  const q = searchQuery.value.trim()
  return navigateTo({ path: '/search', query: q ? { q } : {} })
}

/**
 * Computed at render, as the wireframe computes it — a year baked into the bundle at build time is wrong from the next 1 January until someone redeploys, and this is a statically generated site.
 */
const year = new Date().getFullYear()
</script>

<template>
  <!--
    `$attrs` falls through to this root (no `inheritAttrs: false` — this is not a wrapper around a base component), so a consumer's `class`, `style` (including the `--_bf-footer-*` hooks) and `data-*` land on the `<footer>`.
  -->
  <footer class="bf-footer">
    <div class="bf-footer__inner | center stack" data-gap="m">
      <!--
        Top band — the masthead of the colophon: who this is, and the way in. `.cluster` with `space-between`, so the lockup sits left and the search field sits right on the same line, and the two simply stack when the row runs out of room (the mobile reflow, with no media query).
      -->
      <div class="bf-footer__top | cluster" data-gap="l">
        <!--
          Lockup and mission on ONE line (Claudio, round 2), so the top band is a single row: mark · tagline ——— search. A second `.cluster` rather than the `.stack` this was, which is the whole of the change — the composition already wraps, so the phone layout (mark and tagline stacked above a full-width field) is what this row does when it runs out of inline size, with nothing authored for it.
        -->
        <div class="bf-footer__brand | cluster" data-gap="m">
          <!--
            The on-dark lockup. `bfLogo`'s `variant="white"` is the inverted artwork its own docblock describes as legible only on a dark ground — which is exactly this band — and the mark itself spells "Bertelsmann Foundation North America", carried into the accessibility tree by the component's `<title>` / `aria-labelledby`. So the organisation's name is present once, visually and to assistive technology, rather than twice: a text line repeating the words already drawn in the lockup directly beneath it would be duplicated copy and a duplicated announcement. Sized through the documented `--_bf-logo-size` ancestor hook, never inline.
          -->
          <bfLogo variant="white" class="bf-footer__mark" />
          <p class="bf-footer__mission">An independent, nonpartisan think tank dedicated to strengthening the transatlantic partnership.</p>
        </div>

        <!--
          The way in, as a control rather than as a link to a control.

          A `<div>`, with no `role="search"` and no `<form>` — read the docblock before "fixing" either back: both are second instances of things `scripts/check-routes.ts`'s gh#227 group asserts are unique on `/search`, where this footer also renders, and restoring them turns that gate red.

          `type="search"` rather than `text`: it gets the platform's clear affordance and the correct virtual keyboard, and screen readers announce "search field", which is the one thing the placeholder cannot say.

          `@keydown.enter.prevent` is what a form's implicit submission would have given for free. `.prevent` because a bare Enter in a search field is otherwise a no-op the browser may still act on, and the navigation is now ours to perform.
        -->
        <div class="bf-footer__search">
          <input
            v-model="searchQuery"
            class="bf-footer__search-field"
            type="search"
            name="q"
            placeholder="Search"
            aria-label="Search the site"
            @keydown.enter.prevent="goToSearch"
          >
          <!--
            `type="button"`: there is no form to submit, and the default `submit` type would make this control look like one to anything reading the tree.
          -->
          <button
            class="bf-footer__search-submit"
            type="button"
            @click="goToSearch"
          >
            <span class="visually-hidden">Search</span>
            <!--
              `focusable="false"` alongside `aria-hidden`: IE/legacy Edge put inline `<svg>` in the tab order regardless of the ARIA, which would give the button two stops. Harmless everywhere else.
            -->
            <svg
              class="bf-footer__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            ><path :d="arrowPath" fill="currentColor" /></svg>
          </button>
        </div>
      </div>

      <!--
        The social strip, which is also the first hairline: the rule is drawn by this list's own `::before` through its vertical centre, and each mark masks the segment under it with the footer's ground (Claudio, round 2). There is no separate divider element below it any more — two would be two lines.

        `role="list"` for the reason given on the `bf-footer__menus` list below, and load-bearing twice over here: `aria-label` is only exposed on an element whose role supports a name, so without the role this list loses its name as well as its semantics (gh#220).
      -->
      <ul
        class="bf-footer__social | cluster"
        role="list"
        data-gap="l"
        aria-label="Social media"
      >
        <li
          v-for="s in socials"
          :key="s.name"
        >
          <!--
            The network's name is the link's accessible name and is carried by a visually-hidden span rather than by `aria-label`: a visible text node survives translation, is what a text-only or stylesheet-stripped rendering falls back to, and — unlike a label on an element whose only content is an `aria-hidden` graphic — leaves nothing for the accessibility tree to disagree about.

            `data-external` stays, because these are off-site and `src/utils/link.ts`'s rule says so; the ↗ the marker would inject is suppressed on this one class through the documented `--_bf-external-marker` hook (see the style block). Not by dropping the attribute: `newTabAttrs` and the marker read the same fact, and removing it to change one glyph would desynchronise them.
          -->
          <a
            :href="s.url"
            class="bf-footer__social-link"
            data-external
            v-bind="newTabAttrs(s.url)"
          >
            <svg
              class="bf-footer__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            ><path :d="s.path" fill="currentColor" /></svg>
            <span class="visually-hidden">{{ s.name }}</span>
          </a>
        </li>
      </ul>

      <!--
        The four menu columns. `.grid[data-min-width]` (issue 04): the column count is derived, never authored — see the table in the script block for why the floor is `s`. A `<ul>` because it is a list of navigation groups; `ul[class]` is already unstyled by `base/reset.css`.

        `role="list"` is not redundant: `base/reset.css:95-103` strips `list-style` from every `ul[class]`, and WebKit reads that declaration as the author no longer meaning a list — VoiceOver stops saying "list, N items" and stops offering list navigation. Restating the implicit role puts the semantics back without putting the bullets back. Same fix and same reason as `nav/Dropdown.vue:109` and `Breadcrumb.vue:238-240` (gh#220, D27).
      -->
      <ul
        class="bf-footer__menus | grid"
        role="list"
        data-min-width="s"
        data-gap="l"
      >
        <li
          v-for="m in menus"
          :key="m.label"
        >
          <nav :aria-label="`Footer — ${m.label}`">
            <!--
              Same precedence as the frozen source: an entry that names a destination is a link, `href` before `to`; one that names none is plain text. `|| undefined` rather than `|| false` — an attribute bound to `false` is removed, but one bound to the *string* `"false"` is not, and `[data-external]` matches on presence.
            -->
            <p class="bf-footer__heading">
              <a
                v-if="m.href"
                :href="m.href"
                class="bf-footer__link"
                :data-external="m.external || undefined"
                v-bind="newTabAttrs(m.href)"
              ><strong>{{ m.label }}</strong></a>
              <NuxtLink
                v-else-if="m.to"
                :to="m.to"
                class="bf-footer__link"
              ><strong>{{ m.label }}</strong></NuxtLink>
              <strong v-else>{{ m.label }}</strong>
            </p>

            <!--
              `role="list"` for the reason given on the `bf-footer__menus` list above: `base/reset.css` strips the marker from every `ul[class]` and WebKit drops the implicit list role with it (gh#220).
            -->
            <ul
              v-if="m.items"
              class="bf-footer__items"
              role="list"
            >
              <li
                v-for="i in m.items"
                :key="i.label"
              >
                <MenuLink :item="i" />
              </li>
            </ul>
          </nav>
        </li>
      </ul>

      <!--
        Bottom band — copyright left, the two small print links right, with a hairline above it. A `.cluster` rather than a two-column grid so the right-hand pair wraps under the copyright on a phone instead of being squeezed, which is the "bottom bar wraps to two lines" behaviour, again with no media query.
      -->
      <div class="bf-footer__legal | cluster" data-gap="m">
        <p>© {{ year }} Copyright Bertelsmann Foundation.</p>
        <div class="cluster" data-gap="m">
          <p><a href="#" class="bf-footer__link">Privacy Policy</a></p>
          <p>Site by <a href="https://ccm.design" class="bf-footer__link" data-external v-bind="newTabAttrs('https://ccm.design')">ccm.design</a></p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/*
  No `:not()` anywhere in this file (D-20.5, gh#29): `postcss-preset-env` mis-lowers a `:not()` containing a complex selector and silently breaks the rule, so the ban is on the construct rather than on the mistake.

  One focus declaration, and only one. `base/focus.css` (#146) is still the ring: this band does not restate the outline, the offset or the halo. What it cannot inherit is the *colour* — that file paints `--color-text` deliberately, because `outline-offset` draws the ring on the page ground and the page ground is light. This band inverts the ground, so the same token would paint a near-black ring on a dark navy field (1.2:1) and the indicator would vanish (WCAG 1.4.11). `outline-color` alone is overridden, to the inverse text token, which is the minimum that keeps #146's floor intact everywhere else.

  `@layer components` must survive into the built stylesheet — the cascade-layer polyfill that used to flatten these blocks into unlayered rules is off in `nuxt.config.ts`, and the probe reads the live CSSOM so a regression fails the run rather than shipping quietly.
*/
@layer components {
  .bf-footer {
    /*
      Declared in the rule, not bound inline through a `cssVars` computed (the `bfMedia` lesson, gh#26): a component that writes its own custom properties inline is no more overridable than one writing flat declarations inline, because an ordinary consumer rule cannot outrank an inline style. This component emits no inline `style` at all — which is also the spec's "no inline column style", asserted by the probe over every element it renders rather than over the grid row alone.
    */

    /*
      ── The dark colophon ────────────────────────────────────────────────

      The band inverts: an institutional navy ground with light type, so the footer reads as the sheet's colophon rather than as one more page section. Five roles, five existing tokens, no new colour and no colour literal (BRIEF §5 rule 2, DoD-6) — every one of them already in `semantic-colors.css`'s var() graph:

      | role     | token                       | contrast on the ground |
      |----------|-----------------------------|------------------------|
      | ground   | `--color-accent-shade-90`   | — (it is the ground)   |
      | headings | `--color-text-inverse`      | 12.76:1                |
      | links    | `--color-accent-tint-20`    |  8.77:1                |
      | muted    | `--color-accent-tint-30`    |  7.13:1                |
      | fine     | 60% of the heading colour   |  5.56:1                |
      | hairline | `--color-accent-tint-70`    |  2.61:1 (decorative)   |

      No colour literal names any of them, here or in the declarations — not even as a comment's aside, so the spec's verbatim `grep` acceptance expression returns 0, which is the same call `bfLogo` recorded for gh#23.

      Measured, not estimated: each tint is `color-mix(in srgb, accent N%, white)`, composited in sRGB and run through the WCAG 2.x relative luminance formula. Every text role clears 4.5:1 with room to spare, so the reduced-emphasis link colour is a real reduction in emphasis rather than a reduction in legibility. The hairline carries no information and names nothing, which is the one role allowed under the 3:1 floor — it is a rule on a page, not a UI boundary (WCAG 1.4.11 applies to the latter).

      ── Why the ground moved down a step ────────────────────────────────────

      The band was `--color-accent` itself. It is now the accent taken 10% toward black, which reads as a deeper close to the sheet and — because every text role is *lighter* than the ground — buys contrast rather than spending it: each ratio above went up, not down.

      The token is **not new**. `semantic-colors-shades-and-tints.css` already generates the whole shade ramp, and its naming states the *proportion of the source colour that survives the mix* — `shade-90` is `color-mix(in srgb, var(--color-accent) 90%, black 10%)`, the file's line 204, which is exactly "10% darker". Adding a second custom property with the same value under an inverted name would have made the file's ramp read two ways at once, so nothing was added there.
    */

    /** The footer's ground: the accent, one 10% step toward black. */
    --_bf-footer-bg: var(--color-accent-shade-90);

    /** Full-strength type: column headings, and every link on hover. */
    --_bf-footer-color: var(--color-text-inverse);

    /** Reduced emphasis: the mission line and the small print. */
    --_bf-footer-muted: var(--color-accent-tint-30);

    /** The hairlines that separate the bands. */
    --_bf-footer-hairline: var(--color-accent-tint-70);

    /** Search field fill — inverse text lifted slightly above the band ground. */
    --_bf-footer-search-bg: color-mix(in srgb, var(--color-text-inverse) 8%, var(--_bf-footer-bg));

    /*
      The fine print: the legal bar's resting colour, at 60% of the heading colour's strength.

      Written as a `color-mix` against the band's own ground rather than as `opacity: 0.6` on the bar, and the reason is the hover state rather than taste. `opacity` on an ancestor composites the whole subtree, and nothing inside it can climb back out — a link in a 0.6 bar cannot reach full strength on hover, because 1 × 0.6 is still 0.6. Mixing a *colour* instead puts the same 60% on the resting text (measured 5.56:1, above the 4.5 floor, where the muted tint at 60% would have landed at 3.54:1 and failed it) and leaves `.bf-footer__link:hover` free to paint the full token, which is the state change the bar exists to offer.

      Both operands are tokens; no colour literal (BRIEF §5 rule 2).
    */
    --_bf-footer-fine: color-mix(in srgb, var(--color-text-inverse) 60%, var(--color-accent-shade-90));

    /*
      The social marks' resting and active strength. `opacity` is right *here*, where the legal bar could not use it: the anchor that carries the opacity is the same element that takes `:hover` / `:focus-visible`, so raising the value is simply a new value on the same box, with no ancestor compositing anything.
    */
    --_bf-footer-icon-rest: 0.35;
    --_bf-footer-icon-active: 0.9;

    /** The drawn size of a social or submit mark. */
    --_bf-footer-icon-size: 1.3125rem; /* 21px — tuned on the gap dial, Sep 2026 */

    /*
      The pointer target around a mark. Not the mark's own size: WCAG 2.5.8 asks for 24 CSS px and 2.5.5 (AAA) for 44; 2.5rem is the 40px the BRIEF settled on, and it is expressed as a `min-*` so a longer control (the submit button) grows past it rather than being pinned to it.
    */
    --_bf-footer-hit-area: 2.5rem;

    /*
      Read by `nav/MenuLink.vue` through inheritance. That component declares `color: var(--_bf-nav-link-color, var(--color-text))` with the fallback for exactly this case; setting it here means a consumer restyling the footer's links restyles the reused child with it, instead of the child quietly keeping the nav's colour. It is also the one hook the bands below re-declare on themselves — `.bf-footer__heading` and `.bf-footer__legal` — so a band's links take that band's colour by inheritance, and no rule has to out-specify the `:hover` rule to do it.
    */
    --_bf-nav-link-color: var(--color-accent-tint-20);

    /*
      The only motion in the file. A duration, not a whole `transition` shorthand, so `prefers-reduced-motion` has exactly one value to zero out (the media query at the end of this block) rather than four rules to restate.
    */
    --_bf-footer-motion: 150ms;

    /*
      The mission line's measure. Not a comfort-of-reading value — the sentence is 94 characters and will be read in one glance — but a *shape*: beside the mark it should be a two-line block roughly as tall as the lockup, so the pair reads as one lockup rather than as a mark with a paragraph trailing off it (Claudio, round 2).

      38ch is measured, not guessed. At the band's `--size--1`, 36ch breaks the sentence into three ragged lines (223 / 205 / 187px) and 37ch is the first value that gives two (323 / 297px); 38 is that value plus one step of headroom, so a fallback face with slightly wider metrics does not drop back to three. Everything from 37ch up produces the same two lines, so the choice inside that range only sets how much of the row the tagline claims before the search field takes the rest.
    */
    --_bf-footer-measure: 38ch;

    margin-block-start: var(--space-xl);

    /*
      The rhythm the band is built on: a deep opening, a shallower close, and `--space-m` between bands from the `.stack` on the inner wrapper. No border above it — the change of ground *is* the boundary, and a rule drawn on top of a colour change is a rule saying the same thing twice.
    */
    padding-block: var(--space-2xl) var(--space-l);
    background-color: var(--_bf-footer-bg);
    color: var(--_bf-footer-color);

    /*
      The UI face, stated rather than inherited: `:root` already sets it, but this band's whole type treatment is authored here and a footer that silently followed a future change to the body face would be a surprise. The light weight is the band's resting weight; the headings take the one step up, below.
    */
    font-family: var(--font-family-ui);

    /*
      The band's size, set once on the band. Everything in a colophon is fine print — menu items, the mission line, the search field, the social row — so the step is declared here and inherited, rather than repeated on each of the five rules that would otherwise have to say it. `--size--1` is the scale's first step below body copy and renders 13.3px→14.6px across the viewport range, which is the 12–14px band asked for.

      Two rules take the next step down (`--size--2`, ~11px): the column headings, which are tracked-out labels rather than reading text, and the legal bar. Nothing here is set in absolute px — the steps are Utopia's fluid clamps, so the footer rescales with the page instead of pinning itself against it.
    */
    font-size: var(--size--1);
    font-weight: var(--font-weight-light);
  }

  /*
    The size container the bands query. Named, for the reason `bfNav` names its own: an unnamed query binds to the nearest container, which a consumer could introduce between this element and the rule that asks.

    Only the social strip asks today (it needs to know when six marks would stop fitting on one line), but the container belongs on the element whose inline size the bands actually share — `.center`'s content box — rather than on the one band that happens to need it first.

    `inline-size` computes to `contain: layout style inline-size`; not paint, so the hairline the strip draws is not clipped, and not `size`, so the block axis is still content-driven.
  */
  .bf-footer__inner {
    container-type: inline-size;
    container-name: bf-footer-bands;
  }

  /*
    The colour half of `base/focus.css`'s ring, and nothing else — see the note at the top of this block for why the inherited value cannot work over an inverted ground.
  */
  .bf-footer :focus-visible {
    outline-color: var(--_bf-footer-color);
  }

  /*
    Every link the footer authors itself. The reused `MenuLink` children are styled by their own rule further down, because their class is theirs.

    Undecorated at rest, underlined on hover — the judgement the frozen skin already made (`.wireframe .wf-footer a`) and this inherits rather than relitigates. What is new is that hover is the *only* state change and it does two things at once: the colour goes to full strength and the underline appears, offset far enough clear of the descenders to read as a rule under the word rather than a strike through its tail.
  */
  .bf-footer__link {
    color: var(--_bf-nav-link-color);
    text-decoration: none;
    text-underline-offset: 0.25em;
    transition: color var(--_bf-footer-motion) ease;
  }

  .bf-footer__link:hover {
    color: var(--_bf-footer-color);
    text-decoration: underline;
  }

  /*
    The same two states for the reused child. `:deep()` because `MenuLink` brings its own class (`.bf-nav__item`) and its own `@layer components` rules; this pair is more specific, so it wins inside the footer and leaves the nav's copy of the component untouched. The colour itself is *not* set here — it arrives through `--_bf-nav-link-color`, which is the hook that component publishes for exactly this.
  */
  .bf-footer :deep(.bf-nav__item) {
    text-underline-offset: 0.25em;
    transition: color var(--_bf-footer-motion) ease;
  }

  .bf-footer :deep(.bf-nav__item:hover) {
    color: var(--_bf-footer-color);
  }

  /*
    Top band. `space-between` puts the search field opposite the lockup, so the two sit at the ends of one line. Both wrap on their own when the row is too narrow, which is the phone layout.
  */
  .bf-footer__top {
    /*
      The size container the search field's stacked rule queries — the same named-container idiom `bfNav` uses for its dropdowns' narrow rule, and named for the same reason: an unnamed query would bind to whatever container a consumer happens to wrap the footer in.

      A container query rather than a media query because the question being asked is about this *row*, not about the viewport: the field goes full-width exactly when the brand block and it have stopped sharing a line, and that is decided by the row's own inline size — which is what makes the answer still correct inside a narrow consumer at a wide viewport. `inline-size` computes to `contain: layout style inline-size`, not paint, so nothing here is clipped.
    */
    container-type: inline-size;
    container-name: bf-footer-top;
    justify-content: space-between;

    /*
      `center`, not the `baseline` this was. The left-hand side is no longer a column whose first line could be lined up with the field: it is a row of a mark and a wrapped sentence, and its first baseline is the mission's first line — so a baseline here would float the search field up against the top of the band whenever the tagline ran to three lines. Centring ties the field to the middle of the lockup, which is stable at every width.
    */
    align-items: center;
  }

  /*
    Mark and mission side by side, vertically centred on each other — the `.cluster` default, and the right one here: the mission is two or three short lines beside a mark that is one solid shape, so a baseline would tie the mark to the mission's *first* line and hang the rest of the sentence below it. Centring makes the pair read as one lockup.

    No width is pinned on this block: the measure now lives on the text it measures (below), so the row is exactly as wide as the mark plus the tagline plus one gap, and the search field takes the space that is left.
  */
  .bf-footer__brand {
    align-items: center;
  }

  /*
    The ancestor hook `bfLogo` documents, not an inline `style` — this component emits none at all. `--size-2` rather than a bare length so the mark scales with the same fluid ramp as the type beside it.
  */
  .bf-footer__mark {
    --_bf-logo-size: calc(var(--size-2) * 1.1);

    /*
      Load-bearing, not tidiness. `bfLogo` sets `inline-size: auto`, so the `<svg>`'s box is whatever its flex parent gives it and `preserveAspectRatio` then centres the artwork inside that box — which is how the mark once rendered visually indented while every box-model reading said it was flush left. `flex: 0 0 auto` pins the box to the artwork's own intrinsic size in both axes: it cannot be stretched by a column, and it cannot be shrunk by a crowded row.
    */
    flex: 0 0 auto;
  }

  /*
    The measure sits on the sentence, not on the block around it — the block is now a row containing the mark as well, and a cap there would have been a cap on the pair.

    `text-wrap: balance` makes the two lines equal-ish rather than letting the second one be a short tail. It happens to be a no-op for this exact string at this exact measure (both algorithms land on 323 / 297px), which is the point of declaring it: it is insurance for the day the copy changes, not a fix for today's, and it degrades to normal wrapping where unsupported.
  */
  .bf-footer__mission {
    max-inline-size: var(--_bf-footer-measure);
    color: var(--_bf-footer-muted);
    line-height: var(--leading-body);
    text-wrap: balance;
  }

  /*
    ── The search field ───────────────────────────────────────────────────

    One lifted surface — field and submit share the wrapper's fill and radius; both children stay borderless inside it.

    `inline-size: 50%` of the top row — which is the footer wrapper's content box — so on the wide layout the field is half the colophon, not an 18rem stub. The container query below is the other half: once the row is too narrow for the lockup and a half-width field to sit side by side, the field has a line to itself and takes all of it.
  */
  .bf-footer__search {
    display: flex;
    align-items: stretch;
    flex: 0 0 50%;
    inline-size: 50%;
    background-color: var(--_bf-footer-search-bg);
    border-radius: var(--radius-s);
    overflow: hidden;
  }

  /*
    Stacked: the field fills its line.

    46rem is not a device width, it is derived from the row's own contents. The lockup side is ~470px (mark + gap + 38ch) and the field is half the row, so they stop sharing a line around 1020px. 46rem (736px) sits well below that wrap, which is the property that matters: the 100% rule can only fire on a row that has already wrapped, so widening the field never causes the wrap it is responding to.
  */
  @container bf-footer-top (max-width: 46rem) {
    .bf-footer__search {
      inline-size: 100%;
    }
  }

  /*
    The ring is drawn once, around the whole control, when anything inside it takes focus — rather than twice, once per child, which is what the inherited `:focus-visible` rule would do. `:focus-within` is deliberately *not* `:focus-visible`: the field is a text input, and a text input that has been clicked into has a caret in it and should show where it is.

    `outline-color` only, for the reason at the top of this block — the offset, width and halo stay `base/focus.css`'s.
  */
  .bf-footer__search:focus-within {
    outline: var(--border-width-medium) solid var(--_bf-footer-color);
    outline-offset: var(--border-width-medium);
    box-shadow: var(--outline-focus);
  }

  /*
    Transparent inside the lifted wrapper. `inherit` on the face and size rather than a restatement, so the field follows the band's type instead of the UA's `font: -webkit-small-control`.

    `min-inline-size: 0` is load-bearing: a flex item's automatic minimum size is its content's, and an `<input>`'s intrinsic `size` attribute defaults to 20 characters — so without it the field refuses to shrink below roughly 20ch and the control overflows its own box on a phone.
  */
  .bf-footer__search-field {
    flex: 1 1 auto;
    inline-size: auto;
    min-inline-size: 0;
    padding: var(--space-2xs) var(--space-xs);
    border: 0;
    border-radius: 0;
    background-color: transparent;
    color: var(--_bf-footer-color);
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    line-height: var(--leading-body);
  }

  /*
    The placeholder is not a label, so it is set at the muted role rather than at the field's own colour — it should read as a hint and stop competing with whatever the reader types over it. 7.13:1 on this ground, so "light" here means lower emphasis and not lower legibility.
  */
  .bf-footer__search-field::placeholder {
    color: var(--_bf-footer-muted);
    opacity: 1;
  }

  /*
    Suppress per-child focus rings — the wrapper's `:focus-within` rule above draws one ring around the whole control.
  */
  .bf-footer__search-field:focus,
  .bf-footer__search-field:focus-visible,
  .bf-footer__search-submit:focus,
  .bf-footer__search-submit:focus-visible {
    border: 0;
    outline: none;
    box-shadow: none;
  }

  /*
    Safari paints its own clear button ("×") inside `type="search"`, positioned and coloured for a light field. Hidden rather than restyled: the control is unstyleable beyond its appearance, and Escape already clears a search field on every platform.
  */
  .bf-footer__search-field::-webkit-search-cancel-button {
    appearance: none;
  }

  /*
    The submit. A button, not an icon glued to the field — so it is reachable by keyboard, announced as a button, and hit like one. Its accessible name is the visually-hidden "Search" in the template; the arrow is decoration.
  */
  .bf-footer__search-submit {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--_bf-footer-hit-area);
    padding: 0 var(--space-xs);
    border: 0;
    background-color: transparent;
    color: var(--_bf-footer-color);
    opacity: var(--_bf-footer-icon-rest);
    cursor: pointer;
    transition: opacity var(--_bf-footer-motion) ease;
  }

  .bf-footer__search-submit:hover,
  .bf-footer__search-submit:focus-visible {
    opacity: var(--_bf-footer-icon-active);
  }

  /*
    Both mark families — the six social glyphs and the submit arrow — are on the same 24×24 viewBox, so one rule sizes all seven. `display: block` because an inline `<svg>` sits on the text baseline and reserves descender space beneath itself, which would push every icon a few pixels off the centre of the box its flex parent just centred it in.
  */
  .bf-footer__icon {
    display: block;
    inline-size: var(--_bf-footer-icon-size);
    block-size: var(--_bf-footer-icon-size);
  }

  /*
    Every list item in the footer, so `gap` is the single source of spacing here and nothing else contributes to it.

    `p` as well: reset only zeros `margin-block-end`, so UA `margin-block-start: 1em` on `.bf-footer__mission` sat under the lockup and made `align-items: center` a lie.

    Two separate consequences, which is why the selector is the broad one rather than only the menu-item list:

    1. **Menu items sit at line-height spacing** — no gap between a column heading and its first item, and none between items (Claudio, Aug 5).
    2. **Row gaps equal column gaps in the menu grid.** Its `<li>` columns are grid items, so a block margin on them is *added* to the row gap the moment the row wraps — which is every narrow width, where four columns become four rows. A grid whose vertical rhythm changes with its column count is the exact failure the frozen skin's own `ul.grid > li { margin-block: 0 }` rule exists to prevent, and its comment says so.

    The frozen skin reaches both with *unlayered* rules, because when they were written `base/typography.css` leaked `li { margin-bottom: 0.5em }` outside its `@layer defaults` block and unlayered author rules outrank every layer. gh#116 moved that closing brace, so the declaration is now inside `defaults` and this ordinary `@layer components` rule outranks it. Copying the wireframe's unlayered workaround would be reintroducing the defect it worked around. The probe measures the resulting margins, and separately measures that the grid's row gap equals its column gap when it wraps — rather than trusting this note.
  */
  .bf-footer p,
  .bf-footer li {
    margin-block: 0;
  }

  /*
    The band's size, actually applied. `.bf-footer`'s `font-size` above is the single declaration of the step, but inheritance is the weakest thing in the cascade: `base/typography.css:123-127` sets `p, dl, li { font-size: var(--size-0) }`, and a rule that *matches* an element beats a value that merely reaches it — so every paragraph and list item in the footer was re-inflated to body size the moment it inherited nothing.

    `inherit` rather than a second copy of `var(--size--1)`: that keeps one authored size for the band and lets `.bf-footer__heading` and `.bf-footer__legal` set their own steps without this rule winning. Restating the token here would silently override those, which is the bug this rule is fixing, one level further in.

    The heading rule below is written as `.bf-footer .bf-footer__heading` for the same reason: this selector is (0,1,1), so a single-class rule would lose to it and the column labels would come back at the band's size.
  */
  .bf-footer p,
  .bf-footer li {
    font-size: inherit;
  }

  /*
    Middle band, and the one rule in the file that is a deletion.

    This row used to draw the first hairline as its own `border-block-start`, with `--space-l` of padding under it. The social strip draws that rule now, through its own centre (Claudio, round 2), so the border and its padding are gone — leaving them would put a second line a band's width below the first. The offset is gone with them: with nothing of its own to space, the row simply takes the inner `.stack`'s `--space-m` like every other band.

    The rule is deliberately NOT restated here in any form. A `border-block-start` that happened to be transparent, or a zero-width one, would be a declaration that has to be found and understood by the next reader before they could believe the line they see comes from somewhere else.
  */
  /*
    The menu row, and the one thing about this grid that is not left to the composition: how the tracks are *sized*. The column *count* is still never authored — it comes from `data-min-width` in the template, exactly as the script block's table describes.

    `.grid` sizes its tracks `1fr`, which inside the 1100px `.center` with `--space-l` gaps makes four equal 245px columns. Two of the six menus carry a link wider than that — "Transatlantic Relations & Global Challenges" sets to 281px, "The Bertelsmann Foundation Fellowship" to 261px — so those two wrapped to a second line while About, Insights, Podcasts and Documentaries sat on 60–150px of track they had no use for. Equal tracks are the wrong instrument for columns whose content is not equal.

    So the tracks keep the same floor and grow from it toward their own `max-content` instead of splitting the row evenly. The arithmetic at the wide end: 4 × 200px + 3 × 40px = 920px committed, 180px free, against the 81px and 61px the two wide columns need to unwrap. Both fit on one line and the narrow columns stop at the floor. Free space is distributed, never invented: when the row is narrower the tracks fall back to the floor and long labels wrap exactly as they do today, which is why there is no `white-space` declaration here and why nothing can overflow.

    The floor is read back out of `--_grid-min-width` rather than restated, so it stays authored in exactly one place — the attribute in the template. The fallback is `.grid`'s own documented default for an unset `data-min-width`, not a second opinion about this row's floor.

    `justify-content: start` for the ~38px left over once the two wide tracks reach their content: the first column stays flush with the left margin every other band shares, and the remainder sits at the trailing edge. `space-between` would have spread it through the three gaps — ~53px each — and made `data-gap="l"` a claim the rendering does not support. The row draws no rule and no ground of its own, so trailing space is invisible.
  */
  .bf-footer__menus {
    grid-template-columns: repeat(auto-fill, minmax(min(var(--_grid-min-width, 240px), 100%), max-content));
    justify-content: start;
  }

  /*
    The column headings, and the one place on this site where type is uppercased. That is a deliberate budget rather than a flourish: small caps tracked out are how a print colophon labels a column, and spending the device once — here, on four or six words that are labels and nothing else — is what keeps it legible as a signal. `base/typography.css` reserves the same treatment for `h6`; these are not headings in the document outline (a footer column label is not a section title), so they are `<p>` and take the treatment locally.

    `--font-weight-semibold` is a real face in IBM Plex Sans (the family loads 300/400/500/600/700), so the step up from the band's light resting weight actually renders — the failure mode `base/typography.css:30-55` records for the previous family.
  */
  .bf-footer .bf-footer__heading {
    /*
      The heading's own links take the heading's colour, through the hook the child and `.bf-footer__link` both read. Declared rather than fought for with specificity: a `color` rule here would have to out-rank `.bf-footer__link:hover`, and then hover would stop working.
    */
    --_bf-nav-link-color: var(--_bf-footer-color);

    /*
      Level with the band (`--size--1`). Caps plus tracking still read louder than the items, which is the point of the column label.
    */
    font-size: var(--size--1);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /*
    `<strong>` is the right element — the label is the column's name whether or not it is a link, and the frozen source's precedence chain puts it inside every branch — but its default bold would jump two steps past the heading weight set above. Inherit instead, so the element keeps its semantics and the band keeps its weight.
  */
  .bf-footer__heading strong {
    font-weight: inherit;
  }

  /*
    The items. A flex column rather than bare block flow, because the labels here are long enough to wrap ("Transatlantic Relations & Global Challenges", "The Bertelsmann Foundation Fellowship") and at line-height spacing alone a wrapped item is indistinguishable from two items. The gap is `--space-2xs`, small enough that the column still reads as one list.

    `gap` on this element, never a margin on the `<li>`: the rule above keeps every footer `li` at `margin-block: 0` so the menu grid's row gap equals its column gap when it wraps, and a margin here would be added to it. The start margin lives on the list, not the heading, so a column that is only a label (PODCASTS) does not grow an empty gap under it.
  */
  .bf-footer__items {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    margin-block-start: var(--space-s);
    line-height: var(--leading-body);
  }

  /*
    ── Social band ────────────────────────────────────────────────────────

    Six monochrome marks, centred. Two changes from the wordmark row this replaces, and they are the same change: six brand *names* set in the body face were six words competing for the same attention as the menu labels above them, and a reader scanning a colophon for "where else is this organisation" recognises the glyph faster than the word. Drawn at the same weight and the same colour as each other — the networks' own brand colours are six unrelated hues and would make the quietest row in the footer the loudest.

    Centred rather than left-aligned with the other bands (Claudio, round 2): at 20px the strip is too short to read as a line of text that ought to share the left margin, and centred it reads as punctuation under the masthead.

    ── The strip IS the hairline ──────────────────────────────────────────

    The rule that used to be drawn above the menu grid is drawn here instead, by this list's `::before`, through its own vertical centre — and each mark paints the band's ground behind itself, so the line disappears under the glyphs and survives only as short dashes in the gaps (Claudio, round 2). The separate divider below is gone: two would be two lines.

    Three consequences, each a declaration below rather than a coincidence:

    1. **The gap is the dash.** It went back to `--space-l` — the marks' own `padding-inline` is inside the mask, so the only lit segment between two icons is exactly the cluster gap. At `2xs` the dashes read as specks; at `l` they are short, even segments.
    2. **The mask must be opaque.** The resting dim therefore moved off the anchor and onto the `<svg>`: `opacity` on the link would have faded its background to 35% as well and let the rule show straight through it.
    3. **Stacking, not `z-index`.** The `::before` is absolutely positioned and the links are `position: relative`; among positioned boxes with `z-index: auto` in one stacking context, paint order is tree order, and the links come after. No layer number is authored, so nothing here can out-stack a consumer's overlay.

    ── Position and rhythm ────────────────────────────────────────────────

    Band gap is the inner `.stack`'s `data-gap="m"` — no local `margin-block` here, so this strip takes the same step as the menu grid and the legal bar.
  */
  .bf-footer__social {
    /*
      The mark's breathing room *inside* its mask. A hook rather than a literal, because the narrow branch below is the one thing that changes it, and one name is better than two values.

      `--bf-footer-social-pad` is a second, PUBLIC fallback layered in front of the token — dev-only, read by `components/dev/FooterGapDial.vue`. Unset in production, so this resolves exactly as before; when the dial sets it (inline on `.bf-footer`, inherited down), it wins here AND in both narrow container-query branches below, which re-point the same two names rather than reassigning `--space-*` directly, so the dial's value keeps winning at every width while it's set.
    */
    --_bf-footer-social-pad: var(--bf-footer-social-pad, var(--space-xs));

    /*
      The cluster gap between marks — the dash length. Unset by default, so `.cluster[data-gap="l"]` (`@layer composition`, ordered before `components` in `styles.css`) still wins on layer order and this line is a no-op. `--bf-footer-social-gap` is the same dev-only public hook as above, read by the same dial.
    */
    --_cluster-space: var(--bf-footer-social-gap, var(--space-s));

    position: relative;
    justify-content: center;
  }

  /*
    The hairline. Full-bleed across the band — it is the same rule the menu row used to draw, in the same place in the reading order — with the marks sitting on it rather than above it. `calc()` rather than a transform so the 1px box is centred on the half-pixel instead of being nudged off it.
  */
  .bf-footer__social::before {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block-start: calc(50% - (var(--border-width-thin) / 2));
    block-size: var(--border-width-thin);
    background-color: var(--_bf-footer-hairline);
  }

  /*
    The mark's link, and the mask. Colour and opacity rather than the `.bf-footer__link` treatment: there is no text to underline, so the resting/active pair is the whole state change, and `currentColor` in the template carries it into the `<path>`.

    `--_bf-external-marker: ""` is the opt-out `components/external-link.css` publishes for exactly this — an icon link is still off-site and still carries `data-external`, but a ↗ drawn beside a glyph is a second mark saying less than the first. The hook is a glyph hook only: the `/ ""` alternative text lives in that file's `content` declaration, so emptying the glyph cannot reintroduce the accessible-name defect gh#221 fixed.

    `background-color` is the band's own ground token, not a new colour and not a colour literal: the mask has to be *exactly* the ground or it would read as a chip sitting on the line rather than as a hole in it.

    The 40px box is `min-*` on the anchor, which is also why the `<li>` needs nothing: the anchor is the target, so the pointer area, the mask and the focus ring are all the same rectangle.
  */
  .bf-footer__social-link {
    --_bf-external-marker: "";

    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--_bf-footer-hit-area);
    min-block-size: var(--_bf-footer-hit-area);
    padding-inline: var(--_bf-footer-social-pad);
    background-color: var(--_bf-footer-bg);
    color: var(--_bf-footer-color);
  }

  /*
    The dim lives on the glyph, not on the link — see (2) above. Declared through the same two hooks the arrow uses, so the band still has one resting value and one active value.

    `inline-size`/`block-size` here (rather than leaving `.bf-footer__icon` alone) scope a third dev-only public hook, `--bf-footer-social-size`, to the social marks only — `--_bf-footer-icon-size` is shared with the search-submit arrow (see that rule's comment), and this dial has no business resizing that. Unset, `var(--bf-footer-social-size, var(--_bf-footer-icon-size))` resolves to the same size the shared token already gives every icon, so this selector is a no-op until `components/dev/FooterGapDial.vue` sets it.
  */
  .bf-footer__social-link .bf-footer__icon {
    inline-size: var(--bf-footer-social-size, var(--_bf-footer-icon-size));
    block-size: var(--bf-footer-social-size, var(--_bf-footer-icon-size));
    opacity: var(--_bf-footer-icon-rest);
    transition: opacity var(--_bf-footer-motion) ease;
  }

  /*
    Narrow: keep the six marks on ONE line.

    This is the one branch the dashes need. The `::before` is a single rule through the middle of the list's box, so a wrapped strip would put it in the empty channel *between* two rows of icons instead of through them — the effect stops being "marks sitting on a line" and becomes "a line between two rows of marks". Shrinking the mask padding keeps all six on one row.

    Both thresholds are measured at the **widest** step of the fluid space ramp, which is the worst case for fitting:

    | branch          | mark | dash | strip needs | fires below |
    |-----------------|------|------|-------------|-------------|
    | wide (`s`/`l`)  | 60px | 40px | 560px       | —           |
    | 36rem (`2xs`/`s`) | 40px | 20px | 340px     | 576px       |
    | 23rem (`2xs`)   | 40px |  6px | 270px       | 368px       |

    Each branch fits well inside the container that switches to it — 560 into 576, 340 into 369, 270 into 368 — so no branch is ever itself the reason the row wraps. The third step exists for the small-phone band: a 320px device has a 288px content box, and without it that width gets two rows and the rule stranded between them.

    Only the padding really shrinks. The dash goes `l` → `s` → `2xs`, and the hit area never moves: `--_bf-footer-hit-area` floors every mark at 40×40 and the padding sits inside that floor, so what narrows is the mask's margin around the glyph, not the target. Overriding `--_cluster-space` works on layer order — `composition/cluster.css` is `@layer composition`, before `components` — so `data-gap="l"` stays honest in the markup and is simply re-pointed here.
  */
  @container bf-footer-bands (max-width: 36rem) {
    .bf-footer__social {
      /*
        Same dev-only public hooks as the base rule (see above) — re-pointed rather than reassigned, so a set dial value keeps winning here too.
      */
      --_bf-footer-social-pad: var(--bf-footer-social-pad, var(--space-2xs));
      --_cluster-space: var(--bf-footer-social-gap, var(--space-xs));
    }
  }

  @container bf-footer-bands (max-width: 23rem) {
    .bf-footer__social {
      --_cluster-space: var(--bf-footer-social-gap, var(--space-2xs));
    }
  }

  .bf-footer__social-link:hover .bf-footer__icon,
  .bf-footer__social-link:focus-visible .bf-footer__icon {
    opacity: var(--_bf-footer-icon-active);
  }

  /*
    Bottom band. Hairline above, muted throughout, and the same `border-block-start` + padding construction as the menu row so the two rules are drawn identically.
  */
  .bf-footer__legal {
    /* As on `.bf-footer__heading`: the band's links take the band's colour. */
    --_bf-nav-link-color: var(--_bf-footer-fine);

    justify-content: space-between;
    align-items: baseline;
    border-block-start: var(--border-width-thin) solid var(--_bf-footer-hairline);
    /*
      Half the band rhythm (`--space-s` is `--space-l` ÷ 2 at every width): the fine print hangs close under its rule rather than a full band below.
    */
    padding-block-start: var(--space-s);
    color: var(--_bf-footer-fine);

    /*
      The smallest step in the file, and the only band that takes it: a copyright line and two housekeeping links are the one thing on the page nobody came to read. See `--_bf-footer-fine` for why the 60% is a mixed colour rather than an `opacity` on this box — in short, `.bf-footer__link:hover` has to be able to climb back to full strength, and a descendant of an `opacity` cannot.
    */
    font-size: var(--size--2);
  }

  /*
    Focus gets what hover gets. `.bf-footer__link:hover` already paints the full-strength colour and the underline for every link the footer authors; this adds the keyboard half, which matters most in this band because its resting colour is the quietest on the page.
  */
  .bf-footer__link:focus-visible {
    color: var(--_bf-footer-color);
    text-decoration: underline;
  }

  /*
    One value, one place. Every transition in this file reads `--_bf-footer-motion`, so zeroing it here is the whole of the reduced-motion answer — and it degrades to an instant state change rather than to no state change, which is the distinction the preference actually expresses.
  */
  @media (prefers-reduced-motion: reduce) {
    .bf-footer {
      --_bf-footer-motion: 0ms;
    }
  }
}
</style>
