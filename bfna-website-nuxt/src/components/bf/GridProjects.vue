<script setup lang="ts">
/**
 * `bfGridProjects` — THE projects grid: a thin data-in/cards-out organism.
 *
 * Ports `components/wireframe/wfGridProjects.vue` (issue 42 / gh#51). That
 * file is frozen (D2) and is not touched here. Its own comment records why
 * there is one of these and not two: *"the same grid on the program pages and
 * the all-projects index (Claudio, Aug 5), so the two views can't drift apart
 * in layout."*
 *
 * Built alongside `bfGridInsights` under BRIEF §5 rule 5's named bundle
 * exception. The two are deliberately **not** refactored onto a shared base —
 * out of scope per the spec, "not enough evidence yet" per the inventory. What
 * they do share is stated as a type (`GridProps` in `~/types/bf-contracts`)
 * rather than as a component, which costs nothing and commits to nothing.
 *
 * Everything `bfGridInsights` documents about the column contract, D8 and
 * `$attrs` holds here identically and is not restated; read that file. Two
 * things are this grid's own:
 *
 * ## The default floor is `xl`, not `l`
 *
 * The frozen source pins **two** columns (`repeat(2, 1fr)`), where the insights
 * grid pins three, and that difference is the entire reason the two exist
 * separately. Two columns at a desktop width pins the floor between the widths
 * that would resolve three and one — see D-42.2 for the arithmetic — which
 * lands on `xl` (400px). Below that, `l` gives three columns at 1200px and
 * would silently turn the projects index into the insights index.
 *
 * ## No `extraChips`
 *
 * `bfCardProject` derives its chips from the row itself — `kind`,
 * `external_url`, `pending` — and takes no extra-chip prop, so there is nothing
 * for a grid-level function to feed. The prop is absent rather than accepted
 * and dropped: a prop that typechecks and does nothing is worse than one that
 * does not exist.
 *
 * `media` is likewise not forwarded. `bfCardProject.media` is off by default
 * and the one call site that turns it on is the homepage's "Featured projects"
 * band, which the spec puts out of scope — issue 47's home template owns that
 * grid directly. Adding the pass-through here on speculation would be the
 * unified-base mistake in miniature.
 */
import type { GridProjectsProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfGridProjects' })

const props = withDefaults(defineProps<GridProjectsProps>(), {
  /*
   * `xl` — a 400px track floor, resolving **2 tracks at 1200px** and one at
   * both 800px and 400px.
   *
   * The arithmetic, from `.container` (`max-inline-size: 1200px`, `--space-m`
   * inline padding → ~1150px of content at a desktop width) and `auto-fill`'s
   * own `floor((W + gap) / (floor + gap))`: two columns require a floor above
   * ~380px (or three fit) and below ~560px (or one does). `xl` (400px) is the
   * only value on the scale inside that window — `l` (300px) resolves three,
   * `2xl` (500px) also resolves two but leaves no room before the one-column
   * collapse. See D-42.2.
   *
   * That the grid drops to a single column at 800px rather than holding two is
   * not a compromise, it is the arithmetic: a 750px container cannot hold two
   * tracks that must each be at least wide enough to have earned two at 1150px.
   * The frozen source's pinned two columns simply squeezed instead.
   */
  minWidth: 'xl',
  /* Unset, so `bfCardProject`'s own `140` applies. */
  excerptLength: undefined,
  headingLevel: undefined
})
</script>

<template>
  <!--
    `<ul>` group, cards are `<li>` — the inclusive-components card pattern,
    kept from the frozen source. `data-gap="m"` matches it exactly; the column
    policy is `data-min-width`, there is no `style` binding on this element,
    and nothing in this file names a column template.
  -->
  <ul class="grid" :data-min-width="props.minWidth" data-gap="m">
    <bfCardProject
      v-for="p in props.projects"
      :key="p.slug"
      :project="p"
      :excerpt-length="props.excerptLength"
      :heading-level="props.headingLevel"
    />
  </ul>
</template>
