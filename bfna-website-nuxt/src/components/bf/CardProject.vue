<script setup lang="ts">
/**
 * `bfCardProject` — the project card: a **typed wrapper** over `bfCard`.
 *
 * Ports `components/wireframe/wfCardProject.vue` (issue 22 / gh#31). That file
 * is frozen (D2) and is not touched here.
 *
 * The second of the six typed wrappers, written against the contract
 * `bfCardInsight` settled in D-21.1 rather than re-deciding it: the wrapper
 * owns no DOM (`inheritAttrs: false`, root of `<bfCard v-bind="$attrs">`), the
 * prop is the **entity** and not a hand-written subset of its fields, the
 * component is presentational-only (BRIEF D8 — no `queryCollection`, no store,
 * no data composable), and it ships **no `<style>` block at all**, because
 * every pixel it renders is already styled by `bfCard`'s `@layer components`
 * rules and by the `--_bf-chip-*` / `--_bf-media-*` hooks the two atoms bring.
 * With no stylesheet, BRIEF §5 rule 2 (no new colour) and D-20.5 (no `:not()`
 * holding a complex selector) are satisfied vacuously.
 *
 * `headingLevel` comes from the shared `CardWrapperProps` (#128) — see the
 * heading note below.
 *
 * ## The heading always links. `pending` is a chip, not a branch.
 *
 * This is the one thing about this card that reads like a contradiction and is
 * not. An **external** project — one carrying `external_url` — still gets an
 * internal overview page: `pages/wireframes/projects/[slug].vue` renders a
 * compact template for it whose whole job is the "Visit …" CTA to the
 * microsite. So the card's heading points at `/projects/<slug>` for every
 * project, external or not, and the `↗` is a *description of the destination's
 * content* ("this project lives on an external platform") rather than a promise
 * that this link leaves the site.
 *
 * That is also why the anchor carries **no `[data-external]`**, though the
 * spec's Scope paragraph asks for it in the same breath as asking the heading
 * to always link internally. The marker's own stylesheet
 * (`public/css/components/external-link.css`) and `utils/link.ts`'s
 * `isExternal()` agree on what it means — *this href goes off-site* — and
 * putting it on an anchor that navigates to `/projects/…` would make it lie.
 * The reasoning is recorded as D-22.3 in the spec.
 *
 * `pending` likewise only adds a chip. `wfCardProject.vue` has no unlinked
 * branch, and inventing one here would take a real page away from two of the
 * 38 real projects.
 *
 * ## The excerpt falls back with `??`, not `||`
 *
 * `project.excerpt ?? project.description` is the frozen expression, kept
 * exactly — including the consequence that an **empty-string** excerpt does
 * *not* fall back to the description, because `''` is not nullish. Three real
 * rows (`2022`, `2023`, `2024`) carry both empty and render no paragraph at
 * all; the probe's `fallback` card exercises the nullish half.
 *
 * As in `bfCardInsight`, **`plain()` is not called**: HTML stripping moved into
 * the build-time normaliser (issue 07) and the helper is retired (issue 10), so
 * both fields arrive as plain text and re-deriving the strip here would be a
 * second, drifting copy of it.
 */
import type { CardWrapperProps, Project } from '~/types/bf-contracts'
import { kindLabel } from '~/utils/format'

defineOptions({
  name: 'BfCardProject',
  /*
   * Paired with the explicit `v-bind="$attrs"` below — both halves, or neither
   * (D-21.1). Left at the default, a caller's `class`, `style`, `data-*` and
   * listeners would be applied to the root twice: once automatically, once
   * through the `v-bind`.
   */
  inheritAttrs: false
})

interface Props extends CardWrapperProps {
  /** One `bfProjects` row. Passed whole; this component fetches nothing. */
  project: Project
  /**
   * Render the media slot. **Off by default**, unlike `bfCardInsight`'s
   * `excerpt`: most project grids are text-only, and the home page's
   * "Featured projects" band is the call site that turns it on.
   */
  media?: boolean
  /** CSS `aspect-ratio` for the media box, handed straight to `bfMedia`. */
  mediaRatio?: string
  /** Render the chip cluster. On by default, as in the frozen source. */
  chips?: boolean
  /** Character budget for the excerpt before it is cut and given an ellipsis. */
  excerptLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  /* The no-change level; see `CardWrapperProps`. */
  headingLevel: 3,
  /*
   * Stated explicitly where the frozen source leaves it undeclared (and
   * therefore `undefined`, which is falsy and behaves identically). The spec
   * writes `media = false`, and a declared default is the one a reader of the
   * component can see.
   */
  media: false,
  mediaRatio: '3/2',
  chips: true,
  excerptLength: 140
})

/**
 * The heading text, trimmed — and the #130 guard, applied to this wrapper for
 * the same reason it is applied to `bfCardInsight`.
 *
 * `bfProjectSchema` types `heading` as a non-nullable `z.string()`, so this is
 * defensive rather than latent here: what it rules out is the **empty** string
 * a normaliser change or a hand-built fixture could introduce. A blank heading
 * renders no heading element and no link, so the card can never become a
 * card-sized anchor with no accessible name (WCAG 2.4.4 / 4.1.2) — never a
 * silent fallback, and never invented text (BRIEF §5 rule 10).
 */
const headingText = computed(() => (props.project.heading ?? '').trim())

const hasHeading = computed(() => headingText.value !== '')

/**
 * The mapped `kind` label, computed once rather than called three times from
 * the template (the guard, the chip's own `v-if`, and its text). `kindLabel`
 * returns `null` for a null or empty `kind` — 8 of the 38 real rows — and
 * echoes an unmapped slug back, which is why `2025-astropolitics` renders a
 * `cohort` chip rather than nothing.
 */
const kind = computed(() => kindLabel(props.project.kind))

/**
 * The excerpt, truncated. `wfCardProject.vue:18-21`'s arithmetic minus the
 * `plain()` call: `trimEnd()` before the ellipsis so a cut landing on a space
 * does not ship `"… "`-with-a-hole, and `…` is the single character rather
 * than three periods.
 *
 * The empty string then fails the template's `v-if` and no empty `<p>` is
 * rendered — which matters in a flex column, where an empty child still
 * contributes a `gap`.
 */
const excerptText = computed(() => {
  const text = props.project.excerpt ?? props.project.description ?? ''
  return text.length > props.excerptLength
    ? text.slice(0, props.excerptLength).trimEnd() + '…'
    : text
})

/**
 * Whether to provide the `#chips` slot at all — `hasChips` from
 * `wfCardProject.vue:23-24`, kept.
 *
 * It matters that this is decided *before* the slot rather than inside it:
 * `bfCard` renders its chip wrapper on `v-if="$slots.chips"`, so a slot
 * provided but empty would still emit a `.bf-card__chips` element, and an
 * empty flex child contributes a `gap`. `cepi-2010` — no kind, no
 * `external_url`, no `pending` — is the real row that proves it.
 */
const hasChips = computed(() =>
  props.chips
  && Boolean(kind.value || props.project.external_url || props.project.pending)
)

if (import.meta.dev) {
  watchEffect(() => {
    if (!hasHeading.value) {
      console.warn(
        '[bfCardProject] `project.heading` is empty, so the card renders no '
        + 'heading and no link — a stretched link with no accessible name is '
        + `the alternative. slug: ${props.project.slug}`
      )
    }
  })
}
</script>

<template>
  <!--
    Order is `bfCard`'s, not this file's: heading **first in the DOM** so
    heading navigation lands at the start of the card, with the chips and the
    media pulled above it visually by `order: -1` / `-2` in the base's
    stylesheet. Never reorder the markup to change the picture.
  -->
  <bfCard v-bind="$attrs">
    <component :is="`h${headingLevel}`" v-if="hasHeading">
      <!--
        One link per card, stretched over the whole card by `bfCard`'s
        `::after`, with the heading text as its accessible name — no "Explore"
        CTA repeated down a grid (inclusive-components.design/cards/).

        The `↗` is `aria-hidden`, so the link's accessible name stays the
        project title: an arrow read aloud as "north east arrow" after every
        external project would be noise. It sits **inside** the anchor and on
        one source line with the interpolation, because Vue's whitespace
        condensing would otherwise eat the separating space and the marker
        would touch the last word.
      -->
      <NuxtLink :to="`/projects/${project.slug}`">{{ headingText }}<span v-if="project.external_url" aria-hidden="true"> ↗</span></NuxtLink>
    </component>

    <p v-if="excerptText">{{ excerptText }}</p>

    <template v-if="hasChips" #chips>
      <bfChip v-if="kind">{{ kind }}</bfChip>
      <bfChip v-if="project.external_url">External platform</bfChip>
      <bfChip v-if="project.pending">Copy pending {{ project.pending }}</bfChip>
    </template>

    <template v-if="media" #media>
      <!--
        Decorative: the heading already names the destination, so a second
        announcement of the same title would be a duplicate rather than a
        description. `alt=""` is the *deliberate* decorative declaration —
        `bfMedia` warns at dev time when `alt` is merely omitted (gh#26).
      -->
      <bfMedia :src="project.image" alt="" :ratio="mediaRatio" />
    </template>
  </bfCard>
</template>
