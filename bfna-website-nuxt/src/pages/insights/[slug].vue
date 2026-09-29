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
 *    asset URL on the rows that carry one, not a placeholder. Its label no
 *    longer says "(PDF)": 8 of the 125 downloads are images
 *    (`utils/insightDetail.ts`).
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
 * ## One layout, four openings (impeccable refine, Sep 2026)
 *
 * The header, the archive banner and the related band are the same on every
 * insight. The body opens according to what the row carries —
 * `insightVariant()` in `utils/insightDetail.ts` decides, from the fields and
 * not from `format` alone:
 *
 * - **video** (54) — the player, at the site measure, as a poster that loads
 *   nothing from YouTube but one still until the reader presses play; then
 *   the privacy-enhanced player, autoplaying because that is what the press
 *   asked for. Without JavaScript the poster is a plain link to the video.
 *   The one video embedded in a body (`/insights/disrupting-democracy`)
 *   follows the same rule at the column's width — `bfProse` renders it.
 * - **infographic** (55) — the excerpt, the download *before* the graphic
 *   (it can be 2,300px tall), the graphic whole, the text, the download again.
 * - **summary** (50) — no body, only an image and a paragraph: a cover, a
 *   show's art, a still. From 1120px the image hangs in the right margin
 *   beside an excerpt that keeps the whole reading column, with the way to
 *   the thing (Listen to the episode, Visit the site, …) under the words,
 *   instead of 1,100px of picture after them and nothing else. This is the
 *   podcast layout (13 episodes) and the Hidden Layers one.
 * - **article** (195) — the excerpt and the text; a long report (750 words
 *   or more) offers its download, with a reading time, before the text as
 *   well as after it.
 *
 * `external_url` is now read: five rows point off to a podcast platform, a
 * documentary or a microsite, and nothing on this page linked to any of them.
 * A summary shows it beside the excerpt; any other post closes on it, or
 * carries it in the strip before the text when a download leads that strip.
 *
 * The counts are over the 354 routed rows; the 17 homepage highlight records
 * have no detail page (`useBfInsights().bySlug`).
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
import { kickerHidesFormatChip, splitHeadingKicker } from '~/utils/headingKicker'
import {
  bodyWords,
  downloadAction,
  externalAction,
  insightVariant,
  LONG_READ_WORDS,
  readingMinutes
} from '~/utils/insightDetail'
import { newTabAttrs } from '~/utils/link'
import { programChipLabel } from '~/utils/bf-card-program'
import { youtubeEmbedUrl, youtubeId, youtubePoster, youtubeWatchUrl } from '~/utils/youtube'

defineOptions({ name: 'InsightDetailPage' })

definePageMeta({ layout: 'bf-default' })

const route = useRoute()

const { bySlug, activeByProgram, active } = await useBfInsights()
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
 * names the route rather than leaving the site title alone. A slug that is
 * not in the collection names the page it shows instead — "Insight not
 * found", the `<h1>` below — not a generic "Insight".
 */
useHead({ title: () => insight ? (insight.heading ?? 'Insight') : 'Insight not found' })

/**
 * The visible `<h1>` and its kicker. "Infographic: Cybersecurity" sets an
 * `<h1>` reading "Cybersecurity" with "Infographic" as a kicker **above** it
 * (`bfPageHeader`'s `kicker` prop), where the cards put it too. The refined
 * pass had moved it into the meta row under the title; the user chose the
 * kicker above the title on 2026-09-28, so it is back where 1899ef6 set it,
 * with the step to the `<h1>` at 85% of the old `--space-m` (`article.css`).
 * An ordinary "Title: Subtitle" heading is not split
 * (`utils/headingKicker.ts` holds the curated list). The `<title>` above,
 * the crumb and the lead image's `alt` keep the **full** heading.
 */
const headingSplit = splitHeadingKicker(insight?.heading)

/** The format chip, unless the kicker already says it (kicker "Infographic" on an infographic). */
const showFormatChip = insight ? !kickerHidesFormatChip(headingSplit, insight.format) : false

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

/** Which opening the body takes — see "One layout, four openings" above. */
const variant = insight ? insightVariant(insight) : 'article'

/** The two ways off the page, as buttons: the file, and the thing the post points at. */
const download = insight ? downloadAction(insight) : null
const external = insight ? externalAction(insight, headingSplit.kicker) : null

/**
 * A long piece offers its download before the text as well as after it:
 * a reader who wants the PDF of a 5,000-word report should not scroll past
 * it to find the button. An infographic always does — the graphic itself is
 * the long part.
 */
const words = bodyWords(insight?.content)
const longRead = words >= LONG_READ_WORDS
const downloadFirst = Boolean(download) && (variant === 'infographic' || longRead)

/**
 * What closes the piece: the download, and the outside link unless the
 * strip before the text already carried it. A summary shows its action
 * beside the excerpt and nowhere else. The outside link is never given a
 * strip of its own before the text — alone there, it was a boxed button
 * with nothing after it, directly under the player's "Watch on YouTube".
 */
const endDownload = Boolean(download) && variant !== 'summary'
const endExternal = Boolean(external) && !downloadFirst && variant !== 'summary'

/**
 * The button beside a summary's excerpt: where the post points, else its
 * file. A summary shows its action there and nowhere else.
 */
const summaryAction = external ?? download

/* ---------------------------------------------------------------- video */

const videoId = variant === 'video' ? youtubeId(insight?.video_url) : null

/** The press turns the poster into the player; until then no YouTube script loads. */
const playing = ref(false)
const videoFrame = ref<HTMLIFrameElement | null>(null)

/**
 * The poster. The post's own image when it has one (12 of the 54 do);
 * otherwise YouTube's `hq` still, which every video has, upgraded after
 * mount to the sharp `maxres` one when that exists — for 8 of the 54 it does
 * not, and YouTube answers with a 120px grey placeholder instead.
 */
const posterSrc = ref(insight?.image || (videoId ? youtubePoster(videoId) : ''))

onMounted(() => {
  if (!videoId || insight?.image) return
  const probe = new Image()
  probe.onload = () => {
    if (probe.naturalWidth > 120) posterSrc.value = probe.src
  }
  probe.src = youtubePoster(videoId, 'maxres')
})

/**
 * Play in place. A modified click (new tab, new window) is left to the
 * browser, so the poster still behaves as the link it is. Focus moves to the
 * player, so a keyboard user is not dropped to the top of the page when the
 * element they pressed is replaced.
 */
async function play(event: MouseEvent) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  event.preventDefault()
  playing.value = true
  await nextTick()
  videoFrame.value?.focus()
}
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
      `detail.css` narrows both to one reading column, so the `<h1>` ranges
      left on the same vertical as the copy beneath it. It is a prop rather than a rule in
      `public/css/components/article.css`, and review is why: the first draft
      wrote `--_bf-section-measure` from that file and lost a same-specificity,
      same-layer tie to `Section.vue`'s compiled `.bf-section[data-v-…]` on
      link order — the header silently kept 1100px in the built site while
      looking correct in source. `bfPageHeader` declares no `measure` prop, so
      this falls through `$attrs` onto its `bfSection` root and is consumed as
      that component's prop; it is the same mechanism the body band below uses,
      and it competes with nothing.

      `bf-detail-column` and `bf-detail-header` are the reading column and
      the `<h1>`'s step, shared with `/projects/:slug` (`detail.css`);
      `bf-article-header` carries what only the article has — the one-line
      trail, the standfirst, the meta row's type. `class` is on `bfSection`'s
      pass-through allow-list by name, so it merges onto the band root rather
      than replacing `bf-page-header`.

      The cover is **always the paper texture**, never the post's own image
      (impeccable pass, Sep 2026). It used to be `insight.image` behind a 78%
      wash whenever the post had one, which put the same picture on the page
      twice — once washed behind the `<h1>`, once full strength as the lead
      image directly below — and on the infographic posts it set the title
      over the chart's own lettering. The lead image in the body now carries
      the photograph alone, at full strength and full size. The paper is
      `bfPageHeader`'s default ground, so no `image` is passed: the band
      wears `bfSection`'s `data-surface="paper"`, the same masthead as every
      index and hub-less header.

      The chips are **not** in `#chips`, which renders them above the `<h1>`
      as an eyebrow. They are content taxonomy, not a label for the title, so
      they join the date in one meta row under the standfirst, and nothing
      but the kicker (below) stands between the breadcrumb and the heading.

      The kicker **is** passed to `bfPageHeader`: its `kicker` prop sets the
      format or series word as a `<p class="kicker">` between the breadcrumb
      and the `<h1>`. The user chose that placement on 2026-09-28 (the refined
      pass had moved the word into the meta row); `article.css` sets the step
      from it to the `<h1>` at 85% of 1899ef6's `--space-m`.
    -->
    <bfPageHeader
      class="bf-article-header bf-detail-header bf-detail-column"
      measure="wide"
      label="Insight header"
      :crumbs="crumbs"
      :kicker="headingSplit.kicker"
      :heading="headingSplit.title"
      :tagline="insight.subheading"
    >
      <!--
        The meta row: the byline or the date, then the chips, in one wrapping
        cluster. `bfByline` owns the "By … · date" phrase when there is an
        author; when there is not, the date stands alone.

        Both branches render nothing when there is nothing to say — `bfByline`
        has its own `hasContent` guard and `bfTime` renders no element for a
        null or unparseable date. The format chip renders unless the kicker
        above the `<h1>` already names the format ("Infographic" on an
        infographic) — then it would say the same word twice. Both posts that
        drop it today carry a date, so their row is not empty.

        `data-chip-tone="neutral"` is `bfChip`'s container default, the hook
        `bfCard`'s chip row uses: the project and `Archive` chips, which
        carry no `tone`, take the neutral pill beside the format chip. The
        programme chip names its own tone and wins.
      -->
      <div class="bf-article-meta bf-detail-meta | cluster" data-gap="xs" data-chip-tone="neutral">
        <bfByline v-if="authorText" :author="authorText" :date="insight.publish_date" />
        <bfTime v-else :date="insight.publish_date" />
        <bfChip v-if="showFormatChip" tone="neutral">{{ formatLabel(insight.format) }}</bfChip>
        <bfChip
          v-if="program"
          tone="program"
          :program="program.slug"
        >{{ programChipLabel(program.name) }}</bfChip>
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
      class="bf-article-notice bf-detail-column"
      label="Archive banner"
      layout="plain"
    >
      <bfNotice variant="note">
        {{ bannerText }}
        <NuxtLink v-if="program" :to="`/${program.slug}`">See recent work on {{ program.name }}</NuxtLink>
      </bfNotice>
    </bfSection>

    <!--
      Zone 3 — the body: the opening this row's variant calls for (the block
      comment at the top), the full stored content, and the download when
      there is one.

      `measure="wide"` puts the band on a named step; `bf-detail-column`
      (`detail.css`) then caps the column at the reading measure, shared with
      the header and the archive banner so all three start on the same
      vertical. The player, the lead image and the summary break out of it
      towards the site measure.

      `aria-label` names the band, which makes it a region a screen-reader
      user can jump to — and it is what `bfSection`'s dev check asks for once
      the body carries an `<h2>` of its own. `data-variant` is a style hook
      only; nothing reads it.
    -->
    <bfSection
      class="bf-article-body bf-detail-column"
      label="Body"
      aria-label="Article"
      :data-variant="variant"
      measure="wide"
    >
      <!--
        Summary: no body, one image, one paragraph. The image leads until
        1120px, and from there hangs in the right margin, so the words keep
        the header's left edge and its whole column (`article.css`).
        `ratio="auto"`: covers, square show art and wide stills are each
        shown whole.
      -->
      <div v-if="variant === 'summary'" class="bf-article-summary">
        <div class="bf-article-summary__media">
          <bfMedia :src="insight.image" :alt="insight.heading ?? ''" ratio="auto" />
        </div>
        <div class="bf-article-summary__text">
          <p v-if="insight.excerpt" class="bf-article-lede">{{ insight.excerpt }}</p>
          <div v-if="summaryAction" class="bf-article-summary__action">
            <bfButton variant="primary" :href="summaryAction.href" :external="summaryAction.external">{{ summaryAction.label }}</bfButton>
          </div>
        </div>
      </div>

      <template v-else>
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
          The player. Before the press it is a link to the video on YouTube
          with the poster inside it — so it works, as a link, before hydration
          and without JavaScript — and `play()` swaps in the player on a plain
          click. The poster is decorative (`alt=""`); the link's name is
          "Play video: <title>", which starts with the words it shows.

          "Watch on YouTube" under it is for the reader who would rather: it
          carries the site's off-site marker and opens in a new tab like every
          other external link.
        -->
        <div v-if="videoId" class="bf-article-video">
          <div class="bf-article-video__frame">
            <iframe
              v-if="playing"
              ref="videoFrame"
              :src="youtubeEmbedUrl(videoId, { autoplay: true })"
              :title="`Video: ${headingSplit.title}`"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowfullscreen
              referrerpolicy="strict-origin-when-cross-origin"
            />
            <a
              v-else
              class="bf-article-video__facade"
              :href="youtubeWatchUrl(videoId)"
              :aria-label="`Play video: ${headingSplit.title}`"
              @click="play"
            >
              <img class="bf-article-video__poster" :src="posterSrc" alt="" decoding="async">
              <span class="bf-article-video__play" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="12" /><path d="M9.75 7.5v9l7-4.5z" /></svg>
                Play video
              </span>
            </a>
          </div>
          <p class="bf-article-video__source">
            <a :href="youtubeWatchUrl(videoId)" data-external v-bind="newTabAttrs(youtubeWatchUrl(videoId))">Watch on YouTube</a>
          </p>
        </div>

        <!--
          The strip before the text, only when a download leads it: a long
          piece's (with its reading time) or an infographic's, and the post's
          outside link beside it when it has one.
        -->
        <div v-if="downloadFirst && download" class="bf-article-actions bf-article-actions--start | cluster">
          <bfButton variant="primary" :href="download.href" :external="download.external">{{ download.label }}</bfButton>
          <bfButton v-if="external" variant="default" :href="external.href" :external="external.external">{{ external.label }}</bfButton>
          <span v-if="longRead" class="bf-article-actions__meta">{{ readingMinutes(words) }} min read</span>
        </div>

        <!--
          The lead image, **only when the post supplies one** and is not a
          video (whose image is the poster above). Without an image this
          renders nothing — no placeholder box, no reserved 16/9 space: 237 of
          the 371 rows carry no image, and `bfMedia`'s placeholder shipped an
          empty crossed frame to a reader on every one of them.

          `ratio="auto"`, not `16/9`: the lead is shown whole, at its own shape.
          This is the infographic's slot, where the image *is* the piece —
          `/insights/12-days-of-christmas-in-europe` is 768 x 2304, and a 16/9
          `object-fit: cover` box showed about a fifth of it. The wrapper breaks
          out of the reading column to the site measure (`bf-detail-lead`,
          `detail.css`), and the image never scales past its own pixels.

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
          real data; #110 asserts the invariant. The summary's image above is
          the same case.

          `?? ''` because `Insight.heading` is `string | null` and `alt` is now
          `string`. This is *not* the component-level coercion gh#222 deletes:
          that one applied to every call site invisibly, this one is a single
          call site declaring what it does with a null it cannot avoid. A row
          with no heading already renders an empty `<h1>` (`PageHeader.vue:273`)
          and already rendered `alt=""` before this change, so the behaviour is
          unchanged — it is a content defect on that row, not a decorative
          declaration, and it is the same defect the TODO above hands to #234.
        -->
        <div v-if="insight.image && !videoId" class="bf-article-lead bf-detail-lead">
          <bfMedia :src="insight.image" :alt="insight.heading ?? ''" ratio="auto" />
        </div>
      </template>

      <bfProse :content="insight.content" />

      <!--
        What closes the piece (`endDownload` / `endExternal` above): the
        download — the real asset URL, not the wireframe's `#`, marked
        `external` for the `[data-external]` treatment (#19) because the file
        is served from the Directus host — and the outside link when the
        strip before the text did not carry it: a documentary's "Watch the
        documentary" under its trailer. No rule around it; it ends the column.
      -->
      <div v-if="endDownload || endExternal" class="bf-article-actions bf-article-actions--end | cluster">
        <bfButton v-if="endDownload && download" variant="primary" :href="download.href" :external="download.external">{{ download.label }}</bfButton>
        <bfButton v-if="endExternal && external" :variant="endDownload ? 'default' : 'primary'" :href="external.href" :external="external.external">{{ external.label }}</bfButton>
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
    No such slug: the shared not-found layout (`bfNotFound`), the one
    `error.vue` renders for a route that never reached a page — the heading
    block on the paper ground, a search field with the programs and indexes
    to start from, then the newest insights (`active` is newest first; the
    component draws three).

    This branch owns the page's only `<h1>`: `bfNotFound`'s first band is
    `bfEmptyState`, whose heading defaults to rank 1, and `bfPageHeader` is
    not rendered above it — so the render has exactly one, as the acceptance
    requires. Not `announced`: the branch is prerendered, and a live region
    present at first paint is noise (gh#224's static row checks for exactly
    that).
  -->
  <bfNotFound
    v-else
    heading="Insight not found"
    message="That insight does not exist, or its address has changed."
    back-label="Browse all insights"
    back-to="/insights"
    :programs="programs()"
    :insights="active.slice(0, 3)"
  />
</template>
