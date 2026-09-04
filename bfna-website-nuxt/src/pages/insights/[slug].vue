<script setup lang="ts">
/**
 * `/insights/:slug` — one insight (issue 50 / gh#59).
 *
 * Descends from `src/pages/wireframes/insights/[slug].vue`, which is frozen
 * (D2): read for its band order and its copy decisions, never edited, and
 * nothing here imports from it. It retires **no** legacy file. The catch-all
 * `pages/[...slug].vue` compiles to `/:slug(.*)*` and this file to
 * `/insights/:slug()`; vue-router ranks the static segment above the
 * catch-all, so `/insights/<slug>` simply starts being answered here and every
 * other route the catch-all holds is untouched. Retiring it is #58's job, and
 * the redirect map is #57's.
 *
 * ## What changed on the way over, and why
 *
 * Four things, each because the wireframe had no way to say the real thing:
 *
 * 1. **The byline is real.** The frozen page writes `By [author]` when
 *    `authors` is empty — wireframe scaffolding, not copy, and the spec's
 *    "out of scope" line is explicit that a byline is in only when the data
 *    carries an author. So `bfByline` (#38) renders when it does, and a bare
 *    `bfTime` when it does not. 20-odd rows also carry no `publish_date`;
 *    `bfTime` renders no element for those, so the header's meta row can end
 *    up empty and renders nothing at all rather than an empty cluster.
 * 2. **The archive banner's forward link goes somewhere.** The frozen page
 *    writes `href="#"`; here it is the program hub at `/{program-slug}`, which
 *    `pages/[program].vue` serves.
 * 3. **The download link goes somewhere too** — `insight.download` is a real
 *    asset URL on the rows that carry one, not a placeholder.
 * 4. **The wireframe's HTML-stripping render helper is gone.** Strip and
 *    entity decode happen in the build-time normaliser now (D3), so the
 *    excerpt is rendered as the stored string. The spec greps this file for
 *    the absence of that call, so it is not named here either.
 *
 * ## The programme value is not always a programme (F3 of BF-218)
 *
 * 52 of the 354 items carry a `program` that is not one of the three: 31 read
 * `PENDING-Q3 (Digital World retired)`, 12 `RE-TAG (was fake category:
 * Podcasts)`, 9 `RE-TAG (was fake category: Archives)`. These are migration
 * signals addressed to the client, and a reader must never be shown one.
 *
 * So `programName` below resolves to a real `bfPrograms` row's `name` or to
 * `undefined`, and three things hang off that single answer: the programme
 * **chip**, the banner's **forward link**, and the related band's **heading**,
 * which falls back to `More insights`. The related band itself still renders —
 * those 52 items do have siblings, and cutting the onward journey would be a
 * worse answer than a generic heading — but only when the list is non-empty.
 * Recorded as D-50.2.
 *
 * ## Data
 *
 * A page may call a composable; a `bf-*` component may not (D8). Every read on
 * this route is one of the three awaited calls below, and every component in
 * the template is handed entities as props. The imports are explicit because
 * Nuxt scans `composables/` one directory deep for `index` files only, and
 * these live at `composables/data/useBf*.ts`.
 */
import type { Insight } from '~/types/bf-contracts'
import { useBfInsights } from '~/composables/data/useBfInsights'
import { useBfPages } from '~/composables/data/useBfPages'
import { useBfPrograms } from '~/composables/data/useBfPrograms'
import { useBfProjects } from '~/composables/data/useBfProjects'
import { useProgramTheme } from '~/composables/useProgramTheme'
import { formatLabel, monthYear } from '~/utils/format'

defineOptions({ name: 'InsightDetailPage' })

definePageMeta({ layout: 'bf-default' })

const route = useRoute()

const { bySlug, activeByProgram } = await useBfInsights()
const { pageBySlug } = await useBfPages()
const { programs } = await useBfPrograms()
const { projectBySlug } = await useBfProjects()

/**
 * The document, or `undefined` for a slug that is not in the collection.
 *
 * Slugs are unique across the 354 since #151: the two collisions were
 * disambiguated with a `-2` suffix and carry `duplicate_of` pointing at the
 * slug they collided with, so `uncivil-war-2` and
 * `graphic-images-autocrats-and-the-use-of-power-2` both resolve to their own
 * document rather than shadowing the original.
 */
const insight = bySlug(route.params.slug as string)

/**
 * The programme, **only if it is one** — see the block comment above.
 * `activeByProgram` takes the display name, not the slug, so the match is on
 * `name`; `program` (the row) is what the banner's forward link needs.
 */
const program = insight?.program
  ? programs().find(p => p.name === insight.program)
  : undefined

/** The name a reader may be shown, or nothing. */
const programName = program?.name

/**
 * The band's own title, added once by `bf-default`'s `titleTemplate`. A row
 * with no heading is a content defect, not a nameless page, so the fallback
 * names the route rather than leaving the site title alone.
 */
useHead({ title: () => insight?.heading ?? 'Insight' })

/**
 * The programme colour scope (gh#252). `data-program` lands on `<html>` — the
 * only placement that reaches every band without the wrapper `<div>` this
 * template's comment forbids; `useProgramTheme` carries the full argument.
 *
 * It is handed `program?.slug`, the row resolved above, and **not** the raw
 * `insight.program` string. That is the same D-50.2 guard the chip, the
 * banner's forward link and the related band's heading already hang off, for
 * the same reason: 52 of the 354 rows store a migration signal there rather
 * than a programme, and those must resolve the neutral `:root` default. The
 * related band still runs on the raw string, so a mis-tagged row keeps its
 * siblings while losing only the colour it was never entitled to.
 */
useProgramTheme(program?.slug)

/**
 * Up to three more in the same programme, self excluded — the frozen page's
 * arithmetic, unchanged. It runs on the raw `insight.program` string rather
 * than on `programName`, so the 52 mis-tagged rows still find their siblings;
 * only the *heading* above them is guarded.
 */
const related: Insight[] = insight?.program
  ? activeByProgram(insight.program)
    .filter(i => i.slug !== insight.slug)
    .slice(0, 3)
  : []

/**
 * The header chips, in the frozen page's order: format, programme, related
 * projects, and `Archive` last.
 *
 * `Insight.projects` holds project **slugs** (the real M2M) and the chip shows
 * the project's `heading`, exactly as `pages/[program].vue` builds its extra
 * chips. The programme chip is present only when the value is a real
 * programme. `filter(Boolean)` with the type predicate drops the nulls the
 * conditionals leave behind — `bfPageHeader` filters non-strings out too, but
 * the type has to agree with `chips?: string[]` here.
 */
const chips: string[] = insight
  ? [
      formatLabel(insight.format),
      programName,
      ...(insight.projects ?? []).map(slug => projectBySlug(slug)?.heading ?? slug),
      insight.archived ? 'Archive' : undefined
    ].filter((c): c is string => typeof c === 'string' && c !== '')
  : []

/**
 * Banner microcopy from the dataset's `archive-banner` row; `{date}` is the
 * publish date. The fallback is the frozen page's own, so a missing row
 * degrades to a sentence rather than to `{date}` on the page.
 */
const bannerText = (pageBySlug('archive-banner')?.description ?? 'From our archive: published {date}.')
  .replace('{date}', monthYear(insight?.publish_date ?? null))

/** The authors as one phrase — `bfByline.author` is a string, not a list. */
const authorText = insight?.authors?.length ? insight.authors.join(', ') : undefined

/**
 * The trail, root first. **Three entries, not the frozen page's two**, because
 * `bfBreadcrumb` treats the last entry as the current page and never links it
 * (#20's D: `aria-current` is positional, not a function of `to`). A two-entry
 * trail ending at `Insights` would therefore render the feed as the page the
 * reader is already on and drop the link to it — the one link a detail page's
 * breadcrumb exists to provide. The third entry carries no `to` for the same
 * reason: it is this page.
 */
const crumbs = [
  { label: 'Home', to: '/' },
  { label: 'Insights', to: '/insights' },
  { label: insight?.heading ?? 'Insight' }
]
</script>

<template>
  <!--
    No wrapper element: `bf-default`'s `<main class="stack" data-gap="xl">` is
    this page's own stack, and a `<div>` here would collapse the bands into one
    stack child. `<template>` renders no element either, so the guard costs
    nothing structurally.
  -->
  <template v-if="insight">
    <!--
      Zone 1 — the header. GGS: the same things in the same places on every
      insight. `bfPageHeader` renders this page's `<h1>` unconditionally, which
      is why the not-found branch below does not render it at all.

      The subheading is a `tagline` rather than the frozen page's slotted
      `<p><strong>`: it is the standfirst of the article, which is what
      `tagline` is for, and it then sits above the meta row instead of below
      it.
    -->
    <bfPageHeader
      label="Insight header"
      :crumbs="crumbs"
      :chips="chips"
      :heading="insight.heading"
      :tagline="insight.subheading"
    >
      <!--
        The meta row. `bfByline` owns the "By … · date" phrase when there is an
        author; when there is not, the date stands alone and is wrapped in a
        `<p>` so it is a stack child like every other block here rather than a
        bare inline in a column.

        Both branches render nothing when there is nothing to say — `bfByline`
        has its own `hasContent` guard and `bfTime` renders no element for a
        null or unparseable date — so a row with neither author nor date grows
        no empty meta row.
      -->
      <bfByline v-if="authorText" :author="authorText" :date="insight.publish_date" />
      <p v-else><bfTime :date="insight.publish_date" /></p>
    </bfPageHeader>

    <!--
      Zone 2 — the archive banner (GGS: archived stays live and indexed, but
      labelled). `bfNotice` replaces the frozen page's raw `<p class="wf-note">`
      and brings the same `.bf-notice` box, repainted in semantic tokens.

      `variant="note"` is the default, written out because this is the call
      site the variant was built for. It is not `announced`: the banner is
      present in the prerendered HTML on first paint, so there is no live
      change for a `role="status"` to announce.

      The forward link appears only when the programme is a real one — a link
      reading "See recent work on PENDING-Q3 (Digital World retired)" would
      point at a hub that does not exist, and say so out loud.
    -->
    <bfSection v-if="insight.archived" label="Archive banner" layout="plain">
      <bfNotice variant="note">
        {{ bannerText }}
        <NuxtLink v-if="program" :to="`/${program.slug}`">See recent work on {{ program.name }}</NuxtLink>
      </bfNotice>
    </bfSection>

    <!--
      Zone 3 — the body: excerpt dek, media, the full stored content, and the
      download when there is one.

      `measure="narrow"` is the frozen page's own — this is the one band on the
      site that is a column of running prose and wants a reading measure rather
      than the default.
    -->
    <bfSection label="Body" measure="narrow">
      <!--
        The dek. A plain string: the HTML strip and entity decode the frozen
        page's render-time helper did now happen once, in the build-time
        normaliser (D3).
      -->
      <p v-if="insight.excerpt"><em>{{ insight.excerpt }}</em></p>

      <!--
        `alt` is the heading, as the frozen page sets it. These are editorial
        lead images with no separate description in the source; the heading is
        the only honest text available, and `bfMedia` renders an `aria-hidden`
        placeholder rather than an unlabelled box when there is no `src` at all.

        TODO(gh#234): this is a real defect, deliberately left alone here.
        Measured on `/insights/12-days-of-christmas-in-europe`, the `alt` is
        character-identical to the `<h1>`, so the image is announced as a
        duplicate of the heading a screen-reader user just heard. It is *not*
        decorative, so `alt=""` would be a lie, and gh#222 forbids inventing a
        string — the strings are content (D28, §8). #234 ships the `alt` field
        through the schema, the normaliser and the importer and fixes this with
        real data; #110 asserts the invariant.

        `?? ''` because `Insight.heading` is `string | null` and `alt` is now
        `string`. This is *not* the component-level coercion gh#222 deletes:
        that one applied to every call site invisibly, this one is a single
        call site declaring what it does with a null it cannot avoid. A row
        with no heading already renders an empty `<h1>` (`PageHeader.vue:273`)
        and already rendered `alt=""` before this change, so the behaviour is
        unchanged — it is a content defect on that row, not a decorative
        declaration, and it is the same defect the TODO above hands to #234.
      -->
      <bfMedia :src="insight.image" :alt="insight.heading ?? ''" ratio="16/9" />

      <bfProse :content="insight.content" />

      <!--
        The real asset URL, not the wireframe's `#`. `external` marks it for
        the `[data-external]` treatment (#19); the file is served from the
        Directus host, so it leaves this origin.
      -->
      <div v-if="insight.download">
        <bfButton :href="insight.download" external>Download the report (PDF)</bfButton>
      </div>
    </bfSection>

    <!--
      Zone 4 — the onward journey (GGS: machine-readable relationships).

      Rendered only when there is something in it, and headed generically when
      `insight.program` is one of the 52 non-programme values — see the block
      comment at the top. `bfGridInsights` brings its own `.grid[data-min-width]`
      (D9); this page names no column count. `headingLevel` 3 keeps the card
      headings under the band's `<h2>` (BRIEF §5 rule 9).
    -->
    <bfSection
      v-if="related.length"
      label="Related insights"
      :heading="programName ? `More on ${programName}` : 'More insights'"
    >
      <bfGridInsights :insights="related" :heading-level="3" />
    </bfSection>
  </template>

  <!--
    No such slug. This branch owns the page's only `<h1>` — `bfEmptyState`
    defaults `headingLevel` to 1 and `bfPageHeader` is not rendered above it —
    so the render has exactly one, as the acceptance requires.
  -->
  <bfEmptyState
    v-else
    heading="Insight not found"
    message="That insight does not exist, or its address has changed."
    back-label="Browse all insights"
    back-to="/insights"
  />
</template>
