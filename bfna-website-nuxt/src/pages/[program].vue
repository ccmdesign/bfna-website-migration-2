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
 * ## The refined pass (Sep 2026)
 *
 * The hub keeps its bands, their order, every string and the one CTA. What
 * changes is where the reading happens and what a short band looks like:
 *
 * - **The masthead is the program's name.** The trail, the `<h1>` and "Explore
 *   our work" over the photograph — and no prose. The intro used to run there
 *   as ~180 words of white type on a scrim, which was the whole first screen
 *   of a phone and the weakest reading surface on the page.
 * - **The intro is its own zone**, on the page ground in dark ink: the first
 *   paragraph as the lede, a step up, and the rest as body beside it — the
 *   site's one lede style, the insight and project pages' (final pass). Every program's intro is written that way round — the
 *   stakes first, then what the Foundation does about them — so the first
 *   paragraph is the one that should be read first. At a desktop width the
 *   two sit on the projects grid's two columns, so the page below the
 *   masthead has one column line from the intro to the last band.
 * - **Each band opens on the section rule** `/projects` draws — a hairline with
 *   the program's colour for its first `--space-xl`, `bfSection`'s
 *   `data-rule="program"` on both pages — so a hub and the index that links
 *   to it read as one system. The colour is `--color-program`, which
 *   resolves here because `useProgramTheme` scopes `<html>`.
 * - **A band is shaped by how much it holds** — see `bandShape` below. None
 *   and Projects is omitted, CTA and all, while Insights keeps its heading and
 *   its links for as long as the feeds they open hold anything; one and the
 *   item leads the row instead of sitting in a third of it; two and the pair
 *   fills the row.
 * - **The insight links say where they go.** "All … insights" counts the
 *   feed it opens, not the hub's own cut of it, and "Include archived" opens
 *   that same feed with the archive switched on, which is what its label and
 *   its count describe. On the Democracy hub neither held before: the first
 *   read "(1)" over a feed of 13, the second opened every program's archive.
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

const { programBySlug, programs } = await useBfPrograms()
const { gridProjectsByProgram, projectBySlug } = await useBfProjects()
const { activeByProgram, archivedCountByProgram, active } = await useBfInsights()

/**
 * The hub's own document, or `undefined`.
 *
 * `validate` has already rejected every slug outside the collection, so this
 * is `undefined` only if a program's JSON disappeared between the glob that
 * built `PROGRAM_SLUGS` and the collection query — which is the defensive case
 * `bfNotFound` covers at the bottom of the template, not the primary 404
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
 * branch is the defensive one `bfNotFound` covers below, and it correctly
 * leaves the neutral `:root` default in place.
 *
 * It is also what colours the section rule on the Projects and Insights bands
 * (`--color-program`, see the style block): one scope, the whole page.
 */
useProgramTheme(program?.slug)

/**
 * The hub's hero photograph, by slug. gh#253.
 *
 * ## Why a local file and not `program.image`
 *
 * Every `content/bf/programs/*.json` carries an `image`, and every one of them
 * is an absolute Directus URL. `bfMedia` hands those to the browser verbatim
 * and deliberately does **not** route them through `NuxtImg` (its `isAbsolute`
 * predicate), because the module's `ipx` provider rewrites a URL into a
 * `/_ipx/…` route. For a **local** file `nuxt generate` prerenders those
 * variants into the static output, so they resolve; for a remote one there
 * would be nothing to prerender. So a Directus URL here would mean one
 * unsized bitmap and no srcset on the largest contentful paint of the route,
 * while a local path plus `bfHeroMedia`'s `sizes="100vw"` gets width
 * descriptors against `nuxt.config.ts`'s `screens` ladder. The files below
 * are local, were already on disk, and were read by nothing until now.
 *
 * ## The filenames carry the OLD taxonomy — read the mapping, not the names
 *
 * `politics-society.jpg` is mapped to
 * `transatlantic-relations-global-challenges` **deliberately**. Four topics
 * collapsed into three Programs (BRIEF §8), and Politics & Society is the one
 * that merged into Transatlantic Relations & Global Challenges; that file is
 * the nearest asset on disk for the merged programme. It is a stand-in chosen
 * on purpose, not a filename that happens to be close, and it is the one thing
 * in this item a human should confirm rather than inherit — see
 * `docs/decisions/gh253-hero-scrim-architecture.md`.
 *
 * ## Why it lives here
 *
 * `bfPageHeader` is presentational-only (D8) and takes a path; the mapping
 * from a programme to its art direction is page-level composition, and this
 * page is its only consumer. `Record<string, string>` rather than a
 * `PROGRAM_SLUGS`-keyed type: a slug with no photograph yet must resolve to
 * `undefined` and render a header with no band, which is what the other four
 * `bfPageHeader` routes do today.
 */
const HERO_IMAGE: Readonly<Record<string, string>> = {
  democracy: '/images/hero/democracy.jpg',
  'future-leadership': '/images/hero/future-leadership.jpg',
  'transatlantic-relations-global-challenges': '/images/hero/politics-society.jpg'
}

/**
 * The program intro, one entry per paragraph — the reading zone under the
 * masthead (refined pass; the header docblock says why it left the photo).
 *
 * `paragraphs()` splits the stored `intro` on blank lines. The first entry is
 * set as the lede and the rest as body, in the template. A program saved with
 * no `intro` falls back to its one-line `tagline`, so the zone still says what
 * the program is; a program with neither renders no zone at all.
 */
const intro: string[] = program
  ? (paragraphs(program.intro).length ? paragraphs(program.intro) : paragraphs(program.tagline))
  : []

/**
 * Active, on-site projects in this program, in the client's grid order —
 * podcasts and external-only products are pruned inside the composable, not
 * here.
 */
const projects = program ? gridProjectsByProgram(program.name) : []

/**
 * Every active insight in this program — the set `/insights?area=<slug>`
 * lists, and so the number the "All … insights" link states.
 *
 * `activeByProgram` takes the display **name**, not the slug.
 */
const programInsights: Insight[] = program ? activeByProgram(program.name) : []

/** The Insights band's cap: three rows of the insights grid's three columns. */
const RECENT_LIMIT = 9

/**
 * The insights this hub actually shows — at most `RECENT_LIMIT`, newest first.
 *
 * The filter is the frozen source's, ported verbatim and scoped the same way:
 * **the Democracy hub only** shows 2026 releases (Irene, Aug 5 widget
 * feedback); the other two programs keep the whole active tier. It is a
 * page-level rule rather than a composable or normaliser one for the same
 * reason D10's Insights switch is — there is no field in `bfInsights` that
 * says "Democracy shows one year", and inventing one would write a client
 * decision into the data with no upstream authority. Recorded as D-48.3.
 *
 * It narrows the band's **cards** and nothing else. The link under them opens
 * the whole program feed, so its count is `programInsights.length`: the old
 * label counted this cut and read "All Democracy insights (1)" over a feed of
 * 13. Nor does it decide whether the band renders — `insightsHasFeed` does.
 */
const recent: Insight[] = programInsights
  .filter(i => program?.slug !== 'democracy' || (i.publish_date ?? '').startsWith('2026'))
  .slice(0, RECENT_LIMIT)

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
 *
 * The band's own emptiness is a separate question, not folded into this flag:
 * `insightsHasFeed` below decides whether it renders, `bandShape` how its
 * cards lay out.
 */
const showInsights = program?.slug !== 'future-leadership'

/** The archive link's counter — archived insights in this program. */
const archivedCount = program ? archivedCountByProgram(program.name) : 0

/**
 * Whether the Insights band's links have a feed to open — the band's own
 * condition beside `showInsights`, and deliberately not its card count.
 *
 * The band is the hub's only route to the program's insights: the whole feed
 * and that feed with the archive switched on. Both are wider than `recent`,
 * which on the Democracy hub is one year's cut and can hold nothing while the
 * feed holds a dozen — the year turns over, or the one current piece is
 * unpublished. So an empty cut drops the band's cards, not the band: its
 * heading, its anchor and its links stay while either feed has anything in
 * it. `recent` is drawn from `programInsights`, so the feed's count covers
 * the cut's.
 */
const insightsHasFeed = programInsights.length > 0 || archivedCount > 0

/**
 * How a band lays out what it holds — the hub's one rule for a short band.
 *
 * The grids resolve their column count from the width (D9), so at a desktop
 * width a band's first row has two tracks (projects) or three (insights)
 * whatever it holds. A band with fewer items than that left the rest of the
 * row as empty tracks — the Democracy hub's one 2026 insight sat in a third of
 * the row with two blank thirds beside it, and read as a grid that had failed
 * to load. So:
 *
 * | holds | shape | what renders |
 * |---|---|---|
 * | 0 | `none` | no cards. **Projects**: no band — no heading over nothing, and no CTA pointing at it. **Insights**: the cards go but the links stay, under the band's heading, while `insightsHasFeed` holds — the cut the cards show is narrower than the feeds the links open |
 * | 1 | `lead` | the item takes the row (`span="full"`); in the Insights band it takes the first of two columns and the band's links the second |
 * | 2 | `pair` | two tracks, so the pair fills the row — the insights grid is given the projects grid's own `xl` floor |
 * | 3+ | `grid` | the grid's own default |
 *
 * A lead is not a feature. A lone project is set text-only (`:media="false"`):
 * the card family's wide picture layout is the homepage's lead device, and at
 * the full row a 3:2 picture would stand taller than the masthead. A lone
 * insight keeps its picture, because at half the row it lays out as an
 * ordinary media card.
 *
 * Nothing reorders: `grid_order` and `publish_date` still decide the sequence,
 * and the shape changes only the widths.
 */
type BandShape = 'none' | 'lead' | 'pair' | 'grid'

const bandShape = (count: number): BandShape =>
  count === 0 ? 'none' : count === 1 ? 'lead' : count === 2 ? 'pair' : 'grid'

const projectsShape = bandShape(projects.length)
const insightsShape = bandShape(recent.length)

/**
 * The item a `lead` band renders on its own. Named rather than indexed in the
 * template so the `v-if` that renders it can narrow it from `undefined`, which
 * `noUncheckedIndexedAccess` makes every indexed read.
 */
const leadProject = projects[0]
const leadInsight = recent[0]

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
      Zone 1 — the masthead (GGS hub template): where you are, the program's
      name, and the one action. No `tagline`: the program's prose is Zone 2,
      on the page ground (refined pass, see the header docblock).

      **The trail ends on the program**, not on "Programs". `bfBreadcrumb`
      marks its last crumb `aria-current="page"` positionally, so the old
      two-entry trail told a screen reader this page *was* "Programs" — the
      #188 defect `/projects` fixed the same way. "Programs" stays, unlinked,
      as the category it names: there is no programs index to link to.

      The photograph is `HERO_IMAGE[program.slug]` (gh#253) — a local file, not
      the programme document's own Directus `image`; see the record above for
      why, and for why the Transatlantic hub is served by a file still named
      after the old Politics & Society topic. `scrim` is left at its `full`
      default: the flat 0.70 navy that makes white type clear 4.5:1 over any
      photograph, and the only treatment under which programme colour is
      allowed to appear here at all — as an opaque fill, never as text.

      The CTA is slot content, wrapped in a `<div>`: `bfPageHeader` composes
      `bfSection`, whose inner box is a `.stack`, and a bare anchor as a stack
      child stretches to the full measure. The wrapper is the frozen source's
      own, kept for the same reason. Copy is Irene's (Aug 5): "Explore our
      work", pointing at the Projects band below — so it renders only when
      that band does.
    -->
    <bfPageHeader
      label="Hub header"
      :crumbs="[{ label: 'Home', to: '/' }, { label: 'Programs' }, { label: program.name }]"
      :heading="program.name"
      :image="HERO_IMAGE[program.slug]"
    >
      <div v-if="projectsShape !== 'none'">
        <bfButton to="#projects" variant="primary">Explore our work</bfButton>
      </div>
    </bfPageHeader>

    <!--
      Zone 2 — the program intro, the page's reading. No heading: the `<h1>`
      above is this prose's title, and a second one would only restate it.

      A `.switcher` of two: the lede, then the rest of the intro as body.
      `data-gap="m"` is the projects grid's own gap, so above the primitive's
      768px of band the two columns land exactly on that grid's two tracks;
      below it they stack, lede first. The body's paragraphs are keyed by
      index because two paragraphs of one intro may share their first words.

      The lede carries `data-measure="narrow"` (60ch in its own face) for the
      intro that is one paragraph long: alone in the switcher it would
      otherwise run the band's full width. Beside the body it is narrower
      than that already, and the cap is inert.
    -->
    <bfSection v-if="intro.length" class="bf-hub-intro" label="Program intro">
      <div class="switcher bf-hub-intro__columns" data-gap="m">
        <p class="bf-hub-intro__lede" data-measure="narrow">{{ intro[0] }}</p>
        <div v-if="intro.length > 1" class="stack" data-gap="s">
          <p v-for="(p, index) in intro.slice(1)" :key="index">{{ p }}</p>
        </div>
      </div>
    </bfSection>

    <!--
      Zone 3 — the projects in this program. `id="projects"` is the CTA's
      anchor target and passes through `bfSection`'s attribute allowlist;
      `data-rule="program"` is `bfSection`'s section rule, and the jump
      clears the sticky bar through `base/reset.css`'s `:target` margin.

      Omitted when it would hold nothing (`bandShape`). A lone project leads
      the row as a full-width text card, in a list of its own: `bfGridProjects`
      decides one width for every card it renders, and this is the one case
      where the page decides instead. The `<ul>` is the grid's own markup —
      `role="list"` for the reason that file gives, and the same `xl` floor —
      so a lone card sits in exactly the structure its siblings would have.

      Otherwise `bfGridProjects` brings its own `.grid[data-min-width]` (D9) —
      this page names no column count — and a pair already fills its two
      tracks. `headingLevel="3"` keeps the card headings under the band's
      `<h2>` (BRIEF §5 rule 9); it is also the wrapper's default, stated so the
      next reader does not have to know that.
    -->
    <bfSection
      v-if="projectsShape !== 'none'"
      id="projects"
      data-rule="program"
      label="Projects in this area"
      heading="Projects"
    >
      <ul
        v-if="projectsShape === 'lead' && leadProject"
        class="grid"
        role="list"
        data-min-width="xl"
        data-gap="m"
      >
        <bfCardProject
          :project="leadProject"
          span="full"
          :media="false"
          :heading-level="3"
        />
      </ul>
      <bfGridProjects v-else :projects="projects" :heading-level="3" />
    </bfSection>

    <!--
      The Transponder product band is not here: it moved to the homepage,
      between Projects and Insights (see `pages/index.vue`).
    -->

    <!--
      Zone 4 — recent insights, active tier only, nine at most. Conditional
      per hub (D10, `showInsights`) and on its links having a feed to open
      (`insightsHasFeed`) — not on its cards. `id="insights"` makes the band
      linkable, like its neighbour.

      The wrapper swaps its composition primitive by shape, not its content.
      A lead is a `.switcher` — the insight in the first column, the band's
      two links in the second, stacking below the primitive's 768px of band.
      Its `m` gap is the grid's, so the two columns fall on the same lines as
      the projects grid above and the intro's two columns above that. Every
      other shape is a `.stack`: the grid, then the links under it, exactly as
      before. At `none` the grid is skipped and the stack holds the links
      alone — the band is its heading, its rule and the two ways into the
      feed, because an empty year's cut says nothing about the feed itself.

      The two links are the frozen source's pair, retargeted at what they say.
      "All … insights" opens the program's filtered feed and counts it.
      "Include archived" opens the same feed with `archive=1` — `/insights`'
      own toggle, whose label this one already was — so the archived count
      the link promises is the number of rows it adds. It used to open
      `/archive`, which lists every program's archive and not this one's.

      Both are the site's "more of this" text link (`.bf-more-link`,
      `public/css/components/more-link.css`), the home page's "All insights"
      under its cards, with the drawn arrow. They were outlined `bfButton`s
      with a typed ` →` on the second only (final pass, Sep 2026): the one
      band on the site that ended on boxes where every other ends on a link.
    -->
    <bfSection
      v-if="showInsights && insightsHasFeed"
      id="insights"
      data-rule="program"
      label="Recent insights"
      heading="Insights"
    >
      <div
        :class="insightsShape === 'lead' ? 'switcher bf-hub-insights--lead' : 'stack'"
        data-gap="m"
      >
        <ul
          v-if="insightsShape === 'lead' && leadInsight"
          class="grid"
          role="list"
          data-min-width="l"
          data-gap="m"
        >
          <bfCardInsight
            :insight="leadInsight"
            span="full"
            :extra-chips="insightChips(leadInsight)"
            :heading-level="3"
          />
        </ul>
        <bfGridInsights
          v-else-if="insightsShape !== 'none'"
          :insights="recent"
          :min-width="insightsShape === 'pair' ? 'xl' : undefined"
          :extra-chips="insightChips"
          :heading-level="3"
        />

        <div class="cluster bf-hub-insights__links" data-gap="m">
          <NuxtLink class="bf-more-link" :to="`/insights?area=${program.slug}`">
            All {{ program.name }} insights ({{ programInsights.length }})<span class="bf-more-link__arrow" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink class="bf-more-link" :to="`/insights?area=${program.slug}&archive=1`">
            Include archived ({{ archivedCount }})<span class="bf-more-link__arrow" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </bfSection>

    <!--
      The "Other programs" cross-links row was removed from all three hubs
      (Claudio, Sep 2, widget comment #136 — BF-173) and is not reinstated.
    -->
  </template>

  <!--
    Defensive only. `validate` answers the real "not a program" case with a 404
    before this page renders — `error.vue`, which renders `bfNotFound` — and
    this covers a slug that passed the guard but has no document behind it,
    with the same layout, so every not-found path on the site is one page.
    Its first band owns the page's one `<h1>`.
  -->
  <bfNotFound
    v-else
    heading="Unknown program"
    message="That program does not exist, or has been renamed."
    back-label="Back to home"
    back-to="/"
    :programs="programs()"
    :insights="active.slice(0, 3)"
  />
</template>

<style scoped>
/*
  The hub's own skin — the intro's lede and the Insights band's lead column.
  Everything else on the route is `bf-*` and styles itself, the section rule
  on the two bands included (`bfSection`'s `data-rule`, which `/projects`
  wears too); nothing below reaches into a component's internals.

  Wrapped in `@layer components`, like every page-level rule (gh#68 — an
  unlayered page rule outranks every layer). All colour is semantic or
  programme tokens; no `:not()` (D-20.5).

  Scoped selectors land on the band roots because a child component's root
  element carries its parent's scope id; `bfSection`'s root is the
  `<section>`, so `.bf-hub-intro` matches there.
*/
@layer components {
  /*
    The intro's two columns share a first baseline, so the body's first line
    sits on the lede's rather than on its box's top edge — the two sizes put
    their first lines at different heights otherwise. Inert once the
    switcher stacks.
  */
  .bf-hub-intro__columns {
    align-items: baseline;
  }

  /*
    The lede — the intro's first paragraph, one step above the body. The
    site's one lede, the insight's (`.bf-article-lede`), the project page's
    and `/about`'s: the body's own face and weight (IBM Plex Sans light),
    `--size-1`, leading 1.4, capped at 60ch by `data-measure="narrow"`. It
    was set in Newsreader until the final pass, the one body-copy lede on
    the site in the display face, beside a Plex column. In its column it
    sets about forty characters a line at a desktop width, a lede's length
    rather than a body's.
  */
  .bf-hub-intro__lede {
    font-size: var(--size-1);
    line-height: 1.4;
    text-wrap: pretty;
  }

  /*
    The links, as the second column of a lead insight (`bandShape` →
    `lead`). The `.switcher` shares the row equally, so the card takes half
    of it — an ordinary card's measure, and under the 48rem at which `bfCard`
    would switch a full-span card to its picture-overlay layout. The cluster
    starts on the card's top edge instead of stretching to its height; in
    every other shape it is the row under the grid it always was (at `none`,
    the band's only row), and this rule is inert.
  */
  .bf-hub-insights--lead > .bf-hub-insights__links {
    align-self: flex-start;
  }
}
</style>
