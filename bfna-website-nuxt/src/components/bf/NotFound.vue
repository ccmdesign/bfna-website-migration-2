<script setup lang="ts">
/**
 * `bfNotFound` — the not-found page layout, meant for every route that has
 * nothing to show (refined pass, Sep 2026).
 *
 * Until this pass the file was a three-line alias of `bfEmptyState`, and every
 * dead end on the site was that block alone: a heading, a sentence and one
 * link, on a white band with nothing under it. `error.vue` and the three
 * per-route branches (`/insights/:slug`, `/projects/:slug`, `/{program}`) each
 * rendered it themselves, with the one link as the visitor's only way on.
 *
 * All four render this layout now: `error.vue`, for a route that never
 * reached a page, and the three per-route branches — `/insights/:slug`,
 * `/projects/:slug` and the defensive one in `/{program}` — each with its own
 * heading and back link. A dead end looks and works the same wherever it is
 * reached from.
 *
 * ## Three bands, in the order a lost reader needs them
 *
 * 1. **What happened, and the nearest way back.** `bfEmptyState`, unchanged,
 *    inside a paper band: the page's one `h1`, the reason under it, and the
 *    caller's own back link (*"Back to home"* from `error.vue`). The paper is
 *    the ground every inner page's masthead wears (`bfSection`'s
 *    `data-surface="paper"`), so the heading lands where every other page's
 *    title lands, on the same texture, instead of on a bare white band that
 *    read as a page the site forgot to finish.
 * 2. **Look for it.** A search field that goes to `/search`, then the three
 *    programs as their coloured chips and the three indexes in a sentence —
 *    `/search`'s own idle-state way on (`pages/search.vue`, "Or start from one
 *    of our programs"), in the same words and at the same measure, so the site
 *    has one dialect for "here is where to start".
 * 3. **Or read what is new.** The three most recent insights, as the grid the
 *    rest of the site draws them in. Proof the site is alive, and the likeliest
 *    thing a visitor from a stale link came for.
 *
 * Bands 2 and 3 are this component's; band 1 is still `bfEmptyState`'s, for
 * the reason below.
 *
 * ## Why the heading block is still `bfEmptyState`
 *
 * `bfPageHeader` is the obvious masthead and was the first choice. It cannot
 * be used, because two things bind the heading block to `bfEmptyState`:
 *
 * - **gh#224's gate.** `scripts/check-routes.ts` drives a client-side
 *   navigation to a dead route and requires exactly one `role="status"` in
 *   `<main>`, **on the `.bf-empty-state` root**. `announced` is forwarded
 *   untouched, so the live region is the same element it always was: heading,
 *   reason and back link, with the search field and the cards outside it —
 *   the region announces the arrival, not the whole page.
 * - **One `h1`, by construction.** `bfEmptyState` renders its heading at rank
 *   1 by default because it stands instead of a page's content. Nothing else
 *   here is a heading above rank 2.
 *
 * `headingLevel` is therefore not forwarded: a not-found page is always the
 * page, and rank 1 is the only rank this component renders its heading at.
 *
 * ## Presentational (D8)
 *
 * Props in, nothing out. The programs and the recent insights arrive as data
 * from the caller, which has usually loaded both already (`useBfPrograms`,
 * `useBfInsights().active`); this component reads no collection. Each band
 * that depends on data renders only when it has some, so a caller that
 * passes neither still gets the heading block and the search field.
 *
 * What it does know is four fixed routes — `/search`, `/insights`,
 * `/projects`, `/archive` — the way `bfNav` knows `/` and `/search`. They are
 * the site's permanent indexes, not content, and `pages/search.vue` names
 * the same three in the same sentence.
 *
 * ## The search field is a real form
 *
 * `<search role="search">` around a `<form action="/search" method="get">`,
 * with the query control named `q`: the page `/search` reads (`route.query.q`),
 * so the field works before hydration and with scripting off. With scripting
 * on, `submit` is intercepted and becomes one `navigateTo`, which keeps the app
 * shell and, from `error.vue`, clears the error on the way out — the router
 * plugin does that on any client navigation (see `error.vue`).
 *
 * `bfFooter` deliberately has neither element (its docblock): it renders on
 * `/search` too, where gh#227 requires exactly one search landmark and one
 * form. This component never renders on `/search`, so the gate is not in
 * play, and a dead end is exactly where a named search landmark earns its
 * place. The footer's field remains an unnamed control, so the page has one
 * landmark.
 *
 * The control is `bfFormField`, so the label is visible text in a real
 * `<label for>` pair and the focus ring is that component's. No `autofocus`:
 * on the error page the announced region is what a screen reader should meet
 * first, and a focus jump into the form would speak over it.
 *
 * ## Props
 *
 * `NotFoundProps` in `types/bf-contracts.ts`, the one home for `bf-*` types.
 * The first five are `bfEmptyState`'s, picked off `EmptyStateProps` so their
 * documentation and their types stay in one place; the two data props are
 * documented there too. (They were a local `Props` until four call sites
 * named the shape.)
 */
import type { Insight, NotFoundProps } from '~/types/bf-contracts'
import { programChipLabel } from '~/utils/bf-card-program'

defineOptions({
  name: 'BfNotFound',
  /*
   * Three bands, three roots. `$attrs` is bound by hand to the first — the
   * masthead band, which carries the page's heading — so a caller's `class` or
   * `data-*` has one predictable destination rather than a Vue warning about
   * attributes that could not fall through a fragment.
   */
  inheritAttrs: false
})

const props = withDefaults(defineProps<NotFoundProps>(), {
  message: undefined,
  backLabel: undefined,
  backTo: undefined,
  announced: false,
  programs: () => [],
  insights: () => []
})

/**
 * Three, because it is one row of the grid at a desktop width
 * (`bfGridInsights`' 300px track floor on the 1100px measure), and a dead end
 * is not the place for a second.
 */
const RECENT_COUNT = 3

const recent = computed<Insight[]>(() => props.insights.slice(0, RECENT_COUNT))

/**
 * The query, held only so `submit` can read it. The field's `name="q"` is what
 * a form submitted without scripting sends, so the two paths carry the same
 * key to the same page.
 */
const query = ref('')

/**
 * Go to `/search`, carrying the query if there is one — `bfFooter`'s
 * `goToSearch`, for the same reasons: an empty field still navigates, to the
 * search page's own resting state, and a field of spaces counts as empty so
 * the URL is `/search` rather than `/search?q=`.
 */
function submit() {
  const q = query.value.trim()
  return navigateTo({ path: '/search', query: q ? { q } : {} })
}

/*
 * One id per instance for the sentence that names the chip list. `useId()`,
 * for the SSR-stable reason `bfSection` gives for its heading ids.
 */
const browseId = useId()
</script>

<template>
  <!--
    Band 1 — the masthead. A paper `bfSection` around `bfEmptyState`, and no
    `padded`: the block's own `--space-3xl` of block padding is the page
    header's step, so the band is exactly as tall as the block needs and the
    heading sits where `bfPageHeader` puts every other title. Inside a band's
    `.center` the block takes the full column with no second gutter
    (`EmptyState.vue`, "The column fix").
  -->
  <bfSection
    v-bind="$attrs"
    class="bf-not-found"
    label="Not found"
    data-surface="paper"
  >
    <bfEmptyState
      :heading="heading"
      :message="message"
      :back-label="backLabel"
      :back-to="backTo"
      :announced="announced"
    />
  </bfSection>

  <!--
    Band 2 — the ways on. No band heading: the search field's visible label
    opens the band and says what it is for, and a heading above it ("Find
    your way") would be a label for a label.

    One column at the `normal` measure, as on `/search`, so the field, the
    lead line and the sentence share one end edge.
  -->
  <bfSection class="bf-not-found__ways" label="Ways on">
    <div class="bf-not-found__column | stack" data-gap="l" data-measure="normal">
      <!--
        `<search>` and `role="search"` both, for `bfSearchShell`'s reason
        (gh#227): the element maps to the role only in engines that know it,
        and the explicit role is the floor for the rest. `nuxt.config.ts`
        tells Vue the tag is an element.
      -->
      <search role="search" class="bf-not-found__search">
        <form action="/search" method="get" class="bf-not-found__form" @submit.prevent="submit">
          <bfFormField
            v-model="query"
            class="bf-not-found__query"
            type="search"
            name="q"
            label="Search insights, projects and people"
            autocomplete="off"
            enterkeyhint="search"
          />
          <bfButton type="submit" variant="primary" class="bf-not-found__submit">
            Search
          </bfButton>
        </form>
      </search>

      <!--
        `/search`'s browse block, in its words. The chips' list takes its name
        from the sentence that introduces it; the sentence renders only with a
        list to introduce.

        Two elements, not one `browse | stack`. `.stack > * + *` reads
        `--_stack-space` on the child, so a child that is itself a `.stack`
        with its own `data-gap` answers with its own gap: one element would
        sit `s` below the form instead of the column's `l`. The outer box
        takes the column's rhythm and the hairline; the inner one spaces the
        three lines.
      -->
      <div class="bf-not-found__browse">
        <div class="stack" data-gap="s">
          <template v-if="programs.length">
            <p :id="browseId" class="bf-not-found__browse-lead">
              Or start from one of our programs:
            </p>
            <ul
              class="bf-not-found__programs | cluster"
              role="list"
              data-gap="xs"
              :aria-labelledby="browseId"
            >
              <li v-for="program in programs" :key="program.slug">
                <bfChip
                  :to="`/${program.slug}`"
                  tone="program"
                  :program="program.slug"
                >
                  {{ programChipLabel(program.name) }}
                </bfChip>
              </li>
            </ul>
          </template>
          <p class="bf-not-found__browse-more">
            You can also browse <NuxtLink to="/insights">all insights</NuxtLink>,
            <NuxtLink to="/projects">every project</NuxtLink>, or
            <NuxtLink to="/archive">the archive of past work</NuxtLink>.
          </p>
        </div>
      </div>
    </div>
  </bfSection>

  <!--
    Band 3 — what is new. `headingLevel` 3 keeps the card headings under the
    band's `h2` (BRIEF §5 rule 9), as every related-insights band does.
  -->
  <bfSection
    v-if="recent.length"
    class="bf-not-found__recent"
    label="Recent insights"
    heading="Recent insights"
  >
    <bfGridInsights :insights="recent" :heading-level="3" />
  </bfSection>
</template>

<style scoped>
/*
  `@layer components`, for the reason every `bf-*` file gives (gh#101): the
  wrapper must survive into the built stylesheet or these rules outrank every
  layer. No `:not()` below (D-20.5) and no colour that is not already a
  semantic token.

  Scoped, so the band roots — child components' root elements — carry this
  file's scope id and are reachable directly, and everything inside
  `bfFormField` needs `:deep()`.
*/
@layer components {
  /*
    The field and its button on one line, bottoms aligned. The field grows and
    may shrink below its content (`min-inline-size: 0`, or the input's
    intrinsic width would push the button off a 375px screen); the button
    keeps its size.
  */
  .bf-not-found__form {
    display: flex;
    align-items: flex-end;
    gap: var(--space-xs);
  }

  .bf-not-found__query {
    flex: 1 1 auto;
    min-inline-size: 0;
  }

  /*
    The button, at the field's height, through `bfButton`'s own hooks.

    `base/forms.css` draws the input at `--size-0` with a 1.5 line box,
    `--space-xs` of block padding and a 2px border. `bfButton` draws a 1.0 line
    box with the same 2px border (`--border-width-medium`). So at the same
    font size the button needs half an em more block padding than the input
    to reach its height: a quarter em a side, in the button's own em. Split
    one `--border-width-thin` lower, as the button's default padding is split
    (8 / 10), because a 1.0 line box sets the glyphs high.

    Two classes, so the rule outranks `.bf-button`'s own declaration of the
    same hooks at equal layer; a one-class selector would tie it and leave the
    winner to stylesheet order.
  */
  .bf-not-found__form .bf-not-found__submit {
    --_bf-button-font-size: var(--size-0);
    --_bf-button-padding:
      calc(var(--space-xs) + 0.25em - var(--border-width-thin))
      var(--space-m)
      calc(var(--space-xs) + 0.25em + var(--border-width-thin));

    flex: none;
  }

  /*
    The turn from "search for it" to "somewhere else to start": `/search`'s
    hairline, over the same space.
  */
  .bf-not-found__browse {
    padding-block-start: var(--space-m);
    border-block-start: var(--border-width-thin) solid var(--color-base-super-light);
  }

  /*
    The chips' list items hug their chips — `/search`'s rule and its reason: a
    bare `li` is a line box taller than the pill inside it and carries the
    global list-item margin, so the wrapped chips stood a line apart on a
    phone.
  */
  .bf-not-found__programs li {
    display: flex;
    margin: 0;
  }

  .bf-not-found__browse-lead,
  .bf-not-found__browse-more {
    color: var(--color-base-light);
    font-size: var(--size--1);
  }

  /*
    `NuxtLink` renders `class=""`, which `a:not([class])` does not match, so
    these would be the user agent's blue. Sentence-level links, in
    `bfEmptyState`'s back-link treatment, word for word.
  */
  .bf-not-found__browse-more a {
    color: var(--color-link);
    font-weight: var(--font-weight-normal);
    text-decoration-line: underline;
    text-decoration-thickness: var(--border-width-thin);
    text-underline-offset: 0.2em;
  }

  .bf-not-found__browse-more a:hover {
    text-decoration-thickness: var(--border-width-medium);
  }
}
</style>
