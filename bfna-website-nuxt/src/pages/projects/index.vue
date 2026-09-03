<script setup lang="ts">
/**
 * `/projects` — the all-projects index (issue 51 / gh#60).
 *
 * Descends from `src/pages/wireframes/projects/index.vue`, which is frozen
 * (D2): read for its band order, its copy and its two comments about *why*
 * the bands are shaped this way, never edited, and nothing here imports from
 * it. Three zones, in the frozen source's order:
 *
 * 1. the page header, from the `projects` row of `bfPages`;
 * 2. one band per program — a linked `<h2>` and that program's grid;
 * 3. a "Pending re-tag (Q3)" band, rendered only when that set is non-empty.
 *
 * It retires no legacy file. `pages/projects/` did not exist, and the legacy
 * catch-all `pages/[...slug].vue` — which served the old product URLs — ranks
 * below a static route segment in vue-router, so adding this file takes
 * `/projects` from the catch-all without deleting anything (BRIEF §5 rule 7
 * asks for a deletion only where a *page file* owned the route). The product
 * branch of that catch-all is retired by #58/#57.
 *
 * ## Ordering is consumed, never re-derived (spec §Ordering, D3)
 *
 * Both orders this page renders are stored fields, materialised by the
 * normaliser and sorted once inside the composables:
 *
 * | what | stored key | sorted in |
 * |---|---|---|
 * | the three bands | `Program.order` | `useBfPrograms` (gh#180) |
 * | the cards in a band | `Project.grid_order` | `useBfProjects` (gh#89) |
 *
 * So this file calls each member once and renders what comes back. There is no
 * `.sort()` below, and `GRID_ORDER` is not named here — it lives in the
 * normaliser (#07/D3).
 *
 * ## Data
 *
 * A page may call a composable; a `bf-*` component may not (D8). Every read on
 * this route therefore happens in the three awaited calls below, and every
 * component under `<template>` receives entities as props. The imports are
 * explicit because Nuxt scans `composables/` one directory deep for `index`
 * files only, and these live at `composables/data/useBf*.ts`.
 *
 * ## What is deliberately not here
 *
 * No filters and no search — the faceted index is `/insights` (#49), and the
 * spec puts a projects filter out of scope (#54). No project detail markup
 * (#52). No product cards: `transponder-magazine` is `external_only` and
 * `grid_eligible: false`, so `gridProjectsByProgram` prunes it and it renders
 * on `/` as a `bfCardProduct` band (#47) instead.
 */
import { useBfPages } from '~/composables/data/useBfPages'
import { useBfPrograms } from '~/composables/data/useBfPrograms'
import { useBfProjects } from '~/composables/data/useBfProjects'

defineOptions({ name: 'ProjectsIndexPage' })

definePageMeta({ layout: 'bf-default' })

const { pageBySlug } = await useBfPages()
const { programs } = await useBfPrograms()
const { gridProjectsByProgram, projectsPendingRetag } = await useBfProjects()

/** The copy deck behind this index — `pages.json`'s `projects` row. */
const indexPage = pageBySlug('projects')

/**
 * The three programs, already in the client's curated order. Held in a
 * `const` rather than called from the `v-for`, so the render walks one array
 * instead of allocating a fresh copy on every re-render.
 */
const programList = programs()

/**
 * Legacy projects whose new program is still a `RE-TAG` placeholder (Q3),
 * archived rows excluded. Empty today — 100 Questions, the only member the
 * wireframe ever had here, is archived — which is exactly why the band below
 * is guarded rather than unconditional: an empty band would render a heading
 * over nothing.
 */
const retag = projectsPendingRetag()

/**
 * The band's own title, added once by `bf-default`'s `titleTemplate`. Set
 * here rather than left off (as `/` deliberately leaves it off) because the
 * layout's contract is that every page below the root states its own name.
 */
useHead({ title: () => indexPage?.heading ?? 'All Projects' })

/**
 * The `id` of a band's linked `<h2>`, and the target of that band's
 * `aria-labelledby`.
 *
 * Derived from the program slug rather than from `useId()`: `useId()` returns
 * one value per *component instance*, and this page is one instance rendering
 * three bands, so a single id would be reused three times and the second and
 * third `aria-labelledby` would both point at the first band's heading. The
 * slug is unique by construction (it is the `/{program}` route segment) and
 * stable across the server render and the client hydration, which is the other
 * thing `useId()` is normally relied on for.
 */
const bandHeadingId = (slug: string) => `projects-band-${slug}`
</script>

<template>
  <!--
    No wrapper element: `bf-default`'s `<main class="stack" data-gap="xl">` is
    this page's own stack, and a `<div>` here would collapse every band into a
    single stack child and lose the rhythm between them.
  -->

  <!--
    Zone 1 — the index header.

    `heading` and `tagline` come from `pages.json`'s `projects` row; the
    fallback is the frozen page's own literal, kept so the page still names
    itself if that document ever disappears.

    **The trail is two entries, not the frozen source's one** — residual
    [#188](https://github.com/ccmdesign/bfna-website-migration-2/issues/188).
    `bfBreadcrumb` (#20) treats the *last* crumb as the current page and never
    links it, positionally, whether or not it carries a `to`. A one-entry
    `[{ label: 'Home', to: '/' }]` trail therefore renders Home as an unlinked
    `<span aria-current="page">` — a breadcrumb claiming the reader is on the
    homepage, with no link anywhere in it. Naming this page as the final,
    unlinked crumb restores Home to a real `<a href="/">` and puts
    `aria-current="page"` where it belongs. The fix is a call-site one: the
    component's rule is right, and it is the same two-then-current shape
    `insights/[slug].vue` already builds.
  -->
  <bfPageHeader
    label="Projects index"
    :crumbs="[{ label: 'Home', to: '/' }, { label: 'Projects' }]"
    :heading="indexPage?.heading ?? 'All Projects'"
    :tagline="indexPage?.description"
  />

  <!--
    Zone 2 — one band per program, in the stored `order`.

    The `<h2>` is slot content rather than `bfSection`'s `heading` prop
    because it has to be a **link** to the program hub, and that prop renders
    plain text. The frozen source does the same thing for the same reason. The
    band is still a named `region` landmark: `aria-labelledby` points at the
    heading's id, and `bfSection`'s attribute allowlist forwards `aria-*` with
    a call-site value winning over the prop-derived one.

    `bfGridProjects` brings its own `.grid[data-min-width]` (D9) — this page
    names no column count anywhere. `:excerpt-length="120"` is the frozen
    source's value, tighter than the card's own 140 default because these
    bands run three-abreast. `:heading-level="3"` keeps the card titles under
    the band's `<h2>` (BRIEF §5 rule 9); it is also `bfCardProject`'s default,
    stated so the next reader does not have to know that.
  -->
  <bfSection
    v-for="program in programList"
    :key="program.slug"
    :label="program.name"
    :aria-labelledby="bandHeadingId(program.slug)"
  >
    <h2 :id="bandHeadingId(program.slug)">
      <NuxtLink :to="`/${program.slug}`">{{ program.name }}</NuxtLink>
    </h2>

    <bfGridProjects
      :projects="gridProjectsByProgram(program.name)"
      :excerpt-length="120"
      :heading-level="3"
    />
  </bfSection>

  <!--
    Zone 3 — legacy items whose new program is unresolved (Q3), kept visible
    rather than hidden, so nothing falls off the site while the client
    re-tags it.

    Guarded on `retag.length`, so the band disappears entirely when the set
    empties — which is its state today. This one *does* use `bfSection`'s
    `heading` prop: the band is not a program and has no hub to link to.
  -->
  <bfSection
    v-if="retag.length"
    label="Pending re-tag (Q3)"
    heading="Pending re-tag"
  >
    <bfGridProjects
      :projects="retag"
      :excerpt-length="120"
      :heading-level="3"
    />
  </bfSection>
</template>
