<script setup lang="ts">
/**
 * `/{program}` — the program hub, one page for all three (issue 48 / gh#57).
 *
 * Descends from `src/pages/wireframes/[area].vue`, which is frozen (D2): read
 * for its band order, its filters and its copy decisions, never edited, and
 * nothing here imports from it. The route parameter is renamed `area` →
 * `program` because "focus areas" is the outdated label and the taxonomy is
 * final: three **programs**, each containing **projects** (Irene, Jul 31).
 *
 * It is also the file that retires the four legacy workstream index pages
 * whose routes it absorbs — `pages/{democracy,digital-world,future-leadership,
 * politics-society}/index.vue` (`02-legacy-retirement-inventory.md` §A). Two of
 * those four routes (`/digital-world`, `/politics-society`) are not program
 * slugs at all: they are the old five-workstream taxonomy, they have no hub to
 * be replaced by, and their redirects belong to the redirect map in phase 7.
 * Deleting them here is what BRIEF §5 rule 7 asks for — a route has one page
 * file — and no other legacy file is touched.
 *
 * ## The `validate` guard, and what it actually does
 *
 * `pages/[program].vue` compiles to `/:program()`, which matches **every**
 * one-segment path. vue-router ranks a named-param segment above the legacy
 * catch-all `pages/[...slug].vue` (`/:slug(.*)*`), so without a guard this file
 * would answer for `/careers`, `/people`, `/blog`… — every one-segment URL on
 * the site, migrated or not. The guard is therefore load-bearing, not
 * decorative.
 *
 * What it does **not** do is hand the request back to the router.
 * `nuxt/dist/pages/runtime/validate.js` turns a `false` result into
 * `createError({ status: 404 })`; matching does not resume, so the legacy
 * catch-all never sees the path. The spec's scope note describes a fallthrough;
 * the framework delivers a 404. The *effect* the spec and the acceptance both
 * ask for — a non-program one-segment path does not render this hub — is what
 * `validate` gives either way. See D-48.1 in the spec's Decisions for the six
 * paths this converts from a hollow legacy 200 into a 404, none of which
 * renders any content today.
 *
 * `PROGRAM_SLUGS` is read from the `bfPrograms` collection's source files at
 * build time (`~/utils/bf-programs`), so the three slugs are written down
 * exactly once, in the content.
 *
 * ## Data
 *
 * A page may call a composable; a `bf-*` component may not (D8). So every read
 * on this route happens in the three awaited calls below, and every component
 * under `<template>` receives entities as props. The imports are explicit
 * because Nuxt scans `composables/` one directory deep for `index` files only,
 * and these live at `composables/data/useBf*.ts`.
 */
import type { Insight } from '~/types/bf-contracts'
import { useBfInsights } from '~/composables/data/useBfInsights'
import { useBfPrograms } from '~/composables/data/useBfPrograms'
import { useBfProjects } from '~/composables/data/useBfProjects'
import { useProgramTheme } from '~/composables/useProgramTheme'
import { isProgramSlug } from '~/utils/bf-programs'
import { paragraphs } from '~/utils/format'

defineOptions({ name: 'ProgramHubPage' })

definePageMeta({
  layout: 'bf-default',
  validate: route => isProgramSlug(route.params.program)
})

const route = useRoute()

const { programBySlug } = await useBfPrograms()
const { gridProjectsByProgram, projectBySlug } = await useBfProjects()
const { activeByProgram, archivedCountByProgram } = await useBfInsights()

/**
 * The hub's own document, or `undefined`.
 *
 * `validate` has already rejected every slug outside the collection, so this
 * is `undefined` only if a program's JSON disappeared between the glob that
 * built `PROGRAM_SLUGS` and the collection query — which is the defensive case
 * `bfEmptyState` covers at the bottom of the template, not the primary 404
 * path.
 */
const program = programBySlug(route.params.program as string)

/**
 * The band's own title, added once by `bf-default`'s `titleTemplate`. Set here
 * rather than left off (as `/` deliberately leaves it off) because the layout's
 * contract is that every page below the root states its own name.
 */
useHead({ title: () => program?.name })

/**
 * The programme colour scope (gh#252). `data-program` lands on `<html>`, which
 * is the only placement that recolours all three bands without the wrapper
 * `<div>` this template's comment forbids — see `useProgramTheme` for the full
 * argument and for the specificity tie it relies on.
 *
 * `program?.slug` rather than `route.params.program`: the param has already
 * passed `validate`, but the attribute should name a document that exists, so
 * it is read off the same row the rest of the page renders. The `undefined`
 * branch is the defensive one `bfEmptyState` covers below, and it correctly
 * leaves the neutral `:root` default in place.
 */
useProgramTheme(program?.slug)

/**
 * Active, on-site projects in this program, in the client's grid order —
 * podcasts and external-only products are pruned inside the composable, not
 * here.
 */
const projects = program ? gridProjectsByProgram(program.name) : []

/**
 * Active insights for this hub.
 *
 * The trailing filter is the frozen source's, ported verbatim and scoped the
 * same way: **the Democracy hub only** shows 2026 releases (Irene, Aug 5
 * widget feedback); the other two programs keep the whole active tier. It is a
 * page-level rule rather than a composable or normaliser one for the same
 * reason D10's Insights switch is — there is no field in `bfInsights` that
 * says "Democracy shows one year", and inventing one would write a client
 * decision into the data with no upstream authority. Recorded as D-48.3.
 *
 * `activeByProgram` takes the display **name**, not the slug.
 */
const insights: Insight[] = program
  ? activeByProgram(program.name).filter(
    i => program.slug !== 'democracy' || (i.publish_date ?? '').startsWith('2026')
  )
  : []

/**
 * **D10** — the Insights band is conditional per hub, and the condition is a
 * slug check in this page.
 *
 * Future Leadership carries no Insights band (Irene, Aug 5 widget thread;
 * answered by Claudio, Sep 1: "Remove Insights from the Future Leadership
 * page"). The spec records the decision to keep this as a page-level check
 * rather than promote it to a `show_insights` flag: no such field exists in
 * the audited `bfPrograms` schema, and materialising one would mean writing
 * synthetic data into `content/bf/programs/*.json`. If a second program ever
 * needs the same exclusion, that is when it becomes a normaliser-emitted flag.
 */
const showInsights = program?.slug !== 'future-leadership'

/** The archive band's counter — archived insights in this program. */
const archivedCount = program ? archivedCountByProgram(program.name) : 0

/**
 * `bfGridInsights.extraChips` — the related projects of one insight, by title,
 * exactly as the frozen source builds them.
 *
 * `Insight.projects` holds project **slugs** (the real M2M); the chip shows the
 * project's `heading`. `projectBySlug` searches children as well as top-level
 * projects, so a cohort page's slug resolves too. A row with no related
 * projects yields `undefined`, which the grid reads as "no extra chips" rather
 * than as an empty cluster.
 */
const insightChips = (i: Insight): string[] | undefined =>
  i.projects?.length
    ? i.projects.map(slug => projectBySlug(slug)?.heading ?? slug)
    : undefined
</script>

<template>
  <!--
    No wrapper element: `bf-default`'s `<main class="stack" data-gap="xl">` is
    this page's own stack, and a `<div>` here would collapse the rhythm between
    the bands into one stack child. `<template>` renders no element either, so
    the guard below costs nothing structurally.
  -->
  <template v-if="program">
    <!--
      Zone 1 — the hub intro (GGS hub template). `paragraphs()` splits the
      stored `intro` on blank lines, one `<p data-measure="normal">` each.

      The CTA is slot content, wrapped in a `<div>`: `bfPageHeader` composes
      `bfSection`, whose inner box is a `.stack`, and a bare anchor as a stack
      child stretches to the full measure. The wrapper is the frozen source's
      own, kept for the same reason. Copy is Irene's (Aug 5): "Explore our
      work", pointing at the Projects band below.
    -->
    <bfPageHeader
      label="Hub intro"
      :crumbs="[{ label: 'Home', to: '/' }, { label: 'Programs' }]"
      :heading="program.name"
      :tagline="paragraphs(program.intro)"
    >
      <div>
        <bfButton to="#projects" variant="primary">Explore our work</bfButton>
      </div>
    </bfPageHeader>

    <!--
      Zone 2 — the projects in this program. `id="projects"` is the CTA's
      anchor target and passes through `bfSection`'s attribute allowlist.

      `bfGridProjects` brings its own `.grid[data-min-width]` (D9) — this page
      names no column count. `headingLevel="3"` keeps the card headings under
      the band's `<h2>` (BRIEF §5 rule 9); it is also the wrapper's default,
      stated so the next reader does not have to know that.
    -->
    <bfSection id="projects" label="Projects in this area" heading="Projects">
      <bfGridProjects :projects="projects" :heading-level="3" />
    </bfSection>

    <!--
      The Transponder product band is not here: it moved to the homepage,
      between Projects and Insights (see `pages/index.vue`).
    -->

    <!--
      Zone 3 — recent insights, active tier only, nine at most. Conditional per
      hub (D10) — see `showInsights` above.

      The two links are the frozen source's pair, retargeted at the routes this
      epic actually serves: the filtered index at `/insights?area=<slug>`, and
      the archive, which is its own route at `/archive` rather than the
      wireframe's `?archive=1` query on the index.
    -->
    <bfSection v-if="showInsights" label="Recent insights" heading="Insights">
      <bfGridInsights
        :insights="insights.slice(0, 9)"
        :extra-chips="insightChips"
        :heading-level="3"
      />

      <div class="cluster" data-gap="s">
        <bfButton :to="`/insights?area=${program.slug}`">
          All {{ program.name }} insights ({{ insights.length }})
        </bfButton>
        <bfButton to="/archive">
          Include archived ({{ archivedCount }})<span aria-hidden="true"> →</span>
        </bfButton>
      </div>
    </bfSection>

    <!--
      The "Other programs" cross-links row was removed from all three hubs
      (Claudio, Sep 2, widget comment #136 — BF-173) and is not reinstated.
    -->
  </template>

  <!--
    Defensive only. `validate` answers the real "not a program" case with a 404
    before this page renders; this covers a slug that passed the guard but has
    no document behind it.
  -->
  <bfEmptyState
    v-else
    heading="Unknown program"
    message="That program does not exist, or has been renamed."
    back-label="Back to home"
    back-to="/"
  />
</template>
