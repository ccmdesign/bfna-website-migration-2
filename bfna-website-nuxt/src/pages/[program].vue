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
 * - **The masthead uses a 16:8 desktop frame.** The breadcrumb leads the
 *   program name and action on the left, with opening copy on the right. Mobile
 *   stacks those elements in reading order over the same photograph.
 * - **The remaining intro** sits in a centered reading column below the hero.
 * - **Each band opens on the section rule** `/projects` draws — a hairline with
 *   the program's colour for its first `--space-xl`, `bfSection`'s
 *   `data-rule="program"` on both pages — so a hub and the index that links
 *   to it read as one system. The colour is `--color-program`, which
 *   resolves here because `useProgramTheme` scopes `<html>`.
 * - **Cards retain their grid width**, including bands with only one or two
 *   items. Empty Projects bands are omitted; Insights links remain whenever
 *   their filtered feeds hold anything.
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
 * `bfHeroMedia` is presentational-only (D8) and takes a path; the mapping
 * from a programme to its art direction is page-level composition, and this
 * page is its only consumer. `Record<string, string>` rather than a
 * `PROGRAM_SLUGS`-keyed type: a slug with no photograph yet resolves to
 * `undefined`, leaving the media component's plain scrim behind the copy.
 */
const HERO_IMAGE: Readonly<Record<string, string>> = {
  democracy: '/images/hero/democracy.jpg',
  'future-leadership': '/images/hero/future-leadership.jpg',
  'transatlantic-relations-global-challenges': '/images/hero/politics-society.jpg'
}

/**
 * The first intro paragraph belongs in the hero; the remaining paragraphs
 * form the reading column below. A missing intro falls back to the tagline.
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

/** Two desktop rows, newest first across all publication years. */
const RECENT_LIMIT = 6
const recent: Insight[] = programInsights.slice(0, RECENT_LIMIT)

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
 * `insightsHasFeed` below decides whether it renders.
 */
const showInsights = program?.slug !== 'future-leadership'

/** The archive link's counter — archived insights in this program. */
const archivedCount = program ? archivedCountByProgram(program.name) : 0

/** Keep the section's feed links available even when only archived posts remain. */
const insightsHasFeed = programInsights.length > 0 || archivedCount > 0

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
    <!-- The hero follows the program sketch: identity left, opening copy right. -->
    <bfSection
      class="bf-hub-hero"
      label="Hub header"
      aria-labelledby="program-heading"
      data-scrim="full"
      gap="m"
      padded
    >
      <template #bleed>
        <bfHeroMedia :src="HERO_IMAGE[program.slug]" alt="" />
      </template>

      <bfBreadcrumb :items="[{ label: 'Home', to: '/' }, { label: 'Programs' }, { label: program.name }]" />

      <div class="switcher bf-hub-hero__columns" data-threshold="s" data-gap="xl">
        <div class="stack bf-hub-hero__identity" data-gap="m">
          <h1 id="program-heading" class="bf-hub-hero__heading">{{ program.name }}</h1>
          <div v-if="projects.length">
            <bfButton to="#projects" variant="primary" size="l">Explore our work</bfButton>
          </div>
        </div>
        <p v-if="intro.length" class="bf-hub-hero__intro">{{ intro[0] }}</p>
      </div>
    </bfSection>

    <bfSection v-if="intro.length > 1" class="bf-hub-intro" label="Program intro">
      <div class="stack bf-hub-intro__body" data-gap="s" data-measure="narrow">
        <p v-for="(p, index) in intro.slice(1)" :key="index">{{ p }}</p>
      </div>
    </bfSection>

    <!--
      Zone 3 — the projects in this program. `id="projects"` is the CTA's
      anchor target and passes through `bfSection`'s attribute allowlist;
      `data-rule="program"` is `bfSection`'s section rule, and the jump
      clears the sticky bar through `base/reset.css`'s `:target` margin.

      Omitted when empty. Every project uses the shared grid and its own
      available main image. A short band keeps the same track widths as a full
      one. Heading level 3 keeps project titles under the section heading.
    -->
    <bfSection
      v-if="projects.length"
      id="projects"
      data-rule="program"
      label="Projects in this area"
      heading="Projects"
    >
      <bfGridProjects :projects="projects" :heading-level="3" />
    </bfSection>

    <!--
      The Transponder product band is not here: it moved to the homepage,
      between Projects and Insights (see `pages/index.vue`).
    -->

    <!--
      Zone 4 — recent insights, active tier only, six at most across all years. Conditional
      per hub (D10, `showInsights`) and on its links having a feed to open
      (`insightsHasFeed`) — not on its cards. `id="insights"` makes the band
      linkable, like its neighbour.

      Cards share one grid without year headings; the feed links follow below.

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
      <div class="stack" data-gap="m">
        <bfGridInsights
          v-if="recent.length"
          :insights="recent"
          :extra-chips="insightChips"
          :heading-level="3"
        />

        <div class="cluster" data-gap="m">
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
@layer components {
  .bf-hub-hero {
    --_bf-section-padding-block: var(--space-2xl);

    position: relative;
    isolation: isolate;
    display: grid;
    align-content: center;
    color: var(--color-text-inverse);
  }

  .bf-hub-hero__columns {
    align-items: baseline;
  }

  .bf-hub-hero__columns > * {
    min-inline-size: 0;
  }

  .bf-hub-hero__heading {
    font-size: clamp(var(--size-2), 4.5vw, var(--size-5));
    text-wrap: balance;
  }

  .bf-hub-hero__intro {
    margin: 0;
    font-size: clamp(1rem, 1.75vw, var(--size-1));
    line-height: 1.4;
    text-wrap: pretty;
  }

  .bf-hub-hero :deep(.bf-breadcrumb) {
    --_bf-breadcrumb-separator-color: var(--color-text-inverse);
    --_bf-breadcrumb-focus-color: var(--color-text-inverse);
  }

  .bf-hub-hero :deep(.bf-button[data-variant='primary']) {
    border-color: var(--color-text-inverse);
    background: var(--color-surface-page);
    color: var(--color-accent);
  }

  .bf-hub-hero :deep(:focus-visible),
  .bf-hub-hero :deep(.bf-button:focus-visible) {
    outline-color: var(--color-text-inverse);
  }

  .bf-hub-intro__body {
    margin-inline: auto;
  }

  @media (min-width: 48rem) {
    .bf-hub-hero {
      --_bf-section-padding-block: var(--space-xl);

      aspect-ratio: 16 / 8;
    }
  }

  @media (width < 48rem) {
    .bf-hub-hero__columns {
      flex-flow: column nowrap;
      align-items: stretch;
    }

    .bf-hub-hero__columns > * {
      flex: none;
    }
  }
}
</style>
