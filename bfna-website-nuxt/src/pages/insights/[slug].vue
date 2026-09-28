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

      Two additions, gh#254, and they are the only things distinguishing this
      band from the seven other `bfPageHeader` call sites.

      `measure="wide"` puts the header on the **body's** measure step, and
      `article.css` narrows both to one reading column, so the `<h1>` ranges
      left on the same vertical as the copy beneath it. It is a prop rather than a rule in
      `public/css/components/article.css`, and review is why: the first draft
      wrote `--_bf-section-measure` from that file and lost a same-specificity,
      same-layer tie to `Section.vue`'s compiled `.bf-section[data-v-…]` on
      link order — the header silently kept 1100px in the built site while
      looking correct in source. `bfPageHeader` declares no `measure` prop, so
      this falls through `$attrs` onto its `bfSection` root and is consumed as
      that component's prop; it is the same mechanism the body band below uses,
      and it competes with nothing.

      `bf-article-header` carries what is left: the `<h1>` step, the header's
      own rhythm, and the reading column. `class` is on `bfSection`'s
      pass-through allow-list by name, so it merges onto the band root rather
      than replacing `bf-page-header`.

      The cover is **always the paper texture**, never the post's own image
      (impeccable pass, Sep 2026). It used to be `insight.image` behind a 78%
      wash whenever the post had one, which put the same picture on the page
      twice — once washed behind the `<h1>`, once full strength as the lead
      image directly below — and on the infographic posts it set the title
      over the chart's own lettering. The lead image in the body now carries
      the photograph alone, at full strength and full size.

      The chips are **not** in `#chips`, which renders them above the `<h1>`
      as an eyebrow. They are content taxonomy, not a label for the title, so
      they join the date in one meta row under the standfirst and the heading
      follows the breadcrumb directly.
    -->
    <bfPageHeader
      class="bf-article-header"
      measure="wide"
      label="Insight header"
      image="/images/hero/article-texture.png"
      :crumbs="crumbs"
      :heading="insight.heading"
      :tagline="insight.subheading"
    >
      <!--
        The meta row: the byline or the date, then the chips, in one wrapping
        cluster. `bfByline` owns the "By … · date" phrase when there is an
        author; when there is not, the date stands alone.

        Both branches render nothing when there is nothing to say — `bfByline`
        has its own `hasContent` guard and `bfTime` renders no element for a
        null or unparseable date. The format chip always renders, so the row
        is never empty.
      -->
      <div class="bf-article-meta | cluster" data-gap="xs">
        <bfByline v-if="authorText" :author="authorText" :date="insight.publish_date" />
        <bfTime v-else :date="insight.publish_date" />
        <bfChip data-tone="format">{{ formatLabel(insight.format) }}</bfChip>
        <bfChip
          v-if="program"
          :data-program="program.slug"
        >{{ program.name }}</bfChip>
        <bfChip
          v-for="slug in insight.projects ?? []"
          :key="slug"
        >{{ projectBySlug(slug)?.heading ?? slug }}</bfChip>
        <bfChip v-if="insight.archived">Archive</bfChip>
      </div>
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
    <bfSection
      v-if="insight.archived"
      class="bf-article-notice"
      label="Archive banner"
      layout="plain"
    >
      <bfNotice variant="note">
        {{ bannerText }}
        <NuxtLink v-if="program" :to="`/${program.slug}`">See recent work on {{ program.name }}</NuxtLink>
      </bfNotice>
    </bfSection>

    <!--
      Zone 3 — the body: excerpt dek, media, the full stored content, and the
      download when there is one.

      `measure="wide"` puts the band on a named step; `article.css` then caps
      the column at the reading measure, shared with the header and the
      archive banner so all three start on the same vertical.

      `bf-article-body` carries the programme spine — an opaque `--color-program`
      rule down the column's left edge, tying the piece to its programme without
      a second token or a `v-if`. `data-program` is on `<html>` for the three
      real programmes only (gh#252), so a row carrying one of the 52 migration
      signals, or none, resolves the neutral `:root` default and the spine paints
      navy. Same D-50.2 guard as the chip, the banner link and the related
      heading, arrived at without this file saying anything.
    -->
    <bfSection class="bf-article-body" label="Body" measure="wide">
      <!--
        The lede — the excerpt, set a step above the body in the body face. A
        plain string: the HTML strip and entity decode the frozen page's
        render-time helper did now happen once, in the build-time normaliser
        (D3). Roman, not the `<em>` it used to wear: a whole paragraph of
        italic sans reads worse than it looks, and the size step already says
        "this is the summary".
      -->
      <p v-if="insight.excerpt" class="bf-article-lede">{{ insight.excerpt }}</p>

      <!--
        The lead image, **only when the post supplies one**. Without an image
        this renders nothing — no placeholder box, no reserved 16/9 space: 237
        of the 371 rows carry no image, and `bfMedia`'s placeholder shipped an
        empty crossed frame to a reader on every one of them.

        `ratio="auto"`, not `16/9`: the lead is shown whole, at its own shape.
        55 of the image rows are infographics, where the image *is* the piece —
        `/insights/12-days-of-christmas-in-europe` is 768 x 2304, and a 16/9
        `object-fit: cover` box showed about a fifth of it. The wrapper breaks
        out of the reading column to the site measure (`article.css`), and the
        image never scales past its own pixels.

        `alt` is the heading, as the frozen page sets it. These are editorial
        lead images with no separate description in the source; the heading is
        the only honest text available.

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
      <div v-if="insight.image" class="bf-article-lead">
        <bfMedia :src="insight.image" :alt="insight.heading ?? ''" ratio="auto" />
      </div>

      <bfProse :content="insight.content" />

      <!--
        The real asset URL, not the wireframe's `#`. `external` marks it for
        the `[data-external]` treatment (#19); the file is served from the
        Directus host, so it leaves this origin.
      -->
      <div v-if="insight.download" class="bf-article-download">
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
