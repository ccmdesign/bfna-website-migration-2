<!--
  The CUBE-only shell for `/bf-probe/*` — issue 15c / gh#116 (promoted residual
  #113, with #103, #107 and #108 folded in).

  ## Why a layout at all

  Probes measure `bf-*` atoms. A measurement is only worth reading if the CSS
  the page loads is exactly the CSS the design system declares, so the one job
  of this layout is to be the **sole** stylesheet injector for every probe
  route, loading the CUBE stack and nothing else.

  Before this file, each probe declared `layout: false` and repeated its own
  `<link>`, `lang` and `robots` head entries — eight copies of a rule with no
  single place to state it, and two of them (15 and 16) additionally pulled in
  the frozen wireframe skin. `layout: false` also meant the rule was enforced
  only by every probe author remembering it.

  ## What reaches a probe page, and what cannot

  Checked rather than assumed, because "no legacy stylesheet" is this issue's
  whole point:

  - `src/nuxt.config.ts`'s `css: []` array is **empty** — every entry in it is
    commented out, `~/public/css/styles.css` and the three `css-legacy/*` files
    alike. Nothing is injected globally.
  - There is no `src/app.vue`, so no app-level `useHead` exists either.
  - `layouts/default.vue` links nothing (its chrome comes from the `ccm-*`
    components it mounts). `layouts/legacy-base.vue` was what pulled
    `/global.css`, `/fixes.css` and `/v2updates.css`, and it reached only the
    routes that named it; gh#67 retired it along with those routes.

  So a page's layout is the only injector left, and a probe that names this one
  gets the CUBE stack alone. That is the property #103 wants and the real shell
  layout (#55) must reproduce.

  ## The order statement

  `/css/styles.css` opens with the layer-order statement, and linking it is
  what puts the CUBE stack on the page in the order that file composes:
  reset → defaults → tokens → themes → composition → components → utils. The
  composer is linked rather than its `@import` list re-typed here, because a
  duplicated list drifts the first time `styles.css` gains a file, and drift is
  the failure mode this issue exists to prevent.

  The statement is *also* emitted inline, ahead of that link, with
  `tagPriority: 'critical'`. That is #108's latent case made impossible: under
  `nuxt dev` Vite injects each SFC's `<style>` into the head independently of
  this `<link>`, so a component's own `@layer components { … }` block can be the
  first `@layer` the browser sees — which would silently make `components` the
  **weakest** layer while every membership assertion stayed green. Restating the
  order is idempotent; whichever copy arrives first fixes the same order.
-->
<template>
  <slot />
</template>

<script setup lang="ts">
/**
 * The declared cascade order, kept byte-identical to the first line of
 * `src/public/css/styles.css`. Probe 16 asserts the two agree.
 */
const LAYER_ORDER = 'reset, defaults, tokens, themes, composition, components, utils, overrides'

useHead({
  // `lang` for WCAG 3.1.1; `noindex` because probes are dev-only scaffolding
  // that the cutover issue (#68) deletes.
  htmlAttrs: { lang: 'en' },
  meta: [{ name: 'robots', content: 'noindex' }],
  style: [
    {
      innerHTML: `@layer ${LAYER_ORDER};`,
      // Ahead of the stylesheet link and of anything Vite injects.
      tagPriority: 'critical'
    }
  ],
  link: [{ rel: 'stylesheet', href: '/css/styles.css' }]
})
</script>

<style>
/*
 * Nothing else paints a ground for a probe, and a probe read against the
 * browser's default canvas in dark mode is dark-on-dark. `--color-surface-page`
 * and `--color-text` are semantic tokens (gh#116, residual #107) — no colour
 * primitive and no literal, which BRIEF §5 rule 2 forbids and which the four
 * painting probes each used to breach with their own `:global(html)` block.
 *
 * Two deliberate details:
 *
 * 1. **Unscoped, with a plain `html` selector.** The blocks this replaces were
 *    written `:global(html)`, and in this build that never worked: the selector
 *    reached the minifier verbatim (`WARN 'global' is not recognized as a valid
 *    pseudo-class`) and shipped as an invalid rule, so those probes painted no
 *    ground at all. A layout style has no scope attribute to escape from
 *    anyway.
 * 2. **Inside `@layer overrides`.** This issue is about unlayered author CSS
 *    outranking every layer; a layout that fixed that and then shipped its own
 *    unlayered rule would be arguing against itself. `overrides` is the last
 *    layer in the declared order, so it still wins over everything the stack
 *    sets — `base/typography.css`'s `body { background-color }` included.
 */
@layer overrides {
  html {
    /*
     * `light` explicitly, as all four painting probes intended: without it the
     * UA paints form controls, scrollbars and the default canvas for the
     * host's scheme, and a probe that measures a resolved colour would read a
     * different value on a reviewer's dark-mode machine than in the harness.
     */
    color-scheme: light;
    color: var(--color-text);
    background-color: var(--color-surface-page);
  }
}
</style>
