<script setup lang="ts">
/**
 * `bfCardProgram` — the programme card: a linked name and a tagline. A **typed
 * wrapper** over `bfCard`, and the smallest one in the family.
 *
 * Ports `components/wireframe/wfCardProgram.vue` (issue 25 / gh#34). That file
 * is frozen (D2) and is not touched here.
 *
 * The contract is D-21.1's, adopted rather than re-decided: the wrapper owns no
 * DOM (`inheritAttrs: false`, root of `<bfCard v-bind="$attrs">`), the prop is
 * the **entity**, the component is presentational-only (BRIEF D8 — no
 * `queryCollection`, no store, no data composable), it takes the shared
 * `headingLevel` (#128), and it ships **no `<style>` block at all**: every
 * pixel is `bfCard`'s `@layer components` rules. With no stylesheet, BRIEF §5
 * rule 2 (no new colour) and D-20.5 (no `:not()` holding a complex selector)
 * are satisfied vacuously.
 *
 * ## The defect this issue exists to fix
 *
 * `wfCardProgram.vue:4` declares its prop as an ad-hoc inline shape —
 * `{ slug, name, tagline?, short? }`, each annotated in place — instead of the
 * entity type, and `pages/wireframes/index.vue:61-66` hand-builds an object to
 * match it, deriving the tagline *in the page*:
 *
 * (The shape is written abbreviated here on purpose. The spec's acceptance
 * greps this file for the literal declaration, and a doc comment quoting it
 * verbatim would fail a check that is asking about the code — the same
 * complaint #115 fixed by running those greps over comment-stripped source.)
 *
 * ```ts
 * const areaCards = programs().map(a => ({
 *   slug: a.slug,
 *   name: a.name,
 *   short: …,
 *   tagline: (a.intro ?? '').split(/(?<=\.)\s/)[0] || null
 * }))
 * ```
 *
 * Two things go wrong there and both are fixed here rather than carried over:
 *
 * 1. **The type is a copy.** A prop shape written by hand cannot track the
 *    schema; a field renamed in `bfProgramSchema` fails at the call site, or
 *    worse, silently keeps typechecking against a stale duplicate. `program` is
 *    annotated `Program` — the zod-inferred type (issue 09) re-exported from
 *    `~/types/bf-contracts`, which BRIEF §5 rule 11 makes the only home for a
 *    shared type. Pass the old inline object and the caller stops compiling,
 *    which is the acceptance criterion of this issue.
 * 2. **The derivation is in the wrong layer.** `tagline` is now a **real
 *    schema field** (`z.string()`, required), written by the build-time
 *    normaliser (issue 07) as the first sentence of `intro` — the same
 *    arithmetic, moved once to where it belongs. This component reads
 *    `program.tagline` and derives nothing (D8, and the spec's Decisions).
 *
 * `short` — the wireframe's abbreviation of "Transatlantic Relations & Global
 * Challenges" — is **not** resurrected. It is not on `Program`, it was never
 * rendered by `wfCardProgram.vue` (which reads `name`), and it belongs to
 * whatever chrome needs a short label, not to the card.
 *
 * ## The heading links to the programme hub
 *
 * `/${program.slug}` — a top-level route, per BRIEF §7's table — where the
 * frozen source writes `/wireframes/${program.slug}`. The three slugs are final
 * and named in BRIEF §8: `democracy`,
 * `transatlantic-relations-global-challenges`, `future-leadership`.
 *
 * The route file (`pages/[program].vue`) is issue 48's, so today these hrefs
 * resolve to nothing. That is the same footing `bfCardProject` links
 * `/projects/<slug>` on and it is deliberate: the card states the destination
 * the site will have, `nitro.prerender.failOnError` is `false`, and probe 25
 * asserts the **href string**, which is the contract, rather than a successful
 * navigation.
 *
 * ## No media, and no `short`/`media`/`excerptLength` props
 *
 * `bfProgramSchema` carries an `image`, and this card does not render it: the
 * spec's Scope is a heading and a tagline, the wireframe row is a text
 * `switcher`, and the one consumer (issue 47's home "Programs" band) asks for
 * nothing more. BRIEF §5's rule of three — a prop earns its place on the second
 * call site that needs it, not on the first one that might.
 */
import type { CardWrapperProps, Program } from '~/types/bf-contracts'

defineOptions({
  name: 'BfCardProgram',
  /*
   * Paired with the explicit `v-bind="$attrs"` below — both halves, or neither
   * (D-21.1). Left at the default, a caller's `class`, `style`, `data-*` and
   * listeners would be applied to the root twice.
   */
  inheritAttrs: false
})

interface Props extends CardWrapperProps {
  /**
   * One `bfPrograms` row — one of exactly three. Passed whole; this component
   * fetches nothing, and it is the **caller** (issue 47's home page) that
   * queries the collection.
   *
   * The whole point of the issue: `Program`, the zod-inferred entity, and not
   * the `{ slug, name, tagline?, short? }` shape the wireframe declared inline.
   */
  program: Program
}

const props = withDefaults(defineProps<Props>(), {
  /* The no-change level; see `CardWrapperProps`. */
  headingLevel: 3
})

/**
 * The programme name, trimmed — and the #130 guard, applied here for the same
 * reason it is applied to the three link-bearing wrappers before it.
 *
 * `bfProgramSchema` types `name` as a non-nullable `z.string()`, so this is
 * defensive rather than latent: what it rules out is the **empty** string a
 * normaliser change or a hand-built fixture could introduce. A blank name
 * renders no heading element and therefore no anchor, so the card can never
 * become a card-sized link with no accessible name (WCAG 2.4.4 / 4.1.2).
 * Never a slug in its place, and never an invented label — that would
 * synthesise user-visible content the data does not carry (BRIEF §5 rule 10).
 */
const nameText = computed(() => (props.program.name ?? '').trim())

const hasName = computed(() => nameText.value !== '')

/**
 * The tagline, trimmed.
 *
 * `wfCardProgram.vue:11` guards it with `v-if="program.tagline"` because its
 * inline shape typed it `string | null | undefined`. The schema types it as a
 * **required** `z.string()`, so the guard survives with a narrower job: it
 * catches the empty string. That is worth keeping rather than simplifying away
 * — an empty `<p>` is still a flex child of `bfCard`'s column and still
 * contributes a `gap`, which would show up as a programme card that is taller
 * than its neighbours for no visible reason.
 */
const taglineText = computed(() => (props.program.tagline ?? '').trim())

/**
 * The blank-name defect is announced rather than swallowed — same shape as
 * `bfCard`'s outside-a-list warning (gh#29) and the four wrappers before it: a
 * dev-time `console.warn`, never a thrown error, with `import.meta.dev`
 * keeping it out of the production bundle.
 */
if (import.meta.dev) {
  watchEffect(() => {
    if (!hasName.value) {
      console.warn(
        '[bfCardProgram] `program.name` is empty, so the card renders no '
        + 'heading and no link — a stretched link with no accessible name is '
        + `the alternative. slug: ${props.program.slug}`
      )
    }
  })
}
</script>

<template>
  <!--
    Order is `bfCard`'s, not this file's: heading **first in the DOM**, so
    heading navigation lands at the start of the card. This card provides
    neither the `chips` nor the `media` slot, so nothing is pulled above it.
  -->
  <bfCard v-bind="$attrs">
    <component :is="`h${headingLevel}`" v-if="hasName">
      <!--
        One link per card, stretched over the whole card by `bfCard`'s
        `::after`, with the programme name as its accessible name — no
        "Explore" CTA repeated down a row (inclusive-components.design/cards/),
        which is what `wfCardProgram.vue`'s own header comment says it is
        avoiding.

        `/${slug}`, not `/wireframes/${slug}`: the hub route of BRIEF §7.
      -->
      <NuxtLink :to="`/${program.slug}`">{{ nameText }}</NuxtLink>
    </component>

    <p v-if="taglineText">{{ taglineText }}</p>
  </bfCard>
</template>
