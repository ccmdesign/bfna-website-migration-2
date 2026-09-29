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
 * ## `bfNotFound` is built on this component
 *
 * `components/bf/NotFound.vue` is the not-found **page layout** (refined pass,
 * Sep 2026): its first band is this component — the heading, the reason, the
 * way back — on the paper masthead ground, followed by a search field and the
 * newest insights. It forwards `heading`, `message`, `backLabel`, `backTo`
 * and `announced` straight through, so gh#224's live region stays on this
 * root and the page's one `h1` is still this heading. It used to be a
 * re-export of this file under a second name.
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
 * Rank decides the element, and one presentational consequence rides on it:
 * a block below rank 1 is an inline reply inside a page that already has a
 * title, so it is set a step quieter (`--size-1`, less padding — see the
 * `--inline` rule). There is no separate size prop; a caller who wants a
 * different block wants a different component.
 *
 * ## The back link renders only when it can work
 *
 * Both `backTo` and `backLabel`, or no link at all. Half a pair would produce
 * either an anchor with no accessible name — the failure #130 named for the
 * card wrappers, and a WCAG 2.4.4 breach — or a label that navigates nowhere.
 * Neither is better than the absence of a link, and both are the kind of thing
 * that renders fine and reads as broken.
 *
 * The link is never announced as the current page unless it is one. The
 * router's exact-active test compares paths and ignores the query, so on
 * `/insights?format=infographic` a "Clear filters" link to `/insights`
 * rendered `aria-current="page"` — the way *out* of the current state,
 * announced as the state itself. `aria-current` is therefore decided here, on
 * the full path, query and hash included (`isCurrent`).
 *
 * ## Layout is the composition layer's, not this component's
 *
 * `class="center | stack"` is the wireframe's own class list, kept exactly.
 * The max width and the vertical rhythm come from `composition/center.css` and
 * `composition/stack.css`; nothing here re-states them. `data-gap="s"` is
 * written explicitly — `s` is what `.stack`'s `--_stack-space` already
 * defaults to, so the value is declared rather than inherited by accident
 * (D9: `data-gap` is the canonical name).
 *
 * Two things the class list cannot express. The block padding the wf source
 * writes inline becomes `--_bf-empty-state-padding-block` — `--space-3xl` for a
 * page-level block, the page header's own step, and `--space-xl` inline. And
 * the column's width: as a flex item `.center` shrink-wraps and centres, so the
 * rule restores the full column and the block starts on the same left edge as
 * every band on the page (see the style block).
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
 * Calm and typographic, like the page header it stands in for: the heading in
 * the display face, the message one step back in `--color-base-light`, the way
 * out a plain underlined link in `--color-link`. No box, no ground, no new
 * colour (BRIEF §5 rule 2). No `:not()` appears below, complex-selector or
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

const route = useRoute()
const router = useRouter()

/**
 * Is the back link the page the reader is on — query and hash included?
 *
 * Bound as `aria-current="page"` or as `undefined`. `undefined` is not "leave
 * it alone": a fallthrough attribute bound to `undefined` still wins the
 * merge over the one `RouterLink` sets itself (the `mergeProps` behaviour
 * `Chip.vue`'s `currentAttrs` documents), so it removes the router's
 * path-only answer and leaves this one.
 */
const isCurrent = computed<boolean>(() =>
  hasBackLink.value && router.resolve(props.backTo as string).fullPath === route.fullPath
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
    :class="{ 'bf-empty-state--inline': headingLevel > 1 }"
    data-gap="s"
    :role="announced ? 'status' : undefined"
  >
    <!--
      `<component :is>` over a computed tag name, not a chain of `v-if`s: the
      rank is a prop, the union is closed, and four near-identical elements
      would be four places for the class to drift.
    -->
    <component :is="headingTag" class="bf-empty-state__heading">{{ heading }}</component>

    <p
      v-if="message"
      class="bf-empty-state__message"
      data-measure="normal"
    >{{ message }}</p>

    <!--
      `<p>` around the link, as the wf source writes it: the anchor is a
      sentence-level element here, not a control, and the `<p>` is what makes
      it a child of the `.stack` and so a participant in its rhythm.

      A plain `NuxtLink`, not a `bfButton` — see the block comment above and
      the Decisions section of the spec.
    -->
    <p v-if="hasBackLink" class="bf-empty-state__back">
      <NuxtLink :to="backTo" :aria-current="isCurrent ? 'page' : undefined">{{ backLabel }}</NuxtLink>
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
    That it is a column, that it has a measure, what the gap between its
    children is — all of that still comes from `.center` and `.stack` in
    `@layer composition`. What this rule adds is the band's padding and one
    correction to where the column sits.
  */
  .bf-empty-state {
    /*
      Declared in the rule rather than bound inline, so a consumer can outrank
      it with an ordinary rule. An inline style cannot be outranked by one —
      the `bfMedia` lesson from gh#26.

      A block that stands **instead of** a page (a 404, an unknown program)
      takes the page header's own `--space-3xl`, so its `<h1>` lands where
      every other page's title lands. The inline variant below steps it down.
    */
    --_bf-empty-state-padding-block: var(--space-3xl);

    /*
      **One value.** The build lowers `padding-block` to
      `padding-top`/`padding-bottom`, each reading the whole hook, so a
      two-value hook (`var(--space-m) 0`) is invalid on both and silently
      computes to 0 — `/search` found that out. To set the two ends apart,
      set one step here and the other end's padding longhand beside it.
    */
    padding-block: var(--_bf-empty-state-padding-block);

    /*
      The column fix (refined pass, Sep 2026). This block is almost always a
      **flex item** — of `<main class="stack">` on a 404, of a band's
      `center | stack` column inline — and `.center`'s `margin-inline: auto`
      on a flex item in the cross axis shrinks it to its content and centres
      that. So "Page not found" sat in a narrow box in the middle of the page,
      off the left edge every nav item, band and footer column shares, and
      the search page's "No results" floated to the centre of the results it
      replaces.

      `inline-size` restores the width a block box would have had: the
      container, less `.center`'s own inline padding on each side (it stays
      `content-box`), capped by `.center`'s measure as before. Read from
      `.center`'s private `--_center-padding` on this same element so the
      two can never disagree.
    */
    inline-size: calc(100% - 2 * var(--_center-padding));
  }

  /*
    Inside a band the column already has its padding, so the nested `.center`
    must not add a second gutter.
  */
  .center .bf-empty-state {
    inline-size: 100%;
    padding-inline: 0;
  }

  /*
    The inline variant — rank 2 and below, the block that answers "nothing
    matched" inside a page that has its own header. It is a reply, not a
    title, so it is set a step quieter than a band heading: `--size-1` in the
    display face, over `--space-xl` of padding rather than the page's 3xl.
    Rank still decides the element; this only decides how loudly it speaks.
  */
  .bf-empty-state--inline {
    --_bf-empty-state-padding-block: var(--space-xl);
  }

  .bf-empty-state--inline > .bf-empty-state__heading {
    font-size: var(--size-1);
  }

  /*
    The explanation, one step back from the heading. `--color-base-light` is
    the stack's secondary-text token (9:1 on the page ground), so the line
    reads as the reason under the headline rather than a second headline.
  */
  .bf-empty-state__message {
    color: var(--color-base-light);
    text-wrap: pretty;
  }

  /*
    The way out. The template's `NuxtLink` renders `class=""`, which
    `a:not([class])` does not match, so it was the user agent's own blue
    and underline. It is a sentence-level link, so it gets the stack's link
    colour and a considered underline — thin, offset clear of the
    descenders, thicker on hover — rather than a button's weight.
  */
  .bf-empty-state__back > a {
    color: var(--color-link);
    font-weight: var(--font-weight-normal);
    text-decoration-line: underline;
    text-decoration-thickness: var(--border-width-thin);
    text-underline-offset: 0.2em;
  }

  .bf-empty-state__back > a:hover {
    text-decoration-thickness: var(--border-width-medium);
  }
}
</style>
