<script setup lang="ts">
/**
 * `bfFooter` — the site footer (issue 36 / gh#45).
 *
 * Evolves `src/components/wireframe/wfFooter.vue`, which is frozen (D2) and
 * was read, not edited.
 *
 * ## The two things this issue exists to fix
 *
 * **1. The content source.** The whole script block of the wireframe footer
 * begins by destructuring `menus` out of the wireframe's content composable —
 * the same D8/ADR-1 anti-pattern `bfNav` carried and #44 removed. `bfFooter`
 * takes **`menus: Menu[]` as a prop and has no other source of anything**: no
 * composable, no collection query, no store. The layout (#46) reads the data
 * and passes it down; this component cannot render without being handed its
 * content, which is the property that makes it probeable from a fixture array.
 *
 * As in `Nav.vue`, the two forbidden identifiers are deliberately not written
 * anywhere in this file — not even inside this comment. The spec's acceptance
 * is a literal `grep -L` over this source, and a docblock that quoted the thing
 * it refuses would fail it while the code was perfectly correct. Same call
 * `bfLogo` recorded for colour literals (gh#23).
 *
 * **2. The hand-pinned column count.** The wireframe pins
 * `repeat(4, 1fr)` in an inline `style` on the menu row — one of the seven
 * sites D9 names, and the one the BRIEF calls out as the `bf-*` successor
 * case. Here the row is a `.grid` carrying `data-min-width` (issue 04 / gh#13):
 * the column count is never authored, it is derived from the available inline
 * size against a per-instance track floor, so the row reflows with no media
 * query. The string this replaces appears nowhere in this file, which the
 * spec also greps for.
 *
 * ### Why `data-min-width="s"` (a 200px floor)
 *
 * `.grid` is `auto-fill` over `minmax(min(floor, 100%), 1fr)`, so the track
 * count is `floor((W + gap) / (track + gap))`. This row sits inside `.center`
 * (content-box, `max-inline-size: 1100px`) with `data-gap="l"`, and
 * `--space-l` is `clamp(1.75rem, 1.4914rem + 1.2931vw, 2.5rem)`. Against the
 * 1200 / 800 / 400px reflow points issue 04's probe established:
 *
 * | viewport | container | gap | `s` (200px) | `m` (240px) | `l` (300px) |
 * |---|---|---|---|---|---|
 * | 1200px | 1100 | 39.4 | **4** | 4 | 3 ✗ |
 * | 800px  | ~766 | 34.2 | **3** | 2 | 2 |
 * | 400px  | ~371 | 29.0 | **1** | 1 | 1 |
 *
 * `l` fails the spec outright — three columns at the wide end. Between the two
 * that pass, `s` is chosen because its middle step is 3 rather than 2: a
 * four-column menu row keeps more of itself through the tablet band, and the
 * cells hold short menu labels that have no use for a 240px floor. Recorded in
 * the spec's Decisions.
 *
 * ## The menu-link child
 *
 * Imported from `bfNav`'s `./nav/MenuLink.vue` **by explicit relative path**,
 * which is what that component's own docblock anticipates for this issue and
 * what `Nav.vue` and `nav/Dropdown.vue` already do. Not by its auto-import
 * name: `nuxt.config.ts` registers `components/bf` with `pathPrefix: false`
 * and `prefix: 'bf'`, which would flatten it to a top-level-looking
 * `<bfMenuLink>`. The relative import makes the dependency visible in this
 * file and does not depend on how the `components` array happens to be
 * configured.
 *
 * Reuse rather than duplication is the point: the two chrome surfaces must
 * render `MenuItem` data identically, which is exactly what the frozen
 * `wfMenuLink`'s own comment says about its pair. `MenuLink` styles itself
 * from `--_bf-nav-link-color` with a `var(--color-text)` fallback precisely so
 * it stays legible mounted outside a nav — this component is that case.
 *
 * ## Structure — the wireframe's four bands, unchanged
 *
 * ```
 * bfFooter
 *  ├ brand row     BFNA / Bertelsmann Foundation North America · Search
 *  ├ menu grid     one column per `menus` entry, each a <nav>
 *  ├ social strip  six profiles, ported verbatim
 *  └ legal row     © <year> · Privacy Policy · Site by ccm.design
 * ```
 *
 * The column heading repeats the wireframe's `v-if` / `v-else-if` / `v-else`
 * precedence exactly: an entry that names a destination is a link (`href`
 * first, then `to`), and one that names none is plain `<strong>` text. Unlike
 * `bfNav` there is no disclosure tier here — a footer column shows its items.
 *
 * ## What is deliberately absent
 *
 * - **No search form.** Search lives in `bfNav`; the footer's Search is a plain
 *   link, which is the frozen source's own answer. Retargeted from
 *   `/wireframes/search` to `/search` (BRIEF §7), as `bfNav` was.
 * - **No subscribe band** (D2). The frozen source's header comment already
 *   says the subscribe band was never the footer's, and D2 killed it outright.
 *
 * Presentational-only (D8): one prop in, nothing out.
 */
import type { Menu } from '~/types/bf-contracts'
import MenuLink from './nav/MenuLink.vue'

defineOptions({ name: 'BfFooter' })

defineProps<{
  menus: Menu[]
}>()

/**
 * Real social profiles (`static-content.json`, legacy Frame). Order and the
 * Twitter→Bluesky swap per Irene (widget feedback, Aug 5). Ported verbatim
 * from the frozen source, this note included.
 *
 * NOTE: Bluesky profile URL is a PLACEHOLDER — Irene to supply the real one.
 */
const socials = [
  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/bertelsmann-foundation-north-america-inc.' },
  { name: 'Instagram', url: 'https://www.instagram.com/bertelsmannfoundation/' },
  { name: 'Bluesky', url: '#bluesky-profile-url' },
  { name: 'Facebook', url: 'https://www.facebook.com/BertelsmannFoundation/' },
  { name: 'YouTube', url: 'https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg' },
  { name: 'Vimeo', url: 'https://vimeo.com/bfna' }
]

/**
 * Computed at render, as the wireframe computes it — a year baked into the
 * bundle at build time is wrong from the next 1 January until someone
 * redeploys, and this is a statically generated site.
 */
const year = new Date().getFullYear()
</script>

<template>
  <!--
    `$attrs` falls through to this root (no `inheritAttrs: false` — this is not
    a wrapper around a base component), so a consumer's `class`, `style`
    (including the `--_bf-footer-*` hooks) and `data-*` land on the `<footer>`.
  -->
  <footer class="bf-footer">
    <div class="bf-footer__inner | center stack" data-gap="l">
      <!-- Brand, and the entry point to search. -->
      <div class="bf-footer__brand | cluster" data-gap="s">
        <div>
          <p><strong>BFNA</strong></p>
          <p>Bertelsmann Foundation North America</p>
        </div>
        <p><NuxtLink to="/search" class="bf-footer__link">Search</NuxtLink></p>
      </div>

      <!--
        The four menu columns. `.grid[data-min-width]` (issue 04): the column
        count is derived, never authored — see the table in the script block for
        why the floor is `s`. A `<ul>` because it is a list of navigation
        groups; `ul[class]` is already unstyled by `base/reset.css`.

        `role="list"` is not redundant: `base/reset.css:95-103` strips
        `list-style` from every `ul[class]`, and WebKit reads that
        declaration as the author no longer meaning a list — VoiceOver stops
        saying "list, N items" and stops offering list navigation. Restating
        the implicit role puts the semantics back without putting the bullets
        back. Same fix and same reason as `nav/Dropdown.vue:109` and
        `Breadcrumb.vue:238-240` (gh#220, D27).
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
              Same precedence as the frozen source: an entry that names a
              destination is a link, `href` before `to`; one that names none is
              plain text. `|| undefined` rather than `|| false` — an attribute
              bound to `false` is removed, but one bound to the *string*
              `"false"` is not, and `[data-external]` matches on presence.
            -->
            <p class="bf-footer__heading">
              <a
                v-if="m.href"
                :href="m.href"
                class="bf-footer__link"
                :data-external="m.external || undefined"
              ><strong>{{ m.label }}</strong></a>
              <NuxtLink
                v-else-if="m.to"
                :to="m.to"
                class="bf-footer__link"
              ><strong>{{ m.label }}</strong></NuxtLink>
              <strong v-else>{{ m.label }}</strong>
            </p>

            <!--
              `role="list"` is not redundant: `base/reset.css:95-103` strips
              `list-style` from every `ul[class]`, and WebKit reads that
              declaration as the author no longer meaning a list — VoiceOver stops
              saying "list, N items" and stops offering list navigation. Restating
              the implicit role puts the semantics back without putting the bullets
              back. Same fix and same reason as `nav/Dropdown.vue:109` and
              `Breadcrumb.vue:238-240` (gh#220, D27).
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
        `role="list"` is not redundant: `base/reset.css:95-103` strips
        `list-style` from every `ul[class]`, and WebKit reads that
        declaration as the author no longer meaning a list — VoiceOver stops
        saying "list, N items" and stops offering list navigation. Restating
        the implicit role puts the semantics back without putting the bullets
        back. Same fix and same reason as `nav/Dropdown.vue:109` and
        `Breadcrumb.vue:238-240` (gh#220, D27).

        Load-bearing twice over here: `aria-label` is only exposed on an element
        with a role that supports a name, so without the role the label goes as
        well as the list.
      -->
      <ul
        class="bf-footer__social | cluster"
        role="list"
        data-gap="s"
        aria-label="Social media"
      >
        <li
          v-for="s in socials"
          :key="s.name"
        >
          <a
            :href="s.url"
            class="bf-footer__link"
            data-external
          >{{ s.name }}</a>
        </li>
      </ul>

      <div class="bf-footer__legal | cluster" data-gap="m">
        <div class="cluster" data-gap="m">
          <p>© {{ year }} Copyright Bertelsmann Foundation.</p>
          <p><a href="#" class="bf-footer__link">Privacy Policy</a></p>
        </div>
        <p>Site by <a href="https://ccm.design" class="bf-footer__link" data-external>ccm.design</a></p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/*
  No `:not()` anywhere in this file (D-20.5, gh#29): `postcss-preset-env`
  mis-lowers a `:not()` containing a complex selector and silently breaks the
  rule, so the ban is on the construct rather than on the mistake.

  No focus rule either. `base/focus.css` (#146) declares `:focus-visible` in
  `@layer defaults` for every element, links included, and a footer has no
  reason to want a different ring from the rest of the page.

  `@layer components` must survive into the built stylesheet — the cascade-layer
  polyfill that used to flatten these blocks into unlayered rules is off in
  `nuxt.config.ts`, and the probe reads the live CSSOM so a regression fails the
  run rather than shipping quietly.
*/
@layer components {
  .bf-footer {
    /*
      Declared in the rule, not bound inline through a `cssVars` computed (the
      `bfMedia` lesson, gh#26): a component that writes its own custom
      properties inline is no more overridable than one writing flat
      declarations inline, because an ordinary consumer rule cannot outrank an
      inline style. This component emits no inline `style` at all — which is
      also the spec's "no inline column style", asserted by the probe over every
      element it renders rather than over the grid row alone.

      Both hooks source existing semantic tokens. No new colour and no colour
      literal (BRIEF §5 rule 2, DoD-6); the frozen skin's `#222` rule becomes
      the token that names that role.
    */

    /** The footer's ground. The page's, so the band reads as the same sheet. */
    --_bf-footer-bg: var(--color-surface-page);

    /** The rule above the footer — the wireframe's 2px, in the token that names it. */
    --_bf-footer-border: var(--color-neutral-tint-40);

    /*
      Read by `nav/MenuLink.vue` through inheritance. That component declares
      `color: var(--_bf-nav-link-color, var(--color-text))` with the fallback
      for exactly this case; setting it here means a consumer restyling the
      footer's links restyles the reused child with it, instead of the child
      quietly keeping the nav's colour.
    */
    --_bf-nav-link-color: var(--color-text);

    margin-block-start: var(--space-xl);
    padding-block: var(--space-l);

    background-color: var(--_bf-footer-bg);
    color: var(--color-text);
    border-block-start: var(--border-width-medium) solid var(--_bf-footer-border);
  }

  /*
    Every link in the footer, including the reused `MenuLink` children through
    their own rule. Undecorated links are only acceptable where the surrounding
    chrome makes the affordance unmissable — a footer column qualifies, which is
    the judgement the frozen skin already made (`.wireframe .wf-footer a`) and
    this inherits rather than relitigates.
  */
  .bf-footer__link {
    color: var(--_bf-nav-link-color);
    text-decoration: none;
  }

  .bf-footer__link:hover {
    text-decoration: underline;
  }

  /* The frozen source's `space-between` / baseline brand row, without its inline style. */
  .bf-footer__brand {
    justify-content: space-between;
    align-items: baseline;
  }

  /*
    Every list item in the footer, so `gap` is the single source of spacing here
    and nothing else contributes to it.

    Two separate consequences, which is why the selector is the broad one rather
    than only the menu-item list:

    1. **Menu items sit at line-height spacing** — no gap between a column
       heading and its first item, and none between items (Claudio, Aug 5).
    2. **Row gaps equal column gaps in the menu grid.** Its `<li>` columns are
       grid items, so a block margin on them is *added* to the row gap the
       moment the row wraps — which is every narrow width, where four columns
       become four rows. A grid whose vertical rhythm changes with its column
       count is the exact failure the frozen skin's own
       `ul.grid > li { margin-block: 0 }` rule exists to prevent, and its
       comment says so.

    The frozen skin reaches both with *unlayered* rules, because when they were
    written `base/typography.css` leaked `li { margin-bottom: 0.5em }` outside
    its `@layer defaults` block and unlayered author rules outrank every layer.
    gh#116 moved that closing brace, so the declaration is now inside `defaults`
    and this ordinary `@layer components` rule outranks it. Copying the
    wireframe's unlayered workaround would be reintroducing the defect it worked
    around. The probe measures the resulting margins, and separately measures
    that the grid's row gap equals its column gap when it wraps — rather than
    trusting this note.
  */
  .bf-footer li {
    margin-block: 0;
  }

  .bf-footer__heading {
    margin-block-end: 0;
  }

  /* The frozen source's centred social strip, without its inline style. */
  .bf-footer__social {
    justify-content: center;
  }

  /* The frozen source's `space-between` legal strip, without its inline style. */
  .bf-footer__legal {
    justify-content: space-between;
  }
}
</style>
