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
 *    (Q4: a page *and* an external CTA, not a bare redirect). Masthead, the
 *    overview as the body's lede, then **one** destination band — the
 *    participation path, whose primary action is the microsite — then related
 *    insights.
 * 2. **Full** — masthead, the body (lead image and description), the
 *    participation path, a podcast band when the row carries one, a cohort
 *    band when the row has children, related insights.
 * 3. **Neither** — no such slug: `bfNotFound`, the not-found layout
 *    `error.vue` renders, with this route's own heading and back link.
 *
 * ## The reading column (refined pass, Sep 2026)
 *
 * The wireframe set the header on the site measure (1100px, flush left) and
 * the body on `measure="narrow"` (centred), so the `<h1>` and the prose it
 * introduces started on two different verticals ~260px apart at a desktop
 * width. Both now sit on the insight article's reading column — 60ch of the
 * body type, centred (`public/css/components/article.css`, gh#254) — and so do
 * the participation, episode and cohort bands, which are prose, actions and a
 * list rather than grids. The one grid band (related insights) keeps the site
 * measure, exactly as the article's related band does, and so does the full
 * template's lead image, which breaks out of the column as the article's
 * does. The shared half — the column, the `<h1>`'s step, the meta row's
 * step and the lead's break-out — is `public/css/components/detail.css`,
 * which both detail pages wear as `bf-detail-*` classes, so the two cannot
 * drift apart; what only this page has (the lede, the inset trim, the
 * microsite preview) is its own `bf-project-*` rules at the foot of the file.
 *
 * Two pictures, then, and each has its visible edge on one of those two
 * verticals — the lead on the site measure, the microsite preview on the
 * column. Neither would by itself: most rows' `image` is a 1400x897 legacy
 * thumbnail whose picture sits in a transparent margin (60px a side and
 * above it, 76px below), so an image box on a vertical showed its picture
 * ~4% inside it, a third edge on a page this pass set out to give two.
 * Both trim that margin inside their own clipped box; "The inset trim" at
 * the foot of the file has the geometry.
 *
 * Each band reaches the column the way the article's do: `measure="wide"` puts
 * `bfSection` on a named step (it falls through `bfPageHeader` and
 * `bfCtaSection`'s `$attrs` onto their `bfSection` root and is consumed there
 * as a prop), and `.bf-detail-column` caps that `.center` at the column —
 * a property no `bf-*` SFC writes, so nothing here competes with a compiled
 * scoped rule (the `article.css` lesson).
 *
 * ## What the refined pass removed, and why
 *
 * - **The duplicate microsite button.** The external template rendered the
 *   microsite callout ("Visit RANGE") *and* the participation band, whose
 *   first stored action on seven of the nine external rows is "Open RANGE" —
 *   two primary buttons one band apart, to the same place, the second a
 *   `<button>` that went nowhere. They are one band now: the participation
 *   path's heading and remaining actions, with the microsite as its primary
 *   action (D-52.5).
 * - **Scaffolding copy.** The `Project` chip (the trail already says
 *   Projects), the `Copy pending Q7` chip (a migration signal addressed to the
 *   client, not the reader), the cohort band's "14 cohort pages nested under
 *   this project." and the episode band's `Placeholder — …` chip. The pending
 *   questions stay where they belong — in `content/bf/**` and the review
 *   seed — and off a page a reader can reach.
 * - **The chip eyebrow.** Kind and programme moved from above the `<h1>` to a
 *   meta row under the masthead's copy — the insight article's arrangement:
 *   they are taxonomy, not a label for the title.
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
 * real microsite links. Neither has an `image`, so neither shows a preview
 * captioned with an address it does not have (`micrositeHost`).
 *
 * ## D-52.3 — the cohorts link somewhere
 *
 * The frozen source writes `<wf-chip href="#">` for every cohort, because in
 * the wireframe those cohort pages had no route. They have one now: they are
 * `bfProjects` documents with a `parent_project`, `projectBySlug` finds them,
 * and this very file serves them. Since the refined pass they are
 * `bfCardRow` rows rather than chips — the card family's dense line, one
 * linked title per year; the cohort page it opens carries the picture and
 * the theme (the band's template comment has the measurements).
 *
 * ## D-52.4 — an orphaned `parent_project` is a normal render (BF-218 F4)
 *
 * `cepi-2010` and `cepi-2011` name a parent, `cepi`, that is not in the
 * collection. The page reads *children* (`projectChildren(slug)`) for the
 * cohort band, and since the refined pass it also reads the parent — for one
 * thing only, the trail's third crumb, so `/projects/2022` says whose 2022 it
 * is. That read is **guarded on the parent resolving**: an orphan renders the
 * ordinary three-crumb trail and nothing else changes, which is exactly the
 * failure mode this note exists to keep closed.
 *
 * ## D-52.5 — the participation path keeps its label-only actions
 *
 * The stored `participation.ctas` are label strings with no destinations (CCM
 * drafts, Aug 3, pending the programme team), and GGS requires every project
 * page to state a participation path with a specific action. So the path
 * stays, and its label-only actions still render as `bfButton`'s
 * no-destination `<button>` — the frozen source's shape — rather than being
 * pointed at an invented URL. What changed is the one action that *does*
 * have a destination on the external branch: the stored `Open {project}`
 * label is the microsite, so it is given the microsite's `href` and becomes
 * the band's primary action, instead of rendering as a dead twin beside a
 * template-authored "Visit". Rows whose path does not name the microsite
 * (`astropolitics`, `indo-pacific-nexus`) get `Visit {project}` prepended, as
 * before.
 *
 * ## Data
 *
 * A page may call a composable; a `bf-*` component may not (D8). Every read on
 * this route is one of the awaited calls below, and every component in the
 * template is handed entities as props. The imports are explicit because Nuxt
 * scans `composables/` one directory deep for `index` files only, and these
 * live at `composables/data/useBf*.ts`.
 */
import type { Crumb, Cta } from '~/types/bf-contracts'
import { useBfInsights } from '~/composables/data/useBfInsights'
import { useBfPrograms } from '~/composables/data/useBfPrograms'
import { useBfProjects } from '~/composables/data/useBfProjects'
import { useProgramTheme } from '~/composables/useProgramTheme'
import { programChipLabel } from '~/utils/bf-card-program'
import { kindLabel } from '~/utils/format'

defineOptions({ name: 'ProjectDetailPage' })

definePageMeta({ layout: 'bf-default' })

const route = useRoute()

const { projectBySlug, projectChildren } = await useBfProjects()
const { insightsForProject, active } = await useBfInsights()
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
 * names the route rather than leaving the site title alone. A slug that is
 * not in the collection is titled as its `<h1>` reads, "Unknown project".
 */
useHead({ title: () => project ? (project.heading ?? 'Project') : 'Unknown project' })

/**
 * The project's name as a reader sees it. Trimmed because `100-questions`
 * stores `"100 Questions "`, and the name is interpolated into button labels
 * below as well as matched against the stored `Open {project}` action.
 */
const name = project?.heading?.trim() ?? ''

/**
 * The parent, **only if it resolves** — D-52.4. `cepi-2010`'s `cepi` does not,
 * and that row renders the three-crumb trail every top-level project has.
 */
const parent = project?.parent_project
  ? projectBySlug(project.parent_project)
  : undefined

/**
 * The trail, root first. **Three entries, not the frozen source's two** —
 * residual [#188](https://github.com/ccmdesign/bfna-website-migration-2/issues/188),
 * the same fix `/projects` (#51) and `/insights/:slug` (#50) already carry.
 * `bfBreadcrumb` treats the *last* entry as the current page and never links
 * it (#20's contract: `aria-current` is positional, not a function of `to`), so
 * a two-entry trail ending at `Projects` would render the index as the page the
 * reader is already on and drop the one link a detail page's breadcrumb exists
 * to provide. The last entry carries no `to` for exactly that reason: it *is*
 * this page.
 *
 * A cohort page gets a fourth — its parent, between the index and itself — so
 * `/projects/2022`, whose `<h1>` is the bare year, is placed under the
 * Summer Enrichment Series rather than floating as "2022".
 */
const crumbs: Crumb[] = [
  { label: 'Home', to: '/' },
  { label: 'Projects', to: '/projects' },
  ...(parent ? [{ label: parent.heading, to: `/projects/${parent.slug}` }] : []),
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
 * hang off it — the meta row's programme chip, which reads the name and the
 * slug, and the programme colour scope, which reads the slug. That is the
 * shape `/insights/:slug` has carried since #50, and the lookup is still one
 * `find`.
 */
const program = project?.program
  ? programs().find(p => p.name === project.program)
  : undefined

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

/** The formatted kind — "Fellowship program", "Cohort" — or nothing. */
const kind = project ? kindLabel(project.kind) : null

/**
 * Whether the meta row has anything in it. Checked here rather than left to
 * an empty `.cluster`, which would still be a `.stack` child and still take
 * the row's step under the masthead copy: `100-questions` has no kind, no
 * real programme and — being archived — one chip, but a row with none of the
 * three is possible and must render no element.
 */
const hasMeta = Boolean(kind || program || project?.archived)

/**
 * The participation path — draft copy stored per project (`participation`,
 * Aug 3). The fallback is the frozen source's own, so a row without the field
 * still gets an onward journey rather than a missing band.
 */
const participation = project?.participation
  ?? { title: 'Follow this project', ctas: ['Subscribe for updates', 'Read the latest'] }

/**
 * The stored action that *is* the microsite — `Open RANGE` on RANGE — or
 * `undefined`. Compared trimmed and case-folded against the project's own
 * name, because the drafts were generated as `Open {heading}` and
 * `100-questions` carries its heading's trailing space into the label.
 * External branch only; see D-52.5.
 */
const openLabel = project?.external_url
  ? participation.ctas.find(label => label.trim().toLowerCase() === `open ${name}`.toLowerCase())
  : undefined

/**
 * The participation path's actions, in stored order.
 *
 * On the external branch the microsite leads — under its stored `Open …`
 * label when the path has one, `Visit …` when it does not — and the stored
 * `Open …` label is not repeated after it. Every other action is label only,
 * so it renders as `bfButton`'s no-destination `<button>` (D-52.5).
 *
 * Built once at setup rather than inline in the template, so the array is not
 * reallocated on every render.
 */
const participationCtas: Cta[] = [
  ...(project?.external_url
    ? [{ label: openLabel?.trim() || `Visit ${name}`, href: project.external_url, external: true }]
    : []),
  ...participation.ctas
    .filter(label => label !== openLabel)
    .map(label => ({ label }))
]

/**
 * The microsite's address as a reader would type it — `rangeforecasting.org`
 * — for the preview's caption, or `null`.
 *
 * `null` for the two `#…` placeholders (D-52.2): `new URL` throws on a bare
 * fragment, and a caption must not name an address the project does not have.
 * The `www.` is dropped because it is not how anyone says a site's name.
 */
const micrositeHost: string | null = (() => {
  if (!project?.external_url) return null
  try {
    const url = new URL(project.external_url)
    return url.protocol.startsWith('http') ? url.hostname.replace(/^www\./, '') : null
  }
  catch {
    return null
  }
})()

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
    to the microsite that holds it. The masthead is the full template's —
    trail, `<h1>`, chips — and the overview opens the body under it, as the
    full template's description does: `bfProse`, its first paragraph the
    lede one step up, in the reading column (final pass, Sep 2026). It used
    to be the masthead's `tagline`, which set up to three paragraphs of
    small type on the paper, eleven lines of it at 375, while the full
    template's header held only the title and the chips. The two variants
    now open the same way.

    The only thing between the title and the microsite action is still the
    overview itself: no picture, and no band but the overview's. That brings
    the action as close to the top as the order allows; it does not promise
    it a place in the first screen. Where it lands depends on how
    long the overview runs: RANGE's runs six lines, and at 1280x900 its
    button sits just under the fold, and no external row's overview is short
    enough to lift it above. Doing that would mean setting the action before
    the overview, asking the reader to leave before the page has said what
    they are leaving for.
  -->
  <template v-if="project && project.external_url">
    <!--
      The masthead, on the reading column (header docblock). `bfPageHeader`
      renders this page's `<h1>` unconditionally, which is why the not-found
      branch below does not render it at all. No `chips` prop: see the meta
      row in the default slot.
    -->
    <bfPageHeader
      class="bf-project-header bf-detail-header bf-detail-column"
      measure="wide"
      label="Project overview (external)"
      :crumbs="crumbs"
      :heading="project.heading"
    >
      <!--
        The meta row — kind, programme, archive — under the `<h1>`, as on the
        full template. The programme chip takes its own programme's colour
        (`tone="program"`) and the site's one programme chip label
        (`programChipLabel`); the rest are the neutral pill.
      -->
      <div v-if="hasMeta" class="bf-detail-meta | cluster" data-gap="xs">
        <bfChip v-if="kind" tone="neutral">{{ kind }}</bfChip>
        <bfChip v-if="program" tone="program" :program="program.slug">{{ programChipLabel(program.name) }}</bfChip>
        <bfChip v-if="project.archived" tone="neutral">Archive</bfChip>
      </div>
    </bfPageHeader>

    <!--
      The overview — the description, falling back to the excerpt — as the
      body's opening: the same band, class and `bfProse` the full template's
      description uses, so its first paragraph is the same lede (the
      `.bf-project-body` rule below) in the same reading column. No lead
      image: every external row's `image` is its microsite, and the preview
      in the destination band below already shows it. Guarded, so a row with
      neither field renders no empty labelled band.
    -->
    <bfSection
      v-if="project.description || project.excerpt"
      class="bf-project-body bf-detail-column"
      label="Project body"
      measure="wide"
    >
      <bfProse :content="project.description ?? project.excerpt" />
    </bfSection>

    <!--
      The destination — the microsite callout and the participation path, one
      band (D-52.5): `bfCtaSection`, the same band the full template's
      participation path is, so the two branches read alike — heading, the
      supporting line capped at `normal`, one wrapping row of buttons, the
      first one primary. The microsite's own preview goes in its default
      slot, after the actions.

      `message` is the stored `microsite_cta` sentence; 15 of the 38 rows store
      `null` there, none of them external, but `?? undefined` costs nothing.
    -->
    <bfCtaSection
      class="bf-detail-column"
      measure="wide"
      label="Participation path"
      :heading="participation.title"
      :message="project.microsite_cta ?? undefined"
      :ctas="participationCtas"
    >
      <!--
        The preview. Every external row's `image` is its microsite, drawn as a
        browser window inside a transparent margin — so here the window is
        kept and the margin is not: the frame is the window's own shape, the
        image is trimmed to it (`ratio="auto"` keeps the file's proportion for
        the trim to measure against; see "The inset trim" in the styles), and
        the frame's edges are the column's. The window's content runs off its
        bottom edge in every file, so the frame draws a hairline and rounds
        its corners: the cut reads as a window, not as a picture that stopped.
        The caption is the address the window shows. The full template crops
        the window away entirely, because there the picture is a photograph.

        Not a second link: the primary action is two lines up, and a linked
        image would be a duplicate stop for keyboard and screen-reader users
        on the one band this page exists for.

        TODO(gh#234): `alt` is the heading, as on the lead image below — no
        separate description exists in the source and gh#222 forbids inventing
        one.
      -->
      <figure v-if="project.image" class="bf-project-preview">
        <div class="bf-project-preview__frame">
          <bfMedia :src="project.image" :alt="project.heading" ratio="auto" />
        </div>
        <figcaption v-if="micrositeHost">{{ micrositeHost }}</figcaption>
      </figure>
    </bfCtaSection>

    <!--
      The onward journey, rendered only when there is one. The frozen source
      keeps the band and guards the grid inside it, which leaves a heading over
      nothing for the 13 external rows with no related insights; the guard moves
      out to the band, as `/insights/:slug` (#50) and `[program].vue` already do.
      `bfGridInsights` brings its own `.grid[data-min-width]` (D9) — no column
      count is named here. `headingLevel` 3 keeps the card headings under the
      band's `<h2>` (BRIEF §5 rule 9). Site measure, not the column: it is a
      grid, and the article's related band sits on the same measure.
    -->
    <bfSection
      v-if="related.length"
      label="Related insights"
      :heading="`From ${name}`"
    >
      <bfGridInsights :insights="related" :heading-level="3" />
    </bfSection>
  </template>

  <!--
    Branch 2 — FULL. Masthead, body, participation, and the two conditional
    bands.
  -->
  <template v-else-if="project">
    <bfPageHeader
      class="bf-project-header bf-detail-header bf-detail-column"
      measure="wide"
      label="Project overview"
      :crumbs="crumbs"
      :heading="project.heading"
    >
      <div v-if="hasMeta" class="bf-detail-meta | cluster" data-gap="xs">
        <bfChip v-if="kind" tone="neutral">{{ kind }}</bfChip>
        <bfChip v-if="program" tone="program" :program="program.slug">{{ programChipLabel(program.name) }}</bfChip>
        <bfChip v-if="project.archived" tone="neutral">Archive</bfChip>
      </div>
    </bfPageHeader>

    <!--
      The body: the lead image, then the dataset description (Irene Jul 29
      docx), falling back to the CMS excerpt. Its first paragraph is set as
      the lede, a step up — the sentence that says what the project is.

      The lead image moved here from the masthead in the refined pass, where it
      sat inside the header's column on the paper ground; it now opens the body
      and breaks out of the reading column to the site measure, the insight
      article's own arrangement. `21/9` is kept: the rows' images are 1400x897
      legacy thumbnails framed in a browser window, and the crop is what keeps
      the window's address bar off a photograph. The crop takes the window's
      top and bottom; the inset trim in the styles takes its transparent
      sides, so the photograph's edges are the site measure's.

      `alt` is the heading, as the frozen source sets it: these are editorial
      lead images with no separate description in the source, and the heading
      is the only honest text available. No `image`, no element — the six full
      rows without one get no placeholder box.

      TODO(gh#234): the same defect as `insights/[slug].vue` and left alone
      for the same reason — the lead image's `alt` duplicates the `<h1>`. Not
      decorative, so `alt=""` would be a lie; gh#222 forbids inventing a
      string (D28, §8). #234 fixes it with the real field.

      Guarded, because since #186 `bfProse` renders nothing when both fields
      are null, and a band holding neither an image nor prose would be an empty
      labelled `<section>` paying a full `xl` stack gap. The Summer Enrichment
      year pages `2022`, `2023` and `2024` carry an image and no copy, so they
      keep the band for the picture alone.
    -->
    <bfSection
      v-if="project.image || project.description || project.excerpt"
      class="bf-project-body bf-detail-column"
      label="Project body"
      measure="wide"
    >
      <div v-if="project.image" class="bf-project-lead bf-detail-lead">
        <bfMedia :src="project.image" :alt="project.heading" ratio="21/9" />
      </div>

      <bfProse
        v-if="project.description || project.excerpt"
        :content="project.description ?? project.excerpt"
      />
    </bfSection>

    <!--
      The participation path (D-52.5), on the reading column so its heading
      starts on the same vertical as the prose above it. `class` and `measure`
      fall through `bfCtaSection`'s `$attrs` to its `bfSection` root.
    -->
    <bfCtaSection
      class="bf-detail-column"
      measure="wide"
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
      May 11 docx; that is recorded in the row's `source_note` and in the
      review seed, not printed on the page.
    -->
    <bfSection
      v-if="project.podcast"
      class="bf-detail-column"
      measure="wide"
      label="Episodes"
      :heading="project.podcast.title"
    >
      <div class="stack" data-gap="s">
        <p v-if="project.podcast.host">
          A podcast hosted by {{ project.podcast.host }}.
        </p>

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
            <p v-if="ep.description">{{ ep.description }}</p>
          </li>
        </ul>
      </div>
    </bfSection>

    <!--
      Cohort/year pages nested under this project through `parent_project` —
      real data, 20 rows across three parents. Guarded on `cohorts.length`, so
      the 15 childless projects grow no empty band.

      Rows, not the frozen source's chips (D-52.3), and not picture cards
      either: the band is an index of years, and fourteen `bfGridProjects`
      cards measured 2,500px at a desktop width and 5,800px on a phone — a
      page of secondary navigation longer than the project it belongs to.
      `bfCardRow` is the card family's dense line, with its stretched link,
      hover and focus; each row opens the cohort page that carries that
      year's picture and theme. On the reading column, because a list of
      links is not a grid.

      No `<li>` wrapper: `bfCard` renders the `<li>` itself and warns unless
      its parent is a list (`archive.vue` carries the full account of the
      hydration mismatch a wrapper causes). `role="list"` for the WebKit
      reason on the episode list above.

      "Cohorts" rather than the wireframe's "The Fellows": the band also holds
      the Summer Enrichment Series' years, whose participants are not fellows,
      and every child row is `kind: "cohort"`.

      No chips on these rows (`:kind-chip`, `:archive-chip`): every row's
      kind is `Cohort` and every past Fellowship class is archived, so the
      two chips sat identically on all fourteen rows and told them apart by
      nothing, under a band that already says "Cohorts".
    -->
    <bfSection
      v-if="cohorts.length"
      class="bf-detail-column"
      measure="wide"
      label="Outcomes / alumni"
      heading="Cohorts"
    >
      <ul class="stack" role="list" data-gap="xs">
        <bfCardRow
          v-for="c in cohorts"
          :key="c.slug"
          :item="c"
          :heading-level="3"
          variant="project"
          :kind-chip="false"
          :archive-chip="false"
        />
      </ul>
    </bfSection>

    <bfSection
      v-if="related.length"
      label="Related insights"
      :heading="`From ${name}`"
    >
      <bfGridInsights :insights="related" :heading-level="3" />
    </bfSection>
  </template>

  <!--
    Branch 3 — no such slug: the shared not-found layout (`bfNotFound`), so
    `/projects/no-such-slug` looks and works like `/no-such-page` — the
    heading block on the paper ground, a search field with the programs and
    indexes, the newest insights. This branch owns the page's only `<h1>`:
    `bfNotFound`'s first band is `bfEmptyState`, whose heading defaults to
    rank 1, and `bfPageHeader` is not rendered above it. Not `announced`,
    for the reason `insights/[slug].vue` gives (gh#224).
  -->
  <bfNotFound
    v-else
    heading="Unknown project"
    message="That project does not exist, or its address has changed."
    back-label="All projects"
    back-to="/projects"
    :programs="programs()"
    :insights="active.slice(0, 3)"
  />
</template>

<style scoped>
/*
 * The page's own rules: the body's lede (both templates), the inset trim of
 * both pictures, the microsite preview, and the episode list's reset.
 *
 * The reading column, the `<h1>`'s step, the meta row's step and the lead's
 * break-out are shared with the insight article and are not here: they are
 * `public/css/components/detail.css`, worn as `bf-detail-*` classes in the
 * template, so the two detail pages cannot drift apart.
 *
 * Scoped, so a rule reaching inside a child component's box goes through
 * `:deep()`: the band classes land on `bfSection`'s root `<section>`, which
 * carries this page's scope id as a child component's root, but its `.center`,
 * the `<h1>` and `bfProse`'s paragraphs do not.
 *
 * No colour literal, no `--_bf-*` hook written from outside its component and
 * no `:not()` (D-20.5).
 *
 * Wrapped in `@layer components` (gh#68). It was not, once, and the
 * cascade-layer gate in `scripts/check-routes.ts` caught it on its first run:
 * unlayered author CSS outranks every layer — so a `utils` or `overrides`
 * rule could never have beaten it, which is backwards. Exactly the defect
 * residual #98 / gh#101 was about, arriving through a page's own
 * `<style scoped>` rather than through the postcss polyfill.
 */
@layer components {
  /*
    The lede: the description's first paragraph, one step above the body,
    same face and weight — the size alone carries the role, as the article's
    lede does. Both templates: the external one's overview is this band
    too. `bfProse` stacks its blocks with `1em` of each block's own
    size, so the first stays flush and the second keeps its body gap.
  */
  .bf-project-body :deep(.bf-prose > p:first-child) {
    font-size: var(--size-1);
    line-height: 1.4;
  }

  .bf-project-body :deep(.bf-prose > p) {
    text-wrap: pretty;
  }

  /*
    The lead image breaks out of the reading column to the site measure,
    centred on the column — `detail.css`'s `.bf-detail-lead`, the article's
    own break-out. It stands a full step off the lede it introduces, rather
    than at the band's paragraph gap.
  */
  .bf-project-lead + * {
    margin-block-start: var(--space-l);
  }

  /*
    The inset trim — both pictures' shared geometry (header, "The reading
    column"). The legacy thumbnails draw their browser window inside a
    transparent margin: 60px a side and above it in the 1400x897 files,
    43px in the two 1000x641 ones — 4.3% of the file's width either way,
    76px (53px) below. `--_bf-project-trim` is the share of the file's width
    cut from each side: 4.6%, the margin plus the window's anti-aliased,
    rounded corner, so no row shows a transparent sliver at any width.

    The cut is made inside a clipped box, so the enlarged image is ink, not
    layout, and the page's scroll width never sees it. The rows that are
    plain photographs (the Transponder cover, the newest cohort pages) have
    no margin and lose the same 4.6% a side of picture, which a crop this
    wide already takes far more of.
  */
  .bf-project-lead,
  .bf-project-preview__frame {
    --_bf-project-trim: 0.046;

    overflow: clip;
  }

  /*
    The lead: `21/9` already crops the window's top and bottom away (the
    file's middle ~61% of its height survives), so only the sides are left
    to trim, and a scale about the centre does it — `object-fit: cover`
    has already sized the image to the box's width.
  */
  .bf-project-lead > .bf-media {
    scale: calc(1 / (1 - 2 * var(--_bf-project-trim)));
  }

  /*
    The microsite preview stands a step off the actions — it illustrates
    where they go, it is not one of them — and the `<figure>`'s user-agent
    inline margins (40px a side) are zeroed so it starts on the column's
    vertical. The caption is the address in the muted ink the site uses for
    secondary lines, a step under the frame's bottom edge.
  */
  .bf-project-preview {
    margin-block: var(--space-l) 0;
    margin-inline: 0;
  }

  /*
    The frame is the window, not the file: `1.69` is the window's own
    proportion (1280 by 761 inside the 1400x897 file) less the trim at its
    top and a hair at its bottom. The window's content always runs off that
    bottom edge, so the frame draws it: the card family's picture box — its
    `--border-radius-m` corner and the light ground seen while a file
    arrives — plus a hairline in the same tint, which is what makes the cut
    read as the window's edge. `flow-root` so the image's negative top margin cannot
    collapse through the frame, and `min-block-size: 0` because an
    `aspect-ratio` box that is not a scroll container (`clip` is not) would
    otherwise grow to the image's height and undo the crop.

    The image is sized off the frame so the window fills it: wider by the
    two side trims, pulled up and left by one. A margin percentage resolves
    against the frame's width in both axes, and the file's top margin equals
    its side one, so one value places both.
  */
  .bf-project-preview__frame {
    display: flow-root;
    aspect-ratio: 1.69;
    min-block-size: 0;
    border: var(--border-width-thin) solid var(--color-base-super-light);
    border-radius: var(--border-radius-m);
    background-color: var(--color-base-super-light);
  }

  /*
    `aspect-ratio: auto 1400 / 897` gives the image its box **before** the
    file arrives — the legacy thumbnails' proportion — and hands over to the
    file's own once it has loaded (`auto` first). Without it an unloaded
    image is 0px tall, and the negative top margin below puts that 0px box
    above the frame's clipped edge, where the browser's lazy loader never
    sees it intersect: the preview never loaded, on every external page
    (found by the shared pass, Sep 2026). One class more than `bfMedia`'s
    scoped `.bf-media` rule, which writes `aspect-ratio` from the inline
    `--_bf-media-ratio: auto`.
  */
  .bf-project-preview__frame > .bf-media {
    --_bf-project-trim-offset: calc(-100% * var(--_bf-project-trim) / (1 - 2 * var(--_bf-project-trim)));

    aspect-ratio: auto 1400 / 897;
    inline-size: calc(100% / (1 - 2 * var(--_bf-project-trim)));
    max-inline-size: none;
    block-size: auto;
    margin-block-start: var(--_bf-project-trim-offset);
    margin-inline-start: var(--_bf-project-trim-offset);
  }

  .bf-project-preview figcaption {
    margin-block-start: var(--space-2xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-ui);
    font-size: var(--size--1);
  }

  /*
    The episode list reset: the list is a `.stack`, whose rhythm and zeroed
    padding are the composition layer's, but the markers are the browser's
    and no primitive removes them. The frozen source writes the same two
    properties as an inline `style` attribute; here they are a class.
  */
  .bf-project-episodes {
    padding-inline-start: 0;
    list-style: none;
  }
}
</style>
