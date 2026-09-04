<script setup lang="ts">
/**
 * `bfCardPerson` — the person card: name, job title, square portrait. A
 * **typed wrapper** over `bfCard`, and the first one in the family that is
 * deliberately **not a link**.
 *
 * Ports `components/wireframe/wfCardPerson.vue` (issue 24 / gh#33). That file
 * is frozen (D2) and is not touched here.
 *
 * Same contract as the three wrappers before it (D-21.1): the wrapper owns no
 * DOM (`inheritAttrs: false`, root of `<bfCard v-bind="$attrs">`), the prop is
 * the **entity** rather than a hand-picked subset of its fields, it is
 * presentational-only (BRIEF D8 — no `queryCollection`, no store, no data
 * composable), it takes the shared `headingLevel` (#128), and it ships **no
 * `<style>` block at all**: every pixel is already styled by `bfCard`'s
 * `@layer components` rules and by `bfMedia`'s `--_bf-media-*` hooks. With no
 * stylesheet, BRIEF §5 rule 2 (no new colour) and D-20.5 (no `:not()` holding
 * a complex selector) are satisfied vacuously.
 *
 * ## The card is non-interactive — D-24.1, and it is settled
 *
 * `wfCardPerson.vue`'s own header comment says it: *"No link (people have no
 * detail pages in the wireframe). Portrait is decorative — the heading names
 * them."* The open question the inventory recorded (BF-174 — should bf-* add a
 * modal, a person detail route, or a bio expander?) is **resolved as "ship
 * unlinked"** and written into this issue's spec Decisions section. This file
 * builds none of the three, and it is not a stub for them: a later issue that
 * adds a person surface changes this component deliberately, against a
 * decision, rather than filling in something left half-done.
 *
 * Three properties follow from having no anchor, and probe 24 asserts each one
 * rather than trusting the reasoning:
 *
 * 1. **No stretched hit area.** `bfCard`'s overlay is
 *    `.bf-card :is(h2, h3, h4) a::after`. No `a`, no generated
 *    pseudo-element — the card is a box of text, not a card-sized link.
 * 2. **No hover or focus treatment.** `.bf-card:has(:is(h2, h3, h4) a):hover`
 *    and its `:focus-visible` sibling both require the same anchor, so a
 *    person card takes neither. That is correct, not a regression: an
 *    affordance on something that does not go anywhere is a lie.
 * 3. **The card is not focusable.** Nothing inside it is a tab stop, so it
 *    does not appear in the sequential focus order at all.
 *
 * And the #130 hazard — a stretched link with no accessible name — is
 * structurally **absent** here rather than guarded: there is no link that
 * could lack a name. What is guarded is the smaller sibling defect, an empty
 * heading element (see `hasName` below).
 *
 * ## `job_title` and the `—` fallback
 *
 * `bfPersonSchema` types `job_title` as `z.string().nullable()` and one of the
 * thirteen real rows (`ma-a-ocvirk`) carries `null`. The em dash is
 * `wfCardPerson.vue:12`'s, kept verbatim: it holds the line's vertical space
 * so a row of cards does not lose its baseline grid where one person has no
 * title, and it reads as "no title recorded" rather than inventing one
 * (BRIEF §5 rule 10 — never synthesise user-visible content the data does not
 * carry).
 *
 * ## The portrait is decorative
 *
 * `alt=""`, deliberately declared rather than omitted — `bfMedia` requires
 * `alt`, so omitting it is a typecheck error (gh#222). The heading immediately
 * above already names the person, so alt text here would be a second
 * announcement of the same name, not a description. `ratio="1/1"` is
 * `wfCardPerson.vue`'s square and lands as a `--_bf-media-ratio` declaration
 * a consumer stylesheet can
 * still re-proportion (never an inline `aspect-ratio`; that was the gh#26
 * defect).
 *
 * ## Thin by design
 *
 * One entity prop plus the inherited `headingLevel`, and nothing else. BRIEF
 * §5's rule of three: no `mediaRatio`, no `showBio`, no `linkTo` switch until
 * a need shows up twice. The one consumer is issue 53's `/about` Board and
 * Team grids, which differ only in *which rows they pass* — a filter on the
 * page, not a prop on the card. A caller wanting something else composes
 * `bfCard` directly, which is what the base is for.
 */
import type { CardWrapperProps, Person } from '~/types/bf-contracts'

defineOptions({
  name: 'BfCardPerson',
  /*
   * Paired with the explicit `v-bind="$attrs"` below — both halves, or neither
   * (D-21.1). Left at the default, a caller's `class`, `style`, `data-*` and
   * listeners would be applied to the root twice.
   */
  inheritAttrs: false
})

interface Props extends CardWrapperProps {
  /**
   * One `bfPeople` row — board member or team member alike. Passed whole; this
   * component fetches nothing, and it is the **caller** (issue 53's `/about`)
   * that queries and splits the two groups on `board`.
   *
   * Typed as the whole `Person` rather than a `board`-narrowed variant: the
   * flag is a bucket the data carries, not a different shape, and the card
   * renders identically for both — which is the point of one component
   * serving two grids.
   */
  person: Person
}

const props = withDefaults(defineProps<Props>(), {
  /* The no-change level; see `CardWrapperProps`. */
  headingLevel: 3
})

/**
 * The name, trimmed.
 *
 * `bfPersonSchema` types `name` as a non-nullable `z.string()`, so unlike the
 * three link-bearing wrappers this is not the typed-null case — but the empty
 * string still typechecks, and an `<h3></h3>` is an empty heading: a real
 * defect (axe `empty-heading`; a heading that announces nothing still shows up
 * in a screen reader's heading list and in the document outline).
 *
 * So a blank name renders **no heading element**, exactly as `bfCardFeatured`
 * does for a blank one, and the card keeps its job title and portrait. Never a
 * slug or an `'Unknown'` in its place — that invents user-visible content the
 * data does not carry (BRIEF §5 rule 10).
 *
 * The consequence is milder here than on the linked wrappers, and it is worth
 * naming: with no anchor there is no card-sized unnamed link to produce, so
 * the worst case a blank name can reach is a portrait with a job title under
 * it, not an unusable navigation target.
 */
const nameText = computed(() => (props.person.name ?? '').trim())

const hasName = computed(() => nameText.value !== '')

/**
 * The job title, or the em dash. One expression, so the rendered text and the
 * fallback cannot drift apart; `??` and not `||`, because a title is either a
 * string the data carries or `null` — and collapsing `''` into the fallback
 * would quietly paper over a normaliser bug rather than showing it.
 */
const jobTitle = computed(() => props.person.job_title ?? '—')

/**
 * …and the blank-name defect is announced rather than swallowed. Same shape as
 * `bfCard`'s outside-a-list warning (gh#29) and the three earlier wrappers': a
 * dev-time `console.warn`, never a thrown error, with `import.meta.dev`
 * keeping it out of the production bundle.
 */
if (import.meta.dev) {
  watchEffect(() => {
    if (!hasName.value) {
      console.warn(
        '[bfCardPerson] `person.name` is empty, so the card renders no heading '
        + '— an empty heading element is the alternative. '
        + `slug: ${props.person.slug}`
      )
    }
  })
}
</script>

<template>
  <!--
    Order is `bfCard`'s, not this file's: heading **first in the DOM** so
    heading navigation lands at the start of the card, with the portrait pulled
    above it visually by `order: -2` in the base's stylesheet. Never reorder the
    markup to change the picture.
  -->
  <bfCard v-bind="$attrs">
    <!--
      `h2` / `h3` / `h4` from `headingLevel` (#128) — the three levels
      `bfCard`'s stylesheet matches (D-20.4).

      **No router link component, and no `<a>` of any kind** (D-24.1) — the
      name of the link component is deliberately absent from this file, because
      the spec's acceptance greps the source for it. This is the one
      wrapper in the family whose heading is plain text: people have no detail
      page, no modal and no bio expander, and the wireframe this ports says so
      in its own header comment. A link here would be the decision BF-174 asks
      for, made silently by a component.
    -->
    <component :is="`h${headingLevel}`" v-if="hasName">{{ nameText }}</component>

    <!--
      Always rendered — the em dash is the fallback, so there is no empty-`<p>`
      branch to guard against the way the excerpt-bearing wrappers have.
    -->
    <p>{{ jobTitle }}</p>

    <template #media>
      <!--
        Decorative: the heading above already names the person, so alt text
        would repeat it rather than describe anything. `alt=""` is the
        *deliberate* decorative declaration — `bfMedia` requires `alt`, so
        omitting it is a typecheck error rather than a silent `alt=""`
        (gh#222, D25).

        `1/1` is hard-coded rather than a `mediaRatio` prop: one call site
        (issue 53's two `/about` grids), so the rule of three is not met. It is
        `bfMedia`'s `ratio`, which lands as a `--_bf-media-ratio` declaration a
        consumer stylesheet can still re-proportion. A row with no `image`
        falls through to `bfMedia`'s `aria-hidden` placeholder box at the same
        square ratio, so a grid of portraits keeps its rhythm.
      -->
      <bfMedia :src="person.image" alt="" ratio="1/1" />
    </template>
  </bfCard>
</template>
