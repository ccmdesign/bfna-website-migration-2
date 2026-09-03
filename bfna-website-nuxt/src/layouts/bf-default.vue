<script setup lang="ts">
/**
 * `bf-default` — the site shell every `/` route mounts (issue 46 / gh#55).
 *
 * Skip link → nav → conditional announcement band → `<main id="main">` →
 * footer. Descends from the frozen `wf-*` review shell's skeleton; shares no
 * code with it, imports nothing from it, and leaves it untouched (D2). Nothing
 * below names a `wf-*` file — the spec's acceptance greps this file to prove
 * it, which is why the frozen layer is referred to obliquely throughout.
 *
 * ## The only data reader in the view tree (D8)
 *
 * `useBfSite()` is called here and nowhere else below the router. `bfNav` and
 * `bfFooter` each take `menus` as a **prop**; neither imports a composable, and
 * the spec's own acceptance greps `src/components/bf` for `queryCollection` and
 * `useBf` to keep it that way. One reader means one place where the site chrome
 * can go wrong, and it means every `bf-*` component stays renderable from a
 * literal in a probe or a test.
 *
 * The import is explicit rather than auto: Nuxt scans `composables/` at the top
 * level and one directory deep only for `index` files, and this lives at
 * `composables/data/useBfSite.ts`. Probe 13 imports it the same way.
 *
 * Top-level `await` is safe in a layout — `NuxtLayout` renders its child inside
 * a `<Suspense>` (`nuxt/dist/app/components/nuxt-layout.js`), which is the same
 * boundary that makes an `await` legal in a page's `setup`.
 *
 * ## Why this file links a stylesheet (residual #103)
 *
 * `src/nuxt.config.ts`'s `css: []` array is **empty** — every entry in it is
 * commented out — and there is no `src/app.vue`, so no app-level `useHead`
 * exists either. A route's **layout is the only stylesheet injector left**.
 * Before this file, the only two layouts that linked `/css/styles.css` were
 * the frozen `wf-*` shell and `bf-probe`, both serving dev-only routes; a real `/`
 * route would therefore have loaded the CUBE stack with **no `@layer` order
 * statement**, and unlayered legacy CSS outranks every layer — `bf-*` component
 * rules would have lost to it silently, everywhere, in production only. That is
 * residual #103, and linking the composer here is the fix.
 *
 * The composer is linked rather than its `@import` list re-typed, because a
 * duplicated list drifts the first time `styles.css` gains a file.
 *
 * The statement is *also* emitted inline, ahead of that link, with
 * `tagPriority: 'critical'` — #108's latent case made impossible. Under
 * `nuxt dev` Vite injects each SFC's `<style>` into the head independently of
 * this `<link>`, so a component's own `@layer components { … }` block can be the
 * first `@layer` the browser sees, which would silently make `components` the
 * **weakest** layer while every membership assertion stayed green. Restating the
 * order is idempotent: whichever copy arrives first fixes the same order, and
 * probe 46 asserts the resulting order rather than assuming it.
 *
 * `layouts/legacy-base.vue` is deliberately **not** touched — it injects the
 * three `css-legacy/*` files for the routes still served by the legacy stack,
 * and those routes are issue #58's to retire, not this one's.
 *
 * ## Head
 *
 * `lang` for WCAG 3.1.1, a `titleTemplate` so a page states only its own name,
 * and — unlike the frozen `wf-*` shell — **no `robots: noindex`**. That shell
 * sets it because the `wf-*` routes are a review prototype; this one serves the
 * public site, and carrying that meta across would deindex bfna.org.
 */
import { useBfSite } from '~/composables/data/useBfSite'
import { isExternal } from '~/utils/link'

defineOptions({ name: 'BfDefaultLayout' })

/**
 * The declared cascade order, kept byte-identical to the first line of
 * `src/public/css/styles.css`. Probe 16 asserts the two agree; probe 46 asserts
 * the browser actually resolved this order on a route using this layout.
 */
const LAYER_ORDER = 'reset, defaults, tokens, themes, composition, components, utils, overrides'

const { menus, announcement } = await useBfSite()

/**
 * Resolved once, at setup. Both sources are build-time static — `menus` is the
 * typed `menus.json` module and the announcement is a single prerendered
 * document — so there is nothing to keep reactive, and a plain value is what
 * makes the two prop bindings below read as the contract they are.
 */
const siteMenus = menus()

/**
 * The banner, or `undefined`.
 *
 * The `status === 'published'` gate lives in `useBfSite` (BRIEF §6 / D3) and is
 * deliberately **not** re-checked here: two copies of a publish rule is how the
 * two drift.
 *
 * The `message` test is a different question and does belong here. Both
 * `message` and `url` are `z.string().nullable()` in `bfAnnouncementSchema`, so
 * a published record with no message is a shape the schema permits — and it
 * would render an empty `bfNotice`, or worse, with a `url` alongside it, an
 * anchor with **no accessible name** (the #130 failure mode). A band with
 * nothing to say is not a band.
 */
const doc = announcement()
const banner = doc?.message ? doc : undefined

useHead({
  htmlAttrs: { lang: 'en' },
  /*
   * A template, not a title: every `/` page sets its own `title` and this adds
   * the site name once. The `?? ` branch is the site root, whose page sets no
   * title of its own.
   */
  titleTemplate: title =>
    title ? `${title} | Bertelsmann Foundation North America` : 'Bertelsmann Foundation North America',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
    /* No `robots: noindex` — see the block comment above. */
  ],
  style: [
    {
      innerHTML: `@layer ${LAYER_ORDER};`,
      /* Ahead of the stylesheet link and of anything Vite injects. */
      tagPriority: 'critical'
    }
  ],
  link: [{ rel: 'stylesheet', href: '/css/styles.css' }]
})
</script>

<template>
  <div class="bf-shell">
    <!--
      FIRST. Not first-ish. WCAG 2.1 §2.4.1 is satisfied only if this is the
      first thing Tab reaches, so nothing focusable may be added above it — not
      a nav, not a banner, not a wrapper with a tabindex. Probe 46 asserts it
      with a real key event rather than by reading the DOM order.
    -->
    <bfSkipLink target="#main" />

    <bfNav :menus="siteMenus" />

    <!--
      The announcement band. `v-if` on the composable's already-gated value, so
      an unpublished or missing document renders no element at all rather than
      an empty box that would still take a gap.

      `variant="info"` — the announcement is site-wide information, not a
      warning and not the neutral `note` default; `bfNotice`'s `info` colourway
      measures ≈9.7:1 for its boundary (gh#50).

      `announced` is left at its default `false`: the band is present at first
      render and never toggles, and a live region that is never updated is noise
      in the accessibility tree (`bfNotice`'s own contract).

      The link wraps the message rather than trailing it, because the message
      *is* the call to action ("APPLY NOW | …") and a bare "read more" beside it
      would be a second, less useful accessible name. `url` is nullable in the
      schema, so a document with a message and no link degrades to plain text.

      `data-external` comes from `isExternal()` — `src/utils/link.ts` is the
      epic's one rule for that decision (gh#28) and `bfNav` and `bfFooter`
      already gate on it. Today's announcement points at `www.bfna.org`, which
      is this site and correctly unmarked; the gate is here so that an off-site
      announcement is marked without anyone remembering to. `|| undefined`
      rather than `|| false`: an attribute bound to `false` is removed, but one
      bound to the *string* `"false"` is not, and `[data-external]` matches on
      presence.

      `.center` gives the band the same measure and inline padding as the nav
      bar and every page section, so the announcement lines up with the content
      instead of running full-bleed. `|` is a real class token in this CUBE
      dialect, separating the block from the composition primitive.
    -->
    <bfNotice
      v-if="banner"
      class="bf-shell__announcement | center"
      variant="info"
    >
      <a
        v-if="banner.url"
        :href="banner.url"
        :data-external="isExternal(banner.url) || undefined"
      >{{ banner.message }}</a>
      <template v-else>{{ banner.message }}</template>
    </bfNotice>

    <!--
      The landmark. `id="main"` is `bfSkipLink`'s default `target`, stated in
      both places because a skip link whose two halves disagree is worse than no
      skip link at all.

      `tabindex="-1"` is load-bearing, not decoration: a browser handling a
      fragment navigation focuses the target only when it is focusable, and
      otherwise merely sets the sequential-navigation starting point — leaving
      `activeElement` on `<body>`, which reads to a screen-reader user as
      nothing having happened. `-1` keeps it out of the tab order while making
      it a legal focus target. The `:focus` outline is suppressed below for the
      same reason every implementation does: a mouse user who clicks the page
      body must not grow a ring around the whole document.

      `.stack` / `data-gap="xl"` is the frozen `wf-*` shell's own rhythm,
      unchanged — pages are lists of bands and the shell spaces them.

      No `#hero` slot: every `bf-*` template composes its own header component
      as its first section (#47–#56), which is a simpler contract than the
      frozen shell's named slot and one fewer place for a page to be half-filled.
    -->
    <main
      id="main"
      class="stack"
      data-gap="xl"
      tabindex="-1"
    >
      <slot />
    </main>

    <bfFooter :menus="siteMenus" />
  </div>
</template>

<style>
/*
 * Unscoped, and with plain `html` / `body` selectors: a layout style has no
 * scope attribute to escape from, and `:global()` is not recognised by this
 * build's minifier (it reaches it verbatim and ships an invalid rule — the bug
 * gh#116 found in four probes).
 *
 * Inside `@layer overrides` — the last layer in the declared order — for the
 * reason this file exists at all: an issue about unlayered author CSS
 * outranking every layer that then shipped its own unlayered rule would be
 * arguing against itself. `overrides` still wins over everything the stack
 * sets, `base/typography.css`'s own `body` ground included.
 *
 * `--color-surface-page` and `--color-text` are semantic tokens (residual #107,
 * added in gh#116). No colour primitive, no literal — BRIEF §5 rule 2.
 */
@layer overrides {
  html {
    /*
     * Stated explicitly. The token set has one colourway; without this the UA
     * paints form controls, scrollbars and the default canvas for the host's
     * scheme, so a dark-mode visitor would read dark chrome around a light
     * page.
     */
    color-scheme: light;
    color: var(--color-text);
    background-color: var(--color-surface-page);
  }

  /*
   * The ground is painted on both, not only on `html`: `html`'s background
   * propagates to the canvas only while `body` declares none, and
   * `base/typography.css` does declare one — so `body` is where the value has
   * to be stated for it to be the one that paints.
   */
  body {
    background-color: var(--color-surface-page);
  }
}
</style>

<style scoped>
@layer components {
  /*
   * The landmark takes focus programmatically — that is the skip link's whole
   * behaviour — but must never grow a ring for a mouse user who happened to
   * click the page body. `:focus`, not `:focus-visible`: the ring here would be
   * around the entire document, and there is no case in which it is wanted.
   */
  main:focus {
    outline: none;
  }

  /*
   * The band sits between the nav and the content, in the shell's own flow
   * rather than inside `<main>` — it is site chrome, not page content, and a
   * page's `.stack` rhythm must not have to know whether it is there.
   */
  .bf-shell__announcement {
    margin-block-end: var(--space-m);
  }
}
</style>
