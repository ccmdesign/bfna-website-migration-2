<script setup lang="ts">
/**
 * `bfByline` — the article byline: an author line and, optionally, a date.
 *
 * Builds from **new** markup. There is no `wf-*` byline component; the frozen
 * `pages/wireframes/insights/[slug].vue:7-11` hand-rolls one:
 *
 * ```vue
 * <p class="cluster" data-gap="s">
 *   <span v-if="insight.authors?.length">By {{ insight.authors.join(', ') }}</span>
 *   <span v-else>By [author]</span>
 *   <time>{{ monthYear(insight.publish_date) }}</time>
 * </p>
 * ```
 *
 * Three things in five lines are worth keeping and three are not.
 *
 * ## 1. `By [author]` is a data gap, not a design
 *
 * That `v-else` exists because **268 of the 371 rows in
 * `content/bf/insights/` carry an empty `authors` array** — 103 carry one or
 * two names. On a wireframe, whose job is to show where a thing goes, a
 * bracketed placeholder is the honest way to draw an absent field. On the real
 * site it is a bug that ships the word `[author]` to 72% of insight pages.
 *
 * So the empty case is the *ordinary* path here, and it gets the same answer
 * `bfTime` (gh#27) gives an unparseable date:
 *
 * | `author` | `date` | renders |
 * |---|---|---|
 * | a name | usable | `By <name>` + `<time>` |
 * | a name | absent/unusable | `By <name>` |
 * | empty / whitespace | usable | the `<time>` alone — a dateline is a real thing, `By ` with nothing after it is not |
 * | empty / whitespace | absent/unusable | **nothing at all** |
 *
 * The last row is the one that matters. An empty `<p class="bf-byline">` is
 * not invisible: it is a flex container inside a `.stack` or a `.cluster`, so
 * it contributes a phantom `gap` and pushes the copy below it down by a step
 * on three pages out of four. That is the precise failure `bfTime`'s own
 * "renders no element, not an empty one" rule exists to prevent, and it would
 * be undone here by a component that always renders its wrapper.
 *
 * ## 2. The date guard is `bfTime`'s, mirrored — and the mirror is checked
 *
 * Whether a byline has "a usable date" is exactly the question `bfTime` asks
 * itself: trim the string, hand it to `Date`, and treat `NaN` as absent. That
 * rule is duplicated here as `hasDate` rather than shared through
 * `utils/format.ts`, so that this issue edits no already-merged component.
 *
 * Duplicated logic drifts, so it is not left on trust: `/bf-probe/29-bf-byline`
 * asserts, for every case it renders, that this component's prediction and
 * `bfTime`'s actual output agree — a `<p>` renders if and only if something is
 * inside it. A future change to either guard fails the harness rather than
 * shipping a phantom paragraph.
 *
 * ## 3. What is kept from the wireframe
 *
 * The `<p>` (a byline is a sentence about the article, not a list), the
 * `.cluster` composition (two runs of text that must wrap on a narrow column
 * rather than overflow), and the literal word `By`. The gap steps down from
 * the wireframe's `s` to the spec's `xs`: at `s` the date reads as a separate
 * line of metadata rather than as part of the same phrase.
 *
 * ## Naming
 *
 * This is the *article* byline. The similarly-named footer-credit organism
 * under `src/components/ds/organisms/` is a copyright/attribution line, is
 * unrelated in purpose, and is left completely untouched by gh#38 — no rename,
 * no edit. The two do not collide in the auto-import registry: Nuxt drops the
 * `ccm` prefix for that file (its name already starts with it) and prepends
 * `Bf` to this one, so they register as two distinct identifiers and two
 * distinct kebab tags. Asserted on the probe, which renders both side by side.
 * Written up in `docs/ds-epic/issues/29-bf-byline.md` § Decisions.
 *
 * Presentational-only (BRIEF D8): props in, nothing else. No data access, no
 * store, no `queryCollection`. Props-only, no slot — the ADR-1 "cards + heros
 * = props" rule, which applies here because the molecule has no compound
 * anatomy to slot into.
 */
import type { BylineProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfByline' })

const props = defineProps<BylineProps>()

/**
 * The author line with surrounding whitespace removed, or `''` when there is
 * nothing to print. Trimming first means `' '` is treated as absent rather
 * than rendered as `By ` followed by a space — which is what
 * `['', ''].join(', ')` produces, a shape the real snapshot can reach.
 */
const authorText = computed(() => props.author?.trim() ?? '')

const hasAuthor = computed(() => authorText.value !== '')

/**
 * `bfTime`'s guard, mirrored: trim, parse, treat `NaN` as absent. See §2 in the
 * header — the probe asserts this agrees with what `bfTime` actually renders,
 * for every case, so the two cannot drift apart silently.
 */
const hasDate = computed(() => {
  const raw = props.date?.trim() ?? ''
  if (!raw) return false
  return !Number.isNaN(new Date(raw).getTime())
})

/**
 * The single `v-if`. A byline with neither half is not an empty byline — it is
 * no byline, and it must leave no element behind to inherit a `gap`.
 */
const hasContent = computed(() => hasAuthor.value || hasDate.value)
</script>

<template>
  <!--
    One root, no `inheritAttrs: false` — this is a leaf molecule, not a wrapper
    around a base, so `class`, `style`, `data-*` and any `aria-*` a consumer
    needs fall straight through to the `<p>`. `$attrs` is merged after the
    template's own attributes, so a consumer passing `data-gap="s"` overrides
    the `xs` default below rather than being overridden by it.

    `.bf-byline | cluster` — the CUBE convention the spec writes out: block
    class, pipe, composition class.
  -->
  <p
    v-if="hasContent"
    class="bf-byline | cluster"
    data-gap="xs"
  >
    <!--
      A `<span>`, where the spec's sketch had a bare text node. Two reasons,
      both practical: a bare text node in a flex container becomes an anonymous
      flex item that no selector, no probe and no consumer stylesheet can
      address, and the author half has to be conditional, which needs an
      element or a `<template v-if>` anyway. The frozen wireframe uses a
      `<span>` here too.
    -->
    <span
      v-if="hasAuthor"
      class="bf-byline__author"
    >By {{ authorText }}</span>

    <!--
      One literal space, and it is not decoration.

      The two halves are flex items, so the space *between* them on screen is
      the `gap` — a layout property, invisible to anything that reads the DOM
      as text. Without this node `textContent` reads
      `By Anthony T. SilberfeldFeb 2018`, and so does anything downstream of
      it: a copy-paste out of the page, a plain-text extraction, an assistive
      technology that flattens inline runs rather than pausing between them.
      The byline is one phrase; it should still be one phrase when the CSS is
      gone.

      A whitespace-only text run is **not** a flex item (CSS Flexbox §4: a
      contiguous child text sequence containing only white space is not
      rendered), so this changes no box, no gap and no measurement — probe 29
      asserts the resolved gap against reference clusters either way.

      Guarded by both halves, so an author-less byline carries no leading
      space and a date-less one no trailing space.
    -->
    <template v-if="hasAuthor && hasDate">{{ ' ' }}</template>

    <!--
      `bfTime` owns every question about the date — how it parses, what its
      `datetime` attribute may contain, and whether it renders at all. The
      `v-if` here is not a second guard on that decision; it is what keeps this
      component's own `hasContent` arithmetic honest, and the probe asserts the
      two never disagree.
    -->
    <bfTime
      v-if="hasDate"
      class="bf-byline__date"
      :date="props.date ?? null"
    />
  </p>
</template>

<style scoped>
/*
  `@layer components` must survive into the built stylesheet — see the note in
  `Button.vue` for the history: `postcss-preset-env`'s cascade-layers polyfill
  used to flatten these blocks into unlayered rules, which then outranked every
  layer. The feature is off in `nuxt.config.ts`; the probe reads the live CSSOM
  so a regression fails loudly.

  No negation pseudo-class anywhere in this file. D-20.5 (gh#29):
  `postcss-preset-env` mis-lowers a `:not()` containing a complex selector,
  silently breaking the rule. Nothing here needs one.

  Tokens only, and no colour at all — a byline inherits the type and the colour
  of the header it sits in, which is what the spec's Styling section asks for.
*/
@layer components {
  .bf-byline {
    /*
      The spec's hook, and it chains *through* the composition layer rather
      than around it.

      A flat `--_bf-byline-gap: var(--space-xs)` plus `gap: var(--_bf-byline-gap)`
      would work and would be a trap: `@layer components` outranks
      `@layer composition`, so this rule would beat `.cluster[data-gap="…"]`
      and quietly make `data-gap` inert on this component — including the
      `data-gap="xs"` in this file's own template. The next caller who reaches
      for the documented composition API would find it does nothing, with no
      error to explain why.

      Reading `--_cluster-space` as the default instead keeps both routes open:
      `data-gap`/`data-space` from a consumer flows through the composition
      layer into this hook, and a consumer who sets `--_bf-byline-gap` directly
      still overrides it. The `var(--space-xs)` fallback covers the case where
      no gap attribute is present at all.

      Declared in the rule, not bound inline through a `cssVars` computed — the
      `bfMedia` lesson from gh#26. A component that writes its own custom
      properties inline on every instance is no more overridable than one that
      writes flat declarations inline, because an ordinary consumer rule cannot
      outrank an inline style. This component emits no inline `style` at all.
    */
    --_bf-byline-gap: var(--_cluster-space, var(--space-xs));

    gap: var(--_bf-byline-gap);

    /*
      `baseline` over `.cluster`'s `center`, on `bfCardRow`'s reasoning
      (`Card.vue`): the author run and the date run may be set at different
      sizes by the header around them, and centring their boxes would leave two
      visibly different text baselines on one line of what is meant to read as
      a single phrase.
    */
    align-items: baseline;
  }
}
</style>
