<script setup lang="ts">
/**
 * A non-interactive person card with a circular portrait above centered copy.
 * The entity and heading level are passed in; the component fetches no data.
 * Board and Team share the same presentation.
 *
 * The heading stays first in the DOM for heading navigation. The decorative
 * portrait is ordered above it by bfCard, with no placeholder when absent.
 * Job titles remain complete, including the em dash for a missing title.
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
    above it visually by the base's stylesheet. Never reorder the markup to
    change the picture.
  -->
  <bfCard v-bind="$attrs" class="bf-card--person">
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
    <p class="bf-card-person__role">{{ jobTitle }}</p>

    <template v-if="person.image" #media>
      <!--
        Decorative: the heading above already names the person, so alt text
        would repeat it rather than describe anything. `alt=""` is the
        *deliberate* decorative declaration — `bfMedia` requires `alt`, so
        omitting it is a typecheck error rather than a silent `alt=""`
        (gh#222, D25).

        `1/1` is hard-coded rather than a `mediaRatio` prop: one call site
        (issue 53's two `/about` grids), so the rule of three is not met. It is
        `bfMedia`'s `ratio`, which lands as a `--_bf-media-ratio` declaration a
        consumer stylesheet can still re-proportion.

        Only when the row carries an image (all thirteen do today). The family's
        media rule (Sep 2026): no `image`, no slot — never `bfMedia`'s
        placeholder box — so a person without a portrait reads as a name card
        rather than an empty frame.
      -->
      <bfMedia :src="person.image" alt="" ratio="1/1" />
    </template>
  </bfCard>
</template>

<style scoped>
@layer components {
  .bf-card.bf-card--person {
    --_bf-card-padding: 0;
    --_bf-card-bg: transparent;
    --_bf-card-shadow: none;

    text-align: center;
  }

  .bf-card--person :deep(.bf-card__media) {
    inline-size: min(100%, 12rem);
    margin-inline: auto;
    border-radius: var(--radius-pill);
  }

  /* Roles are complete labels, so override the base card's excerpt clamp. */
  .bf-card.bf-card--person :deep(.bf-card__text > p.bf-card-person__role) {
    display: block;
    overflow: visible;
    max-inline-size: 26ch;
    margin-block-start: var(--space-3xs);
    margin-inline: auto;
    -webkit-line-clamp: unset;
    line-clamp: none;
    overflow-wrap: break-word;
    text-wrap: balance;
  }
}
</style>
