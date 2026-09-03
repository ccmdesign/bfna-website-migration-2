<script setup lang="ts">
/**
 * `bfGridInsights` — THE insights grid: a thin data-in/cards-out organism.
 *
 * Ports `components/wireframe/wfGridInsights.vue` (issue 42 / gh#51). That
 * file is frozen (D2) and is not touched here. Its own comment records the
 * scope decision this component inherits: *"THE insights grid … used
 * everywhere insights are listed (Claudio, Aug 3). Featured cards live in
 * their own 2-col grid above this one on the homepage — that grid is
 * intentionally not this component."*
 *
 * Built in the same issue as `bfGridProjects` under BRIEF §5 rule 5's named
 * bundle exception. The two are deliberately **not** refactored onto a shared
 * base — the as-built inventory flags that as possible but "not enough
 * evidence yet", and the spec puts it explicitly out of scope.
 *
 * ## The whole point: the column count is never authored
 *
 * The frozen source pins three columns with an inline `style` spelling a
 * `repeat(3, 1fr)` column template on the `<ul>`.
 *
 * That is one of the seven hand-pinned sites D9 names, and D9's resolution is
 * that they are **not** edited in place — they are frozen — but that no `bf-*`
 * file may ship one. So the column policy here is a `minWidth` prop forwarded
 * to `data-min-width`, and `composition/grid.css` resolves the count from the
 * available inline size with `auto-fill`. The consequences are the reason it is
 * worth doing rather than a rule to satisfy:
 *
 * - it reflows with no media query, at **any** container width, including the
 *   ones no one thought to test;
 * - it cannot overflow — issue 04 wrapped the floor in `min(<floor>, 100%)`
 *   (D-04.1), so a track collapses to the container instead of pushing past it;
 * - and a `data-span="full"` card (`bfCard`'s grid-slot modifier, `1 / -1`)
 *   stays valid at every resolved count.
 *
 * There is no `<style>` block in this file at all, and the property that names
 * a column template appears nowhere in it — not in the markup, and not in a
 * comment either, because the spec's acceptance is a literal
 * `grep -rn` over `src/components/bf` that must return **nothing**. A gate
 * worth having is one a prose mention cannot trip.
 *
 * ## Presentational-only (BRIEF D8)
 *
 * Props in, nothing out. No `queryCollection`, no store, no data composable,
 * no `useAsyncData`. The caller — a template page in #47–#52 — fetches and
 * hands over an array. This file imports types and nothing else; it ships no
 * runtime import at all.
 *
 * ## `extraChips` is a function here and an array on the card
 *
 * `(i: Insight) => string[] | undefined`, applied per row as
 * `:extra-chips="extraChips?.(i)"`. That split is the frozen source's and it is
 * the right one: only the caller knows how to derive a programme or a project
 * name the row does not itself carry, and only the grid has the row to derive
 * it from. A card that took the function would have to be handed the whole
 * collection to know which row it was.
 *
 * ## Two props are forwarded, not re-decided
 *
 * `excerptLength` and `headingLevel` are passed through **unset when unset**,
 * so each card's own default applies (`140` and `3`). Restating either number
 * here would create a second copy of it that drifts the first time the card's
 * changes. `headingLevel` is on the grid at all because the grid is the only
 * thing between a template's section heading and the cards (#128).
 *
 * ## `$attrs` reaches the `<ul>`
 *
 * `inheritAttrs` stays at its default `true`. The card wrappers turn it off
 * because they `v-bind="$attrs"` explicitly onto a child component and would
 * otherwise apply everything twice (D-21.1); here the `<ul>` is the single root
 * and the element the caller means, so the automatic fallthrough is exactly
 * right — a caller's `class`, `id`, `aria-labelledby` and `data-*` land on it.
 * Notably that includes `aria-labelledby`, which is how a template names the
 * list from its own section heading.
 */
import type { GridInsightsProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfGridInsights' })

const props = withDefaults(defineProps<GridInsightsProps>(), {
  /*
   * `l` — a 300px track floor.
   *
   * Chosen from issue 04's own measurements rather than by eye. D-04.5 read
   * the resolved track lists off the probe at the three acceptance viewports,
   * inside `.container` (`max-inline-size: 1200px`, `--space-m` inline
   * padding): **1200px → 3 tracks, 800px → 2, 400px → 1**. Three columns at a
   * desktop width is precisely the frozen source's `repeat(3, 1fr)` intent, and
   * the two narrower steps are the reflow the pinned version never had.
   *
   * See D-42.2 in the spec for the arithmetic and why the neighbouring values
   * (`m` → 4 columns at 1200px, `xl` → 2) are wrong for this grid.
   */
  minWidth: 'l',
  /* Unset, so `bfCardInsight`'s own `140` applies. See the note above. */
  excerptLength: undefined,
  extraChips: undefined,
  headingLevel: undefined
})
</script>

<template>
  <!--
    `<ul>` group, cards are `<li>` — the inclusive-components card pattern the
    frozen source uses, kept: a list of cards is a list, and announcing "list, 6
    items" is the whole reason the wrapper is not a `<div>`.

    `data-gap="m"` matches the frozen source exactly. `data-min-width` carries
    the column policy; there is no `style` binding on this element and nothing
    in this file names a column template.
  -->
  <ul class="grid" :data-min-width="props.minWidth" data-gap="m">
    <bfCardInsight
      v-for="i in props.insights"
      :key="i.slug"
      :insight="i"
      :excerpt-length="props.excerptLength"
      :heading-level="props.headingLevel"
      :extra-chips="props.extraChips?.(i)"
    />
  </ul>
</template>
