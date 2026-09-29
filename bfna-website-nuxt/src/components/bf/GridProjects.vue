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
 * ## Media is the grid's decision (Sep 2026)
 *
 * `bfCardProject.media` is on by default and a card shows its thumbnail
 * when its row has an `image`. This grid decides whether its cards may, by
 * the rule `bfGridInsights` documents: pictures only when **every** project
 * it renders has one, otherwise none for the whole group. `/projects` and
 * the Democracy hub mixed two picture cards with two text cards in a
 * checkerboard, and each text card stood about 300px of white tall to match
 * its neighbour. Each band on `/projects` is its own grid, so the decision
 * is per programme: Future Leadership, all pictures, keeps them.
 *
 * Still no `media` prop: the rows already say it, and a caller-set switch
 * could only contradict them.
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

/** Pictures for the whole group, or for none of it. See the note above. */
const media = computed(() => props.projects.every(p => Boolean(p.image)))
</script>

<template>
  <!--
    `<ul>` group, cards are `<li>` — the inclusive-components card pattern,
    kept from the frozen source. `data-gap="m"` matches it exactly; the column
    policy is `data-min-width`, there is no `style` binding on this element,
    and nothing in this file names a column template.

    `role="list"` is not redundant: `base/reset.css:95-103` strips `list-style` from every
    `ul[class]`, and WebKit reads that declaration as the author no longer
    meaning a list — VoiceOver stops saying "list, N items" and stops
    offering list navigation. Restating the implicit role puts the
    semantics back without putting the bullets back. Same fix and same
    reason as `nav/Dropdown.vue:109` and `Breadcrumb.vue:238-240`
    (gh#220, D27).
  -->
  <ul
    class="grid"
    role="list"
    :data-min-width="props.minWidth"
    data-gap="m"
  >
    <bfCardProject
      v-for="p in props.projects"
      :key="p.slug"
      :project="p"
      :excerpt-length="props.excerptLength"
      :heading-level="props.headingLevel"
      :media="media"
    />
  </ul>
</template>
