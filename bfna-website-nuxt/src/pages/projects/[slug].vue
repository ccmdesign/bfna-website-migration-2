<script setup lang="ts">
/**
 * `/projects/:slug` — one project (issue 52 / gh#61).
 *
 * Descends from `src/pages/wireframes/projects/[slug].vue`, which is frozen
 * (D2): read for its branch order, its band set and its comments about *why*
 * each band exists, never edited, and nothing here imports from it. It retires
 * **no** legacy file — `pages/projects/` held only `index.vue` (#51), and the
 * catch-all `pages/[...slug].vue` compiles to `/:slug(.*)*` while this file
 * compiles to `/projects/:slug()`. vue-router ranks the static segment above
 * the catch-all, so `/projects/<slug>` simply starts being answered here and
 * every other route the catch-all holds is untouched. Retiring it is #58's
 * job; the legacy `/podcasts/:slug` and product redirects into this route are
 * #57's.
 *
 * ## Three branches, in the frozen source's order
 *
 * 1. **External** (`project.external_url` truthy) — the thin-page pattern
 *    (Q4: a page *and* an external CTA, not a bare redirect). Header with the
 *    overview as its standfirst, the microsite callout, the participation
 *    path, related insights.
 * 2. **Full** — header with the lead image, the body, the participation path,
 *    a podcast band when the row carries one, a cohort band when the row has
 *    children, related insights.
 * 3. **Neither** — no such slug: `bfEmptyState`.
 *
 * ## D-52.1 — no project can reach the Episodes band today
 *
 * `indo-pacific-nexus` is the only one of the 38 rows carrying a `podcast`
 * object (BF-147: the podcast folded *into* the project rather than living at
 * `/podcasts/*`). It also carries `external_url: "#ipn-microsite-url"`, and
 * the frozen source branches on `external_url` **first** — so IPN renders the
 * external template, where the Episodes band does not exist.
 *
 * The band is still built here, exactly as specified, because the spec pins
 * the branch order ("exactly as the wireframe does") and because the band is
 * data-driven: the moment a row carries a `podcast` without an
 * `external_url` — or the moment the client resolves IPN's placeholder URL
 * into a real microsite and the project moves to the full template — it
 * appears with no template edit. Reordering the branches to reach it would be
 * a content decision made in a template, and it is not this issue's to make.
 * Handed off as a residual instead.
 *
 * ## D-52.2 — the two `#…` external URLs are rendered as given
 *
 * `astropolitics` (`#astropolitics-microsite-url`) and `indo-pacific-nexus`
 * (`#ipn-microsite-url`) carry placeholder microsite addresses. They render as
 * stored: an in-page `#` anchor is a visible, greppable "this is not filled in
 * yet" for the client, whereas suppressing the CTA would hide the gap and
 * inventing a URL would ship a broken promise. Both still get `external`, so
 * the `[data-external]` treatment (#19) marks them consistently with the seven
 * real microsite links.
 *
 * ## D-52.3 — the cohort chips link somewhere
 *
 * The frozen source writes `<wf-chip href="#">` for every cohort, because in
 * the wireframe those cohort pages had no route. They have one now: they are
 * `bfProjects` documents with a `parent_project`, `projectBySlug` finds them,
 * and this very file serves them. So each chip is a `NuxtLink` to
 * `/projects/<child-slug>`, which is the page the reader is being pointed at.
 *
 * ## D-52.4 — an orphaned `parent_project` is a normal render (BF-218 F4)
 *
 * `cepi-2010` and `cepi-2011` name a parent, `cepi`, that is not in the
 * collection. Nothing here dereferences `parent_project`: the page reads
 * *children* (`projectChildren(slug)`), never a parent, so an orphan renders
 * as an ordinary childless full-template project. Asserted by name in the
 * acceptance, because the failure mode it guards against — resolving a parent
 * for a crumb or a back-link — is the obvious thing a later edit would add.
 *
 * ## Data
 *
 * A page may call a composable; a `bf-*` component may not (D8). Both reads on
 * this route are the awaited calls below, and every component in the template
 * is handed entities as props. The imports are explicit because Nuxt scans
 * `composables/` one directory deep for `index` files only, and these live at
 * `composables/data/useBf*.ts`.
 */
import type { Cta } from '~/types/bf-contracts'
import { useBfInsights } from '~/composables/data/useBfInsights'
import { useBfPrograms } from '~/composables/data/useBfPrograms'
import { useBfProjects } from '~/composables/data/useBfProjects'
import { useProgramTheme } from '~/composables/useProgramTheme'
import { kindLabel, paragraphs } from '~/utils/format'

defineOptions({ name: 'ProjectDetailPage' })

definePageMeta({ layout: 'bf-default' })

const route = useRoute()

const { projectBySlug, projectChildren } = await useBfProjects()
const { insightsForProject } = await useBfInsights()
const { programs } = await useBfPrograms()

/**
 * The document, or `undefined` for a slug that is not in the collection.
 * `projectBySlug` searches all 38 rows, children included, so the 20
 * cohort/year pages resolve here too.
 */
const project = projectBySlug(route.params.slug as string)

/**
 * The band's own title, added once by `bf-default`'s `titleTemplate`. A row
 * with no heading is a content defect, not a nameless page, so the fallback
 * names the route rather than leaving the site title alone.
 */
useHead({ title: () => project?.heading ?? 'Project' })

/**
 * The trail, root first. **Three entries, not the frozen source's two** —
 * residual [#188](https://github.com/ccmdesign/bfna-website-migration-2/issues/188),
 * the same fix `/projects` (#51) and `/insights/:slug` (#50) already carry.
 * `bfBreadcrumb` treats the *last* entry as the current page and never links
 * it (#20's contract: `aria-current` is positional, not a function of `to`), so
 * a two-entry trail ending at `Projects` would render the index as the page the
 * reader is already on and drop the one link a detail page's breadcrumb exists
 * to provide. The third entry carries no `to` for exactly that reason: it *is*
 * this page.
 */
const crumbs = [
  { label: 'Home', to: '/' },
  { label: 'Projects', to: '/projects' },
  { label: project?.heading ?? 'Project' }
]

/**
 * The programme, **only if it is one** — the same guard `/insights/:slug` puts
 * on the identical field (D-50.2), for the identical reason.
 *
 * `100-questions` stores `program: "RE-TAG (was fake category: Archives)"`: a
 * migration signal addressed to the client, not a programme, and
 * `/projects/100-questions` is a prerendered page a reader can reach. Resolving
 * the stored string against the three real `bfPrograms` rows and dropping
 * anything that does not match is what keeps that sentence off the page.
 *
 * The **row** is what is resolved, not just its name, since gh#252: two things
 * hang off it now — the header chip, which reads the name, and the programme
 * colour scope, which reads the slug. That is the shape
 * `/insights/:slug` has carried since #50, and the lookup is still one `find`.
 */
const program = project?.program
  ? programs().find(p => p.name === project.program)
  : undefined

/** The name a reader may be shown, or nothing. */
const programName = program?.name

/**
 * The programme colour scope (gh#252). `data-program` lands on `<html>` — the
 * only placement that reaches every branch's bands without the wrapper `<div>`
 * this template's comment forbids; `useProgramTheme` carries the full argument.
 *
 * It applies to both render branches, external and full, because the scope is
 * a property of the project rather than of the template it happens to use.
 * `undefined` — an unknown slug, or one of the mis-tagged rows above — leaves
 * the neutral `:root` default in place.
 */
useProgramTheme(program?.slug)

/**
 * The header chips, in the frozen source's order: the literal `Project`, the
 * formatted kind, the programme, and the copy-pending marker.
 *
 * `filter(Boolean)` with the type predicate drops the nulls the conditionals
 * leave behind; `bfPageHeader` filters non-strings out too, but the type has to
 * agree with `chips?: string[]` here.
 */
const chips: string[] = project
  ? [
      'Project',
      kindLabel(project.kind),
      programName,
      project.pending ? `Copy pending ${project.pending}` : null
    ].filter((c): c is string => typeof c === 'string' && c !== '')
  : []

/**
 * The external template's standfirst: the description split into paragraphs,
 * or the excerpt as a single one.
 *
 * `paragraphs()` and the excerpt both arrive as plain strings — the HTML strip
 * and entity decode the frozen source's render-time `plain()` helper did now
 * happen once, in the build-time normaliser (D3), which is why no such helper
 * is called here.
 */
const overview: string[] = project
  ? (project.description ? paragraphs(project.description) : [project.excerpt].filter((s): s is string => !!s))
  : []

/**
 * The participation path — draft copy stored per project (`participation`,
 * Aug 3). The fallback is the frozen source's own, so a row without the field
 * still gets an onward journey rather than a missing band.
 */
const participation = project?.participation
  ?? { title: 'Follow this project', ctas: ['Subscribe for updates', 'Read the latest'] }

/**
 * The participation CTAs. Label only: the stored value is an array of strings
 * with no destinations yet, so each renders as `bfButton`'s no-destination
 * `<button>` branch — the frozen source's own shape, kept rather than pointed
 * at an invented URL.
 */
const participationCtas: Cta[] = participation.ctas.map(label => ({ label }))

/**
 * The microsite CTA — one action, out to the project's own site. Built here
 * rather than inline in the template so the array is allocated once at setup
 * instead of on every render.
 */
const micrositeCtas: Cta[] = project?.external_url
  ? [{ label: `Visit ${project.heading}`, href: project.external_url, external: true }]
  : []

/** Cohort/year pages nested under this project, newest first. */
const cohorts = project ? projectChildren(project.slug) : []

/**
 * Active insights cross-referencing this project — the real M2M.
 *
 * Sliced once here rather than in the template: `related.slice(0, 6)` inline
 * would allocate a fresh array on every render, and `bfGridInsights` keys its
 * `<li>`s off the rows it is handed. Six is the frozen source's own cap; the
 * largest set in the data is three, so it is a ceiling rather than a trim
 * today.
 */
const related = (project ? insightsForProject(project.slug) : []).slice(0, 6)
</script>

<template>
  <!--
    No wrapper element: `bf-default`'s `<main class="stack" data-gap="xl">` is
    this page's own stack, and a `<div>` here would collapse every band into a
    single stack child and lose the rhythm between them. `<template>` renders no
    element either, so the branch guards cost nothing structurally.
  -->

  <!--
    Branch 1 — EXTERNAL. The compact template: what this is, then straight out
    to the microsite that holds it. The overview is the header's `tagline`
    rather than a body band, because on this branch there is no body — the
    standfirst *is* the page's prose.
  -->
  <template v-if="project && project.external_url">
    <bfPageHeader
      label="Project overview (external)"
      :crumbs="crumbs"
      :chips="chips"
      :heading="project.heading"
      :tagline="overview"
    />

    <!--
      The microsite callout. `message` is the stored `microsite_cta` sentence;
      `?? undefined` because the prop is optional-not-nullable and 15 of the 38
      rows store `null` there.
    -->
    <bfCtaSection
      label="Microsite CTA"
      heading="Explore the full project"
      :message="project.microsite_cta ?? undefined"
      :ctas="micrositeCtas"
    />

    <bfCtaSection
      label="Participation path"
      :heading="participation.title"
      :ctas="participationCtas"
    />

    <!--
      The onward journey, rendered only when there is one. The frozen source
      keeps the band and guards the grid inside it, which leaves a heading over
      nothing for the 13 external rows with no related insights; the guard moves
      out to the band, as `/insights/:slug` (#50) and `[program].vue` already do.
      `bfGridInsights` brings its own `.grid[data-min-width]` (D9) — no column
      count is named here. `headingLevel` 3 keeps the card headings under the
      band's `<h2>` (BRIEF §5 rule 9).
    -->
    <bfSection
      v-if="related.length"
      label="Related insights"
      :heading="`From ${project.heading}`"
    >
      <bfGridInsights :insights="related" :heading-level="3" />
    </bfSection>
  </template>

  <!--
    Branch 2 — FULL. Body, participation, and the two conditional bands.
  -->
  <template v-else-if="project">
    <bfPageHeader
      label="Project overview"
      :crumbs="crumbs"
      :chips="chips"
      :heading="project.heading"
    >
      <!--
        `alt` is the heading, as the frozen source sets it: these are editorial
        lead images with no separate description in the source, and the heading
        is the only honest text available. `bfMedia` renders an `aria-hidden`
        placeholder rather than an unlabelled box for the 6 full rows with no
        `image` at all.

        TODO(gh#234): the same defect as `insights/[slug].vue` and left alone
        for the same reason — the lead image's `alt` duplicates the `<h1>`. Not
        decorative, so `alt=""` would be a lie; gh#222 forbids inventing a
        string (D28, §8). #234 fixes it with the real field.
      -->
      <bfMedia :src="project.image" :alt="project.heading" ratio="21/9" />
    </bfPageHeader>

    <!--
      The body: the dataset description (Irene Jul 29 docx), falling back to the
      CMS excerpt. `measure="narrow"` is the frozen source's own — this is the
      one band here that is a column of running prose.

      Guarded, because since #186 `bfProse` renders nothing when both fields are
      null and the band would otherwise be an empty labelled `<section>` paying
      a full `xl` stack gap. Three rows are in that state — the Summer
      Enrichment year pages `2022`, `2023` and `2024` — and the guard is on the
      same expression the prop receives, so the band and its content can never
      disagree.
    -->
    <bfSection
      v-if="project.description ?? project.excerpt"
      label="Project body"
      measure="narrow"
    >
      <bfProse :content="project.description ?? project.excerpt" />
    </bfSection>

    <bfCtaSection
      label="Participation path"
      :heading="participation.title"
      :ctas="participationCtas"
    />

    <!--
      BF-147: the podcast folded INTO the project, data-driven via the row's
      `podcast` field so any project carrying one gets this band with no
      template edit. Unreached today — see D-52.1 in the block comment above.

      Text only, by spec: no audio player. The episode titles and descriptions
      are the client's own placeholder strings, pending extraction from Irene's
      May 11 docx, and the `bfChip` marker says so on the page rather than in a
      comment nobody reading the site will see.
    -->
    <bfSection
      v-if="project.podcast"
      label="Episodes"
      :heading="project.podcast.title"
    >
      <div class="stack" data-gap="s">
        <p v-if="project.podcast.host" data-measure="narrow">
          A podcast hosted by {{ project.podcast.host }}.
        </p>

        <div v-if="project.podcast.source_note" class="cluster" data-gap="xs">
          <bfChip>Placeholder — {{ project.podcast.source_note }}</bfChip>
        </div>

        <!--
          `role="list"` is explicit because the rule below removes the markers,
          and WebKit drops list semantics from a `list-style: none` list — so
          VoiceOver would stop announcing "list, 3 items" without it. The same
          belt-and-braces `bfBreadcrumb` puts on its own `<ol>`. `data-gap` does
          the rhythm; the reset lives in the one scoped rule at the foot of this
          file.
        -->
        <ul class="bf-project-episodes | stack" role="list" data-gap="xs">
          <li
            v-for="(ep, i) in project.podcast.episodes"
            :key="ep.title || i"
            class="stack"
            data-gap="3xs"
          >
            <strong>{{ ep.title }}</strong>
            <p v-if="ep.description" data-measure="narrow">{{ ep.description }}</p>
          </li>
        </ul>
      </div>
    </bfSection>

    <!--
      Cohort/year pages nested under this project through `parent_project` —
      real data, 20 rows across three parents. Guarded on `cohorts.length`, so
      the 15 childless projects grow no empty band.

      Each chip links to the cohort's own page rather than to the frozen
      source's `href="#"` (D-52.3): those pages exist now, and this file serves
      them.
    -->
    <bfSection v-if="cohorts.length" label="Outcomes / alumni" heading="The Fellows">
      <p data-measure="narrow">{{ cohorts.length }} cohort pages nested under this project.</p>

      <div class="cluster" data-gap="xs">
        <bfChip
          v-for="c in cohorts"
          :key="c.slug"
          :to="`/projects/${c.slug}`"
        >{{ c.heading }}</bfChip>
      </div>
    </bfSection>

    <bfSection
      v-if="related.length"
      label="Related insights"
      :heading="`From ${project.heading}`"
    >
      <bfGridInsights :insights="related" :heading-level="3" />
    </bfSection>
  </template>

  <!--
    Branch 3 — no such slug. This branch owns the page's only `<h1>`:
    `bfEmptyState` defaults `headingLevel` to 1 and `bfPageHeader` is not
    rendered above it, so the render has exactly one either way.
  -->
  <bfEmptyState
    v-else
    heading="Unknown project"
    message="That project does not exist, or its address has changed."
    back-label="All projects"
    back-to="/projects"
  />
</template>

<style scoped>
/*
 * One declaration, and it is a list reset rather than styling: the episode list
 * is a `.stack`, whose rhythm and zeroed padding are the composition layer's,
 * but the markers are the browser's and no primitive removes them. The frozen
 * source writes the same two properties as an inline `style` attribute; here
 * they are a class, which is the only difference.
 *
 * No colour, no `--_bf-*` variable, no `:not()` (D-20.5).
 *
 * Wrapped in `@layer components` (gh#68). It was not, and the cascade-layer
 * gate in `scripts/check-routes.ts` caught it on its first run: this was the one
 * `.bf-*` rule in the whole build shipping **unlayered**, and unlayered author
 * CSS outranks every layer — so a `utils` or `overrides` rule could never have
 * beaten it, which is backwards. Exactly the defect residual #98 / gh#101 was
 * about, arriving through a page's own `<style scoped>` rather than through the
 * postcss polyfill.
 */
@layer components {
  .bf-project-episodes {
    padding-inline-start: 0;
    list-style: none;
  }
}
</style>
