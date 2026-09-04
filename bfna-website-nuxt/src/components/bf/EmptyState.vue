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
 * Presentational-only (BRIEF D8): six props in, one slot, nothing out. No
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
 * ## One heading, `h1` unless the caller says otherwise
 *
 * The heading is unconditional and its rank defaults to **1**, because this
 * block is what a page shows **instead of** its content: it *is* the page's
 * heading, and BRIEF §5 rule 9 (one `h1` per page) is satisfied by
 * construction rather than by every caller remembering.
 *
 * `headingLevel` (residual #173) is the exception that keeps that true in the
 * case the default cannot cover: a block shown *inside* a populated page whose
 * own header already owns the `h1` — the empty-results band on
 * `pages/insights/index.vue`, `bfSearchShell`'s no-matches branch. Without it
 * those pages ship two `h1`s, which is a WCAG 1.3.1 defect that renders
 * perfectly. The default is `1` and not the card wrappers' `3` precisely so
 * that every call site written before #173 is unchanged; a caller that lowers
 * the rank is asserting something about its page that only it can know.
 *
 * Rank is all that changes. There is no size or weight variant riding on the
 * prop — type scale belongs to `@layer defaults`, and a caller who wants a
 * visually smaller block wants a different component.
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
 * ## `announced` — the block says it arrived, or it says nothing
 *
 * `announced` renders `role="status"` on the root; the default, `false`,
 * renders no `role` at all. The prop is `bfNotice`'s, name for name and
 * binding for binding (`Notice.vue:94,111`) — the same decision made the same
 * way rather than a second dialect of it (a11y BRIEF D27).
 *
 * The default is `false` because this block is usually *prerendered*: measured
 * on the current build, 18 `insights/<slug>` pages ship the "Insight not found"
 * branch in their initial HTML, and a live region that is present at first
 * paint and never updated is noise in the accessibility tree — read once by the
 * document pass regardless. `true` is for the block that arrives **after** a
 * user action and replaces what was there — `error.vue`, reached by a
 * client-side navigation that would otherwise swap the entire page body in
 * silence.
 *
 * The region is this element, mounted with its heading already in it (BRIEF
 * D29). Nothing here is hidden and toggled: `display: none` removes an element
 * from the accessibility tree, which is precisely how `/search`'s idle count
 * region ended up silent (#233).
 *
 * ## Styling
 *
 * One hook, one property, no new colour (BRIEF §5 rule 2) and no colour at all
 * — this block paints nothing. No `:not()` appears below, complex-selector or
 * otherwise (D-20.5).
 */
import type { EmptyStateHeadingLevel, EmptyStateProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfEmptyState' })

const props = withDefaults(defineProps<EmptyStateProps>(), {
  message: undefined,
  backLabel: undefined,
  backTo: undefined,
  headingLevel: 1,
  announced: false
})

/**
 * The heading element, as a tag name for `<component :is>` — the same shape
 * the card wrappers use for `CardWrapperProps.headingLevel` (#128).
 *
 * A template literal over a closed numeric union, so the only strings this can
 * produce are `h1`…`h4`; the type is what makes that true, not a runtime
 * guard.
 */
const headingTag = computed<`h${EmptyStateHeadingLevel}`>(() => `h${props.headingLevel}`)

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
  <div
    class="center | stack bf-empty-state"
    data-gap="s"
    :role="announced ? 'status' : undefined"
  >
    <!--
      `<component :is>` over a computed tag name, not a chain of `v-if`s: the
      rank is a prop, the union is closed, and four near-identical elements
      would be four places for the class to drift.
    -->
    <component :is="headingTag" class="bf-empty-state__heading">{{ heading }}</component>

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
