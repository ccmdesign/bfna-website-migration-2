<script setup lang="ts">
/**
 * `/` — the home page (issue 47 / gh#56). **Review checkpoint 2** (BRIEF §8).
 *
 * The first real template of the epic, and the file that retires the legacy
 * home: this file used to be a legacy hero, a highlights strip and three
 * split sections over the `workstreams` / `highlights` / `publications` /
 * `videos` / `infographics` / `docs` composables
 * (`02-legacy-retirement-inventory.md` §A row 1). It is **replaced**, not
 * archived — no `index.vue.legacy` (the spec's own acceptance greps for its
 * absence), because the git history is the archive and a second copy in the
 * tree is a second thing to keep compiling. It is also the only legacy file
 * this issue retires; the rest are #57's and #58's.
 *
 * Descends from `src/pages/wireframes/index.vue`, which is frozen (D2): read
 * for its band order and its copy decisions, never edited, and nothing here
 * imports from it.
 *
 * ## What a template is allowed to do
 *
 * Read data and compose components. That is the whole job, and the split is
 * D8's: a **page** may call a composable; a `bf-*` **component** may not. So
 * every `queryCollection` on this route happens in the five awaited calls
 * below and in `layouts/bf-default.vue`, and every component under
 * `<template>` receives entities as props.
 *
 * The imports are explicit rather than auto: Nuxt scans `composables/` at the
 * top level and one directory deep for `index` files only, and these live at
 * `composables/data/useBf*.ts`. The layout and the probes import them the same
 * way.
 *
 * ## The four bands, in wireframe order
 *
 *  1. **Announcement — not here.** It is `bf-default`'s (gh#55), rendered
 *     between the nav and `<main>` because it is site chrome rather than page
 *     content. The wireframe put it in a `#hero` slot; the shell has no such
 *     slot, which is why this page starts at the hero.
 *  2. **Hero** — `homePage()`'s heading and description, and one primary CTA.
 *  3. **Programs** — the three `bfPrograms` rows, passed **whole**.
 *  4. **Featured projects** — the four curated flagships, with media.
 *  5. **Insights** — the Transponder as a full-span product card, four
 *     highlights beside it, then the six newest active insights.
 *
 * ## No `useHead` title
 *
 * Deliberate. `bf-default`'s `titleTemplate` has a branch for exactly this
 * page: a route that sets no title renders `Bertelsmann Foundation North
 * America` alone, rather than the site name twice.
 */
import type { Insight } from '~/types/bf-contracts'
import { useBfInsights } from '~/composables/data/useBfInsights'
import { useBfPages } from '~/composables/data/useBfPages'
import { useBfPrograms } from '~/composables/data/useBfPrograms'
import { useBfProjects } from '~/composables/data/useBfProjects'

defineOptions({ name: 'HomePage' })

definePageMeta({ layout: 'bf-default' })

const { homePage } = await useBfPages()
const { programs } = await useBfPrograms()
const { featuredProjects, allProducts } = await useBfProjects()
const { active, highlights } = await useBfInsights()

/**
 * Resolved once, at setup, and handed to the template as plain values.
 *
 * Every one of these members is already a plain array or record — the four
 * composables unwrap `useAsyncData` for exactly this reason — and the content
 * is build-time static, so there is nothing here to keep reactive. Reading
 * them once also means the slice bounds below appear in one place rather than
 * inside a template expression that re-runs on every render.
 */
const home = homePage()
const programCards = programs()
const projectCards = featuredProjects()
const products = allProducts()

/**
 * Four, as the wireframe takes — `highlights()` returns all eight of the
 * normaliser's `featured` records and the band is a strip beside the product
 * card, not an index.
 */
const featured = highlights().slice(0, 4)

/**
 * The six newest active insights. `active` is a **getter** that spreads its
 * private array (gh#91), so this slice cannot reach the payload.
 */
const latest = active.slice(0, 6)

/**
 * The programme chip shown on each insight row, ported verbatim from
 * `pages/wireframes/index.vue`.
 *
 * It stays a page-level function rather than moving to the entity, because
 * there is no field to move it to: `bfProgramSchema` (issue 09) declares
 * `slug`, `name`, `tagline`, `intro` and `image` — no short name — and
 * `Insight.program` is the display **name**, not a relation. Recorded as a
 * gap in the spec's Decisions (D-47.2); deriving one here would be exactly the
 * page-side synthesis BRIEF §5 rule 10 forbids, so the mapping is kept as the
 * literal relabelling it is.
 *
 * `RE-TAG` / `PENDING` are the normaliser's placeholders for a row whose
 * programme the client has not re-assigned (issue 07); the wireframe collapses
 * both to one honest chip rather than printing the placeholder at a reader.
 */
const shortProgram = (program: string): string => {
  if (program === 'Transatlantic Relations & Global Challenges') return 'Transatlantic Rel.'
  if (program.startsWith('RE-TAG') || program.startsWith('PENDING')) return 'Re-tag'
  return program
}

/**
 * `bfGridInsights.extraChips` — per row, and `undefined` for a row with no
 * programme, which the grid reads as "no extra chips" rather than as an empty
 * cluster.
 */
const insightChips = (i: Insight): string[] | undefined =>
  i.program ? [shortProgram(i.program)] : undefined
</script>

<template>
  <!--
    No wrapper element. `bf-default`'s `<main class="stack" data-gap="xl">` is
    the page's own stack, so a `<div>` here would swallow the four bands into
    one stack child and collapse the rhythm between them to nothing.
  -->

  <!--
    Zone 1 — the hero. `home` is `pages.json`'s `home` row: the GGS value prop
    and Irene's About Us opening.

    The CTA is passed as slot content, unconditionally — the label and target
    are Irene's (Aug 5): "Explore our work", pointing at the Democracy hub,
    matching the two programme hubs. The wireframe's "Get our newsletter" was
    removed there and is not reinstated here; no newsletter exists.

    `/democracy`, not `/wireframes/democracy`: the hub route of BRIEF §7.

    The photograph is `src/public/images/hero/homepage.jpg` (gh#253) — a local
    file that was on disk and read by nothing. **Local, not the Directus URL
    the content layer stores**: `bfMedia` routes a root-relative path through
    `NuxtImg` and gets a real srcset, and hands an absolute `https://` URL to
    the browser untouched with none (`Media.vue:70-76`). No `imageAlt`: the
    picture is decorative and the `<h1>` beside it carries the meaning.

    No `scrim` either — `full` is the default, and it is the flat 0.70 navy
    that makes white type clear 4.5:1 over any photograph BFNA ships.
  -->
  <bfHero
    :heading="home?.heading"
    :description="home?.description"
    image="/images/hero/homepage.jpg"
  >
    <bfButton to="/democracy" variant="primary">Explore our work</bfButton>
  </bfHero>

  <!--
    Zone 2 — Programs. GGS order: identity first.

    `<ul class="switcher">` **inside** a default (`stack`) band rather than
    `<bfSection layout="switcher">`, which is what the spec's prose asks for
    and what D-47.1 in its Decisions explains: the band's `<h2>` shares the
    inner box with the slot, so a `switcher` layout would lay the heading out
    as a flex item beside the cards — and `bfCard` renders an `<li>`, which
    needs a real list parent. This is also the frozen wireframe's own shape.

    `role="list"` is not redundant: `base/reset.css:95-103` strips `list-style` from every
    `ul[class]`, and WebKit reads that declaration as the author no longer
    meaning a list — VoiceOver stops saying "list, N items" and stops
    offering list navigation. Restating the implicit role puts the
    semantics back without putting the bullets back. Same fix and same
    reason as `nav/Dropdown.vue:109` and `Breadcrumb.vue:238-240`
    (gh#220, D27).
  -->
  <bfSection label="Programs" heading="Our Programs">
    <ul
      class="switcher"
      role="list"
      data-gap="m"
    >
      <!--
        The whole `Program` entity, not the `{ slug, name, short, tagline }`
        literal the wireframe built: `tagline` is a stored field since the
        normaliser (issue 07), so there is nothing left for a page to derive.

        `headingLevel="3"` — under the band's `<h2>`, which is what keeps the
        outline sequential (BRIEF §5 rule 9). It is also the card's default;
        stated because the next reader should not have to know that.
      -->
      <bfCardProgram
        v-for="p in programCards"
        :key="p.slug"
        :program="p"
        :heading-level="3"
      />
    </ul>
  </bfSection>

  <!--
    Zone 3 — Featured projects: the four curated flagships, in curated order.

    Cards directly inside the grid rather than through `bfGridProjects`, which
    mirrors the wireframe: this band is the one place project cards carry media
    and drop their chips, and the shared grid takes neither prop.

    `data-min-width="xl"` replaces the wireframe's inline two-column track
    list (D9 — no `bf-*` file authors a column count, and the acceptance greps
    this file to prove it). Per D-42.2's measured table a 400px track floor
    resolves **2 tracks** at a desktop width and collapses to one below, which
    is the pinned layout's intent plus the reflow it never had.

    `role="list"` for the reason given at the Programs list above: the reset
    strips the marker from every `ul[class]` and WebKit drops the implicit list
    role with it (gh#220).
  -->
  <bfSection label="Featured projects" heading="Projects">
    <ul
      class="grid"
      role="list"
      data-min-width="xl"
      data-gap="m"
    >
      <bfCardProject
        v-for="p in projectCards"
        :key="p.slug"
        :project="p"
        media
        :chips="false"
        :excerpt-length="160"
        :heading-level="3"
      />
    </ul>

    <p><NuxtLink to="/projects"><strong>All projects<span aria-hidden="true"> →</span></strong></NuxtLink></p>
  </bfSection>

  <!--
    Zone 4 — Insights, with the highlights folded in as a featured strip.

    The Transponder issue leads the grid as a full-width "special" card instead
    of sitting in its own band above (Claudio, Sep 2). Nothing here says so:
    `bfCardProduct` sets `span="full"` on its own `bfCard` root by default
    (#26), and `bfCard`'s stylesheet resolves `[data-span="full"]` to
    `grid-column: 1 / -1` at any resolved column count. The page passes no span
    at all — which is the point of the wrapper owning it.

    Same `data-min-width="xl"` as the band above, same reason, replacing the
    same inline `repeat(2, 1fr)`. `role="list"` likewise (gh#220).
  -->
  <bfSection label="Insights" heading="Insights">
    <ul
      class="grid"
      role="list"
      data-min-width="xl"
      data-gap="m"
    >
      <bfCardProduct
        v-for="prod in products"
        :key="prod.slug"
        :product="prod"
        :heading-level="3"
      />
      <bfCardFeatured
        v-for="h in featured"
        :key="h.slug"
        :item="h"
        :heading-level="3"
      />
    </ul>

    <!--
      THE insights grid (#42) — the same component every other insights view
      uses, so this band and `/insights` cannot drift apart in layout. Its own
      `minWidth` default (`l`, three columns at desktop) is deliberately left
      alone: the two-column bands above are the special cases, not this one.
    -->
    <bfGridInsights
      :insights="latest"
      :excerpt-length="160"
      :extra-chips="insightChips"
      :heading-level="3"
    />

    <p><NuxtLink to="/insights"><strong>All insights<span aria-hidden="true"> →</span></strong></NuxtLink></p>
  </bfSection>
</template>
