<script setup lang="ts">
/**
 * `bfNotice` — the notice / banner box (issue 41, gh#50).
 *
 * Componentises the raw `.wf-note` rule (`public/css/wireframe.css` L114–121,
 * frozen — read, never edited) used at three wireframe call sites:
 *
 * | site | text | announced? |
 * |---|---|---|
 * | `pages/wireframes/search.vue:13` | the semantic-ranking caveat | no — present at first render, never toggles |
 * | `pages/wireframes/search.vue:48` | "No records matched — try fewer or different words." | **yes** — `v-if="!results.length"`, appears in response to typing |
 * | `pages/wireframes/insights/[slug].vue:18` | the archive banner | no — static for the life of the page |
 *
 * (`search.vue:59` also carries the class, but with `style="border: 0;
 * background: transparent; padding: 0"` — it borrows the type scale for a
 * score chip and unpaints everything a notice *is*. That is `bfChip`'s job,
 * not this component's, and it is not one of the three usages this issue
 * replaces.)
 *
 * Presentational-only (BRIEF D8): two props in, one slot, nothing out. No data
 * access, no store, no composable — and no knowledge of *why* it is being
 * shown.
 *
 * ## The content is a slot, not a prop
 *
 * The archive banner carries a link inside its sentence. A `text` prop could
 * only render that through `v-html`, which is an injection surface in exchange
 * for nothing; a slot renders the caller's own markup as markup.
 *
 * ## `role="status"` is opt-in
 *
 * `announced` renders `role="status"` — an implicit `aria-live="polite"`
 * region — and its absence renders no `role` attribute at all (`undefined`,
 * not `null` or `''`: Vue drops the attribute entirely, and `role=""` is a
 * different, invalid thing).
 *
 * The prop exists because the distinction is **behavioural and invisible in
 * the markup**. A notice that can appear at runtime in response to user action
 * must be announced; one that is present at first render and never toggles
 * must not, because a live region that is never updated is noise in the
 * accessibility tree and, on some screen readers, is re-read on every unrelated
 * DOM mutation inside it. Nothing about a `<div>` full of text says which of
 * those it is, so inferring it would mean guessing. The caller knows; it says.
 *
 * Of the three real call sites exactly one — the search "no records matched"
 * message — sets it `true`. Recorded in the spec's Decisions section.
 *
 * ## Colour: three triplets, all from tokens that already exist
 *
 * The spec asks that a missing "warning" semantic be *recorded* rather than
 * invented. It is not missing: `tokens/semantic-colors.css` carries
 * `--color-warning` (yellow), `--color-info` (navy) and the neutral
 * `--color-base-*` family, each with the generated `-super-light` (tint-11)
 * and `-dark` (shade-40) steps in
 * `tokens/semantic-colors-shades-and-tints.css`. So all three variants are
 * spelled entirely in existing semantic names — no primitive, no literal, no
 * new token (BRIEF §5 rule 2, DoD-6).
 *
 * `warning`'s border is the `-dark` step rather than the mid-tone, and that is
 * a measurement, not a preference: `--color-warning` on its own tint-11 ground
 * comes out at ≈1.7:1, under the 3:1 WCAG 1.4.11 floor for a meaningful
 * boundary, so the mid-tone would be decoration rather than the thing that
 * tells the three variants apart. `info`'s mid-tone measures ≈9.7:1 and is
 * kept. Probe 41 re-derives all of these from the resolved computed colours at
 * runtime, in both `color-scheme: light` and `color-scheme: dark`, rather than
 * trusting this comment.
 *
 * ## The monospace look is dropped
 *
 * `.wf-note` sets `font-family: monospace` and `font-size: 0.8rem`. Both are
 * *review* styling — its own comment calls it a "margin note for reviewers" —
 * and this component is production chrome that carries a search result count
 * and an archive notice to readers. It inherits the body font at the body
 * size. Recorded in Decisions; probe 41 asserts the negative so a later
 * "restore parity" edit fails a row rather than landing quietly.
 *
 * The rest of the box *is* kept: the 4px inline-start rule, the padding pair,
 * the tinted ground.
 *
 * ## Styling
 *
 * Three hooks — `--_bf-notice-bg`, `--_bf-notice-border`, `--_bf-notice-color`
 * — declared in `@layer components` and redeclared per variant. Never bound as
 * an inline `style`: an inline declaration cannot be outranked by an ordinary
 * rule, which is the `bfMedia` lesson from gh#26. No `:not()` appears below,
 * complex-selector or otherwise (D-20.5).
 */
import type { NoticeProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfNotice' })

withDefaults(defineProps<NoticeProps>(), {
  variant: 'note',
  announced: false
})
</script>

<template>
  <!--
    One root, so `$attrs` falls through on its own and `inheritAttrs` stays at
    its default — there is nothing to choose between. A caller's `class`
    therefore merges with, rather than replaces, `bf-notice`.

    `data-variant` rather than a modifier class: the variant is a value of one
    dimension, an attribute selector says exactly that, and it keeps the
    rendered attribute readable in the prerendered HTML the spec greps.
  -->
  <div
    class="bf-notice"
    :data-variant="variant"
    :role="announced ? 'status' : undefined"
  >
    <slot />
  </div>
</template>

<style scoped>
/*
  `@layer components` must survive into the built stylesheet — see the note in
  `Button.vue`; `postcss-preset-env`'s cascade-layer polyfill would otherwise
  flatten this into unlayered rules that outrank every layer (gh#101). Probe 41
  reads the live CSSOM for this rule's layer membership.
*/
@layer components {
  .bf-notice {
    /*
      The `note` colourway is the default, declared on the base rule rather than
      in a `[data-variant="note"]` block: a caller who omits `variant` and a
      caller who writes `variant="note"` must get the same paint, and one
      declaration is how that stays true.

      Every value is a semantic token, and each stands in for one of the three
      literals `.wf-note` hard-codes: `--color-base-super-light` (the generated
      tint-11 of the neutral) for its pale grey ground,
      `--color-base-light` (tint-73) for its mid-grey rule, and `--color-text`
      for its near-black body colour. No new colour, and no literal.
    */
    --_bf-notice-bg: var(--color-base-super-light);
    --_bf-notice-border: var(--color-base-light);
    --_bf-notice-color: var(--color-text);

    /*
      The wireframe's own box: `--space-2xs` block, `--space-xs` inline, and a
      4px rule down the inline-start edge — `--border-width-thick` is exactly
      that length, so the literal is gone and the measurement is not.

      Logical properties throughout (`border-inline-start`, `padding-block`),
      where the frozen source writes `border-left`. Same rendering in an `ltr`
      document, and the correct edge in an `rtl` one.
    */
    padding-block: var(--space-2xs);
    padding-inline: var(--space-xs);
    border-inline-start: var(--border-width-thick) solid var(--_bf-notice-border);
    background-color: var(--_bf-notice-bg);
    color: var(--_bf-notice-color);
  }

  /*
    Each variant redeclares only the triplet — nothing about the box changes
    between them, and repeating the padding here is how a later edit to one
    variant's spacing silently diverges from the other two.
  */
  .bf-notice[data-variant='info'] {
    --_bf-notice-bg: var(--color-info-super-light);
    --_bf-notice-border: var(--color-info);
    --_bf-notice-color: var(--color-info-dark);
  }

  .bf-notice[data-variant='warning'] {
    --_bf-notice-bg: var(--color-warning-super-light);
    /*
      The `-dark` step, not `--color-warning` itself — see the block comment
      above: the mid-tone yellow measures ≈1.7:1 against its own tint-11 ground
      and would not carry the boundary (WCAG 1.4.11).
    */
    --_bf-notice-border: var(--color-warning-dark);
    --_bf-notice-color: var(--color-warning-dark);
  }
}
</style>
