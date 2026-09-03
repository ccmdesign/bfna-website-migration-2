<script setup lang="ts">
/**
 * `bfSkipLink` — the visually-hidden-until-focused "Skip to content" link.
 *
 * Componentises `.wf-skip-link` (`public/css/wireframe.css` :148-159), which in
 * the wireframe is a hand-written class on one hand-written anchor in
 * `layouts/wireframe.vue:6`. The class is frozen (D2) and is **not** reused
 * here; the behaviour is reproduced from tokens, from scratch.
 *
 * Presentational-only (BRIEF D8): one prop in, nothing else. No data access, no
 * store, no composable.
 *
 * ## What it is for
 *
 * WCAG 2.1 §2.4.1 (Bypass Blocks). A keyboard or screen-reader user landing on
 * a page should not have to walk the whole masthead and primary nav on every
 * route before reaching the content. The skip link is the bypass — and it only
 * works if it is **the first thing Tab reaches**, so the shell layout places it
 * first in the DOM (issue 46/#55's acceptance criterion, not this one's).
 *
 * ## Hidden, but not `display: none`
 *
 * A skip link that is `display: none` or `visibility: hidden` is removed from
 * the accessibility tree *and* from the tab order — it would be a link nobody
 * can ever reach. So it is positioned off-screen instead, exactly as the
 * wireframe does it (`position: absolute; left: -999px`), which keeps it
 * focusable, keeps it in the tab order, and keeps it out of flow so it cannot
 * push the page's first real element around.
 *
 * ## `:focus`, not `:focus-visible`
 *
 * Deliberate, and the one place in this system where that is the right choice.
 * `:focus-visible` is a heuristic about whether the browser thinks a focus ring
 * is warranted; it is false after a programmatic `.focus()` with no preceding
 * keyboard interaction. A skip link that stayed invisible in that case would be
 * an element holding focus that the user cannot see — the failure mode
 * WCAG 2.4.7 names. Every focus reveals it.
 *
 * ## The target
 *
 * `target` defaults to `'#main'`: the id the site shell puts on its `<main>`
 * landmark. Recorded in the issue's Decisions so #55 uses the same one — the
 * two halves of a skip link are useless if they disagree about the id.
 *
 * **Focus moves only if the target can take focus.** A browser handling a
 * fragment navigation focuses the target when it is focusable and otherwise
 * only sets the sequential-navigation starting point, leaving `activeElement`
 * on `<body>` — which reads to a screen-reader user as nothing having happened.
 * The landmark therefore carries `tabindex="-1"`. That is the layout's job:
 * this atom renders one anchor and cannot reach across the page to the element
 * it names. Probe 19 asserts both halves together.
 *
 * ## The other half of this issue
 *
 * Issue 19 bundles this component with the `[data-external]` marker, because
 * both are one-line affordances lifted out of the wireframe skin and neither is
 * worth an issue alone. The marker is deliberately **not** a component and not
 * a prop here: it stays an attribute (`<a data-external>`), its style hook lives
 * once in `src/public/css/components/external-link.css` inside
 * `@layer components`, and `src/utils/link.ts`'s `isExternal()` is the shared
 * rule for deciding which hrefs earn it. `bfButton` and `bfChip` already emit
 * `data-external` themselves and were not touched. Probe 19 demonstrates the
 * two together, which is what the bundling rule asks for.
 *
 * ## Colour
 *
 * No new colour (BRIEF §5 rule 2), no primitive, no literal. The focused
 * ground/label pair is the same semantic pair `bfButton`'s primary variant
 * established in gh#24 — `--color-primary` with `--color-text-inverse` on it,
 * ≈6.2:1 and AA at any size — rather than a second copy of the wireframe's
 * `#222`/`#fff`.
 */
import type { SkipLinkProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfSkipLink' })

withDefaults(defineProps<SkipLinkProps>(), {
  /*
   * The shell layout's `<main id="main" tabindex="-1">`. Stated once, here, so
   * a caller never has to repeat it and the two ends cannot drift apart by a
   * typo at one call site.
   */
  target: '#main'
})
</script>

<template>
  <!--
    One element, no wrapper: `$attrs` has a single destination, and — more to
    the point — a wrapper would put something ahead of the anchor in the DOM,
    which is precisely what must not happen to the first focusable element on
    the page. `inheritAttrs` is left at its default for the same reason: there
    is nothing to choose between.

    A plain `<a href>`, never a `NuxtLink`: this is an in-page fragment jump,
    and routing it through the router would push a history entry and re-run
    navigation for a scroll.
  -->
  <a :href="target" class="bf-skip-link">
    <slot>Skip to content</slot>
  </a>
</template>

<style scoped>
/*
  `@layer components` must survive into the built stylesheet — see the note in
  `Button.vue`: `postcss-preset-env`'s cascade-layers polyfill used to flatten
  these blocks into unlayered rules that then outranked every layer. The feature
  is off in `nuxt.config.ts`, and probe 19 reads the live CSSOM so a regression
  fails loudly rather than silently.
*/
@layer components {
  .bf-skip-link {
    /*
      Defaults for the hooks, declared in the rule rather than bound inline, so
      a consumer can outrank them with an ordinary rule. (An inline style cannot
      be outranked by one — the `bfMedia` lesson from gh#26.)
    */
    --_bf-skip-link-bg: var(--color-primary);
    --_bf-skip-link-color: var(--color-text-inverse);
    --_bf-skip-link-padding: 0.5em 1em;
    --_bf-skip-link-offset: -999px;
    --_bf-skip-link-z-index: 100;

    /*
      Out of flow and off-screen — focusable, announced, and unable to move the
      page's first real element by a pixel.
    */
    position: absolute;
    top: 0;
    left: var(--_bf-skip-link-offset);

    /*
      Applied in both states, not only on focus: `z-index` needs a positioned
      element (it has one) and stacking must already be settled at the moment
      the link appears, or the first frame of a focus can paint it behind a
      sticky masthead. There is no z-index token in the system to reach for —
      recorded as a deliberate call in the issue's Decisions.
    */
    z-index: var(--_bf-skip-link-z-index);

    padding: var(--_bf-skip-link-padding);
    background: var(--_bf-skip-link-bg);
    color: var(--_bf-skip-link-color);
  }

  /*
    `:focus`, not `:focus-visible` — see the component comment. Only the offset
    changes: the ground, the label colour and the padding are painted in both
    states so that nothing about the box has to be computed at the moment it
    appears.
  */
  .bf-skip-link:focus {
    --_bf-skip-link-offset: 0;
  }

  /*
    The same two-ring treatment as `bfButton`: `--outline-focus` supplies the
    halo, and the `outline` is what survives forced-colors mode, where
    `box-shadow` is dropped. `--color-text` rather than `currentcolor`, because
    the ring is drawn outside the link on the page ground and the label colour
    here is the light one — `currentcolor` would paint a white ring on a white
    page (WCAG 1.4.11; the gh#24-P2-1 finding, avoided rather than repeated).
  */
  .bf-skip-link:focus-visible {
    outline: var(--border-width-medium) solid var(--color-text);
    outline-offset: var(--border-width-medium);
    box-shadow: var(--outline-focus);
  }
}
</style>
