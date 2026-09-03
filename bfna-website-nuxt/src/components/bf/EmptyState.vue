<script setup lang="ts">
/**
 * `bfEmptyState` — the shared not-found / nothing-here block.
 *
 * Componentises the block duplicated **verbatim** at three wireframe call
 * sites (frozen, D2 — read, never edited):
 *
 * ```vue
 * <div v-else class="center | stack" style="padding-block: var(--space-xl);">
 *   <h1>Unknown program</h1>
 *   <p><NuxtLink to="/wireframes">Back to wireframe home</NuxtLink></p>
 * </div>
 * ```
 *
 * — `pages/wireframes/[area].vue:40`, `pages/wireframes/insights/[slug].vue:35`,
 * `pages/wireframes/projects/[slug].vue:86`. Three copies, character for
 * character apart from the two strings. That is the whole case for this
 * component.
 *
 * Presentational-only (BRIEF D8): four props in, one slot, nothing out. No
 * data access, no store, no composable — and, specifically, **no knowledge of
 * why the page is empty**. Whether the route 404'd, the filter matched nothing
 * or the collection is genuinely empty is the caller's question; this renders
 * the answer it is handed.
 *
 * ## `bfNotFound` is this component
 *
 * `components/bf/NotFound.vue` re-exports this file's default export, so
 * `<bfNotFound>` and `<bfEmptyState>` resolve to the same component object —
 * one implementation, two names, per the spec. The alias exists because a 404
 * page reading `<bfNotFound>` says what it means, and because the epic's own
 * issue list names both. It is not a variant and has no props of its own; see
 * the file for why an alias rather than a wrapper.
 *
 * ## Exactly one `<h1>`, always
 *
 * There is one `<h1>` in the template, it is unconditional, and there is no
 * `headingLevel` prop — deliberately, and unlike the card wrappers (#128),
 * which take one precisely *because* several of them appear on a page.
 *
 * This block is the opposite case: it is what a page shows **instead of** its
 * content, so it is the page's heading, and BRIEF §5 rule 9 (one `h1` per
 * page) is satisfied by construction rather than by every caller remembering.
 * A consumer that wants this shape *inside* a populated page — an empty band
 * on an otherwise full hub — wants a different component, and should say so
 * rather than being handed a second `h1` by default.
 *
 * ## The back link renders only when it can work
 *
 * Both `backTo` and `backLabel`, or no link at all. Half a pair would produce
 * either an anchor with no accessible name — the failure #130 named for the
 * card wrappers, and a WCAG 2.4.4 breach — or a label that navigates nowhere.
 * Neither is better than the absence of a link, and both are the kind of thing
 * that renders fine and reads as broken.
 *
 * ## Layout is the composition layer's, not this component's
 *
 * `class="center | stack"` is the wireframe's own class list, kept exactly.
 * The centring, the max width and the vertical rhythm all come from
 * `composition/center.css` and `composition/stack.css`; nothing here re-states
 * them. `data-gap="s"` is written explicitly — `s` is what `.stack`'s
 * `--_stack-space` already defaults to, so the rendered gap is unchanged and
 * the value is now declared rather than inherited by accident (D9: `data-gap`
 * is the canonical name).
 *
 * The one thing the class list cannot express is the block padding the wf
 * source writes inline. It becomes `--_bf-empty-state-padding-block`, default
 * `var(--space-xl)` — the same length, from the same token.
 *
 * `bfSection`'s `padded` convention (issue 39) would have been reused had it
 * landed first; it has not (`components/bf/Section.vue` does not exist on
 * `dev`), so the spec's stated fallback applies. Recorded in Decisions.
 *
 * ## Styling
 *
 * One hook, one property, no new colour (BRIEF §5 rule 2) and no colour at all
 * — this block paints nothing. No `:not()` appears below, complex-selector or
 * otherwise (D-20.5).
 */
import type { EmptyStateProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfEmptyState' })

const props = withDefaults(defineProps<EmptyStateProps>(), {
  message: undefined,
  backLabel: undefined,
  backTo: undefined
})

/**
 * Both halves of the pair, or no link.
 *
 * A plain truthiness test, not `!== undefined`: an empty `backLabel` would
 * render an anchor with no accessible name just as surely as a missing one,
 * and an empty `backTo` resolves to the current route, which is a link back to
 * the page the user is already stuck on.
 */
const hasBackLink = computed<boolean>(() =>
  Boolean(props.backTo) && Boolean(props.backLabel)
)
</script>

<template>
  <!--
    The wireframe's element and class list, unchanged. `$attrs` falls through to
    this single root on its own — `inheritAttrs` is left at its default because
    there is exactly one destination and nothing to choose between. A caller's
    `class` therefore merges with, rather than replaces, `center | stack`.
  -->
  <div class="center | stack bf-empty-state" data-gap="s">
    <h1 class="bf-empty-state__heading">{{ heading }}</h1>

    <p v-if="message" class="bf-empty-state__message">{{ message }}</p>

    <!--
      `<p>` around the link, as the wf source writes it: the anchor is a
      sentence-level element here, not a control, and the `<p>` is what makes
      it a child of the `.stack` and so a participant in its rhythm.

      A plain `NuxtLink`, not a `bfButton` — see the block comment above and
      the Decisions section of the spec.
    -->
    <p v-if="hasBackLink" class="bf-empty-state__back">
      <NuxtLink :to="backTo">{{ backLabel }}</NuxtLink>
    </p>

    <!--
      Last, so a caller's own content reads after the heading, the message and
      the way out — the order a reader needs them in. Empty by default: this
      component adds no wrapper and no spacing for a slot nobody filled.
    -->
    <slot />
  </div>
</template>

<style scoped>
/*
  `@layer components` must survive into the built stylesheet — see the note in
  `Button.vue`; `postcss-preset-env`'s cascade-layer polyfill would otherwise
  flatten this into unlayered rules that outrank every layer (gh#101). Probe 33
  reads the live CSSOM for this rule's layer membership.
*/
@layer components {
  /*
    One declaration and its hook, and nothing else. Everything about the box —
    that it is a column, that it is centred, that it has a measure, what the
    gap between its children is — comes from `.center` and `.stack` in
    `@layer composition`. Probe 33 asserts that this rule declares exactly
    these two properties, so a later "small fix" that re-implements a layout
    the composition layer already owns fails a row rather than quietly landing.
  */
  .bf-empty-state {
    /*
      Declared in the rule rather than bound inline, so a consumer can outrank
      it with an ordinary rule. An inline style cannot be outranked by one —
      the `bfMedia` lesson from gh#26.

      `var(--space-xl)` is the wf source's own value, from the same Utopia
      token; the inline `style="padding-block: var(--space-xl);"` it replaces
      resolved to exactly this.
    */
    --_bf-empty-state-padding-block: var(--space-xl);

    padding-block: var(--_bf-empty-state-padding-block);
  }
}
</style>
