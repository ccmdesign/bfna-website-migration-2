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
 * ## The bands, in wireframe order
 *
 *  1. **Announcement** — not this page's. `bf-default` renders the site
 *     band between the nav and `<main>` on every route (Wave 1), so it sits
 *     above the hero instead of on its photograph, where at 375px it covered
 *     the `<h1>`.
 *  2. **Hero** — `homePage()`'s heading and description, and one primary CTA,
 *     set in the sky of the Capitol / Reichstag pair (see the hero's own
 *     comment and the stylesheet for how it stays legible).
 *  3. **Programs** — the three `bfPrograms` rows, passed **whole**.
 *  4. **Featured projects** — the four curated flagships, with media.
 *  5. **Insights** — the Transponder as a full-span product card and the four
 *     curated highlights under it: the band's lead and its list.
 *  6. **Latest insights** — the six newest active insights and the way into
 *     the full feed.
 *
 * The wireframe's order, with one regroup (refined pass, Sep 2026): its
 * single Insights band is split in two where its content changes kind. The
 * first half is **curated** — the magazine and the highlights someone chose
 * — and the second is **chronological**, the newest six, and that is the
 * half a returning reader is looking for. As one band they ran ~2,000px under
 * one `<h2>` with the same `m` step between the two grids as between the
 * cards inside them, so nothing on the page said where the chosen pieces
 * stopped and the latest began. Two headed bands give that seam a name, a
 * landmark and `bfSection`'s `2xl` step between headed bands, and the
 * outline stays flat — two `<h2>`s over `<h3>` cards — where an `<h3>`
 * subheading inside one band would have sat as a peer of the card titles it
 * introduced. Nothing moved between the halves, and the Transponder still
 * leads the curated grid (Claudio, Sep 2).
 *
 * ## No `useHead` title
 *
 * Deliberate. `bf-default`'s `titleTemplate` has a branch for exactly this
 * page: a route that sets no title renders `Bertelsmann Foundation North
 * America` alone, rather than the site name twice.
 */
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

</script>

<template>
  <!--
    No wrapper element. `bf-default`'s `<main class="stack" data-gap="xl">` is
    the page's own stack, so a `<div>` here would swallow the bands into one
    stack child and collapse the rhythm between them to nothing.
  -->

  <!--
    Zone 1 — the hero. `home` is `pages.json`'s `home` row: the GGS value prop
    and Irene's About Us opening.

    The CTA is passed as slot content, unconditionally — the label and target
    are Irene's (Aug 5): "Explore our work", pointing at the Democracy hub,
    matching the two programme hubs. The wireframe's "Get our newsletter" was
    removed there and is not reinstated here; no newsletter exists.

    `/democracy`, not `/wireframes/democracy`: the hub route of BRIEF §7.

    The photographs are the Capitol / Reichstag pair from
    `_process/scoping/hero-capitol-reichstag-notes.md` (rounds 5–8): one sky,
    the same clouds in the same places, each building on the bottom edge of a
    square frame, crossfaded by `bfHeroMedia`. They are that exploration's,
    and this page only points at them. **Local, not the Directus URL the
    content layer stores**: `bfMedia` routes a root-relative path through
    `NuxtImg`, and `bfHeroMedia` passes a screen-by-screen `sizes` with it so
    the module emits width descriptors against `nuxt.config.ts`'s `screens`
    ladder. An absolute `https://` URL goes to the browser untouched and gets
    none of that. No `imageAlt`: the picture is decorative and the `<h1>`
    beside it carries the meaning.

    `image-sizes` says how wide the square is really drawn. Below ~576px the
    band is taller than it is wide (its 36rem floor, below), so `cover`
    scales the square to the band's height — 576px wide on a 320px phone —
    and the default `100vw` candidate was stretched 1.8x. So the two phone
    screens name the drawn width in `px` (a `rem` entry would be dropped by
    `@nuxt/image` without a word), and from `md` up, where the band is
    landscape, it is the viewport's.

    `scrim="none"` is `bfHero`'s ink mode: no scrim, and the band keeps the
    page's dark ink, focus ring and button paint — see the stylesheet for
    why this sky wants it and the contrast it measured.

    Everything else about the band — its height, its crop, the ink the copy
    is set in and where the copy sits — is `.bf-home-hero` in the stylesheet
    below, and the reasoning is there. It was an inline `style` until the
    refined pass, which no ordinary rule can outrank (the `bfMedia` lesson,
    gh#26).
  -->
  <bfHero
    class="bf-home-hero"
    :heading="home?.heading"
    :description="home?.description"
    image="/images/hero/homepage-capitol-square.jpg"
    image-secondary="/images/hero/homepage-reichstag-square.jpg"
    image-sizes="xs:576px sm:640px md:100vw lg:100vw xl:100vw xxl:100vw"
    scrim="none"
  >
    <bfButton to="/democracy" variant="primary" size="l">Explore our work</bfButton>
  </bfHero>

  <!--
    Zone 2 — Programs. GGS order: identity first.

    `data-rule="program"` on this band and the three below is `bfSection`'s
    section rule, which every headed band on a landing page opens on (see
    `Section.vue`, "The section rule"). No band here is one programme's —
    even the Programs band holds all three — so every bar is the neutral
    navy `:root` default.

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
  <bfSection data-rule="program" label="Programs" heading="Our Programs">
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
    mirrors the wireframe: this band drops the cards' chips, and the shared
    grid takes no `chips` prop. The pictures are no longer this band's alone —
    `media` is `bfCardProject`'s default, and the grids show media whenever
    every row they render has an image — so no `media` attribute is passed.

    `data-min-width="xl"` replaces the wireframe's inline two-column track
    list (D9 — no `bf-*` file authors a column count, and the acceptance greps
    this file to prove it). Per D-42.2's measured table a 400px track floor
    resolves **2 tracks** at a desktop width and collapses to one below, which
    is the pinned layout's intent plus the reflow it never had. Four cards on
    two tracks is also the only count that never leaves a card alone on its
    row: the `l` and `m` floors resolve three tracks at a tablet width and
    strand the fourth.

    `role="list"` for the reason given at the Programs list above: the reset
    strips the marker from every `ul[class]` and WebKit drops the implicit list
    role with it (gh#220).
  -->
  <bfSection data-rule="program" label="Featured projects" heading="Projects">
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
        :chips="false"
        :excerpt-length="160"
        :heading-level="3"
      />
    </ul>

    <p><NuxtLink class="bf-more-link" to="/projects">All projects<span class="bf-more-link__arrow" aria-hidden="true" /></NuxtLink></p>
  </bfSection>

  <!--
    Zone 4 — Insights: the curated half. The Transponder issue and the four
    highlights, as one lead-and-list group.

    The Transponder issue leads the grid as a full-width "special" card instead
    of sitting in its own band above (Claudio, Sep 2). Nothing here says so:
    `bfCardProduct` sets `span="full"` on its own `bfCard` root by default
    (#26), and `bfCard`'s stylesheet resolves `[data-span="full"]` to the whole
    row at any resolved column count. The page passes no span at all — which
    is the point of the wrapper owning it. The same stylesheet's lead-and-list
    rule is why the four highlights under it carry no pictures: `bfCard` hides
    the media of every card after a full-width picture card, so the
    magazine's cover is the group's one image, whatever pictures the
    highlights' rows carry.

    Same `data-min-width="xl"` as the band above, same reason, replacing the
    same inline two-column track list. `role="list"` likewise (gh#220).
  -->
  <bfSection data-rule="program" label="Insights" heading="Insights">
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
  </bfSection>

  <!--
    Zone 5 — Latest insights: the chronological half, split from the band
    above in the refined pass (header docblock, "The bands"). Its own `<h2>`,
    so the cards stay `<h3>` — the outline is two bands of cards, not a band
    with a subheading sitting among its own card titles.

    THE insights grid (#42) — the same component every other insights view
    uses, so this band and `/insights` cannot drift apart in layout. Its own
    `minWidth` default (`l`, three columns at desktop) is deliberately left
    alone: the two-column bands above are the special cases, not this one.
    Six rows on three tracks, or on two, fill every row they start.

    The "All insights" link closes this band rather than the curated one: it
    goes to the feed, and the feed is what these six are the top of.
  -->
  <bfSection data-rule="program" label="Latest insights" heading="Latest insights">
    <bfGridInsights
      :insights="latest"
      :excerpt-length="160"
      :heading-level="3"
    />

    <p><NuxtLink class="bf-more-link" to="/insights">All insights<span class="bf-more-link__arrow" aria-hidden="true" /></NuxtLink></p>
  </bfSection>
</template>

<style scoped>
/*
  The page's own skin: the hero's composition over its photograph. The
  "All … →" links are the shared `.bf-more-link`, and everything else on the
  route is `bf-*` and styles itself.

  Wrapped in `@layer components`, like every page-level rule (gh#68 — an
  unlayered page rule outranks every layer; this block was unlayered until
  the refined pass). Scoped: a child component's root carries its parent's
  scope id, so `.bf-home-hero` matches on `bfHero`'s `<section>`, and every
  rule below that reaches past that root says so with `:deep()`. All colour
  is semantic tokens; no `:not()` (D-20.5).
*/
@layer components {
  /*
    ## The hero: the copy in the sky, in ink

    The photograph is a square: open sky over the top seventy percent, the
    building across the bottom quarter, cropped by `object-fit: cover` from
    the bottom edge (`center bottom`) so a taller band only ever gains sky.
    The height hook keeps the band 16:9 on a desktop and never taller than
    the viewport (round 5 of the scoping notes) — at 16:9 the visible window
    is the bottom 56% of the square, and the building fills the lower half
    of it.

    Two things were wrong on that ground, and both were measured:

    1. **The copy sat on the building.** `bfHero` centres its column in the
       band (`align-content: center`), which is right for a photograph with
       no subject and wrong for this one: at 1280px the standfirst ran across
       the Capitol's dome. Here the column starts from the top instead, a
       `2xl` step under the notice, so it lives in the sky and the building
       keeps the bottom of the frame to itself.
    2. **White type on this sky fails.** The scrim is off on this band — the
       0.70 navy the system uses over photographs flattens the blue sky the
       pair was made for (scoping notes, round 4) — and bare white on the
       sky measured 3.0:1 at best, and 1.0:1 wherever a cloud passed behind
       a line (the table below). Restoring the scrim would buy legibility by
       painting out the sky; `panel` would put a navy column over the dome.

    So the copy is set in the page's **ink** rather than inverted, in two
    steps of the navy family: the heading in `--color-accent-super-dark`,
    the standfirst in `--color-accent-dark`, the darker of the two because it
    is the small, light-weight text. Every value this sky has is light —
    azure, cloud, stone — and dark ink reads over all three, where white
    reads over none of them.

    Measured over the rendered band with the copy hidden, at the **darkest
    pixel** under any line box, both photographs, thirteen widths from 320
    to 1920px (refined pass, Sep 2026):

    | line       | ink                 | worst | needs | white was |
    |------------|---------------------|-------|-------|-----------|
    | heading    | accent-super-dark   | 3.91  | 3.0   | 1.00–3.00 |
    | standfirst | accent-dark         | 5.78  | 4.5   | 1.01–2.46 |

    The heading's floor is on a phone, where the band shows the deepest
    blue at the top of the sky; from 900px up it is ~5:1. The brand
    navy itself (`--color-accent`) measured 3.05 there — a pass by a hair —
    which is why the heading takes the next step down.

    The rule gh#253 wrote down — "over media, type is white" — was measured
    for a blown-out white photograph under a scrim; this band has no scrim
    and its photograph is not blown out, which is the case that rule did not
    cover. **A new photograph voids the table**: re-measure before swapping
    either file.

    The CTA is untouched: `primary` is an opaque navy fill with white type,
    which does not composite with the photograph.

    Specificity, stated because it is load-bearing: every rule here that
    undoes one of `bfHero`'s carries exactly one compound more than the rule
    it undoes — `.bf-home-hero` on top of `bfHero`'s own class — so the page
    wins by specificity in the same layer, never by stylesheet order.
  */
  .bf-home-hero.bf-hero {
    /*
      16:9 on a desktop, never taller than the viewport, 60svh at least (the
      wireframe's floor) — and on a phone, tall enough that the copy clears
      the building. A portrait band shows the whole square scaled to its
      height, so the building's top — the Statue of Freedom, 72% of the way
      down the frame — sits at 0.72 of the band. At 320–430px the copy ends
      ~24rem down the band (its top padding included), so the band needs
      ~36rem before that line falls below the button: measured, the statue
      clears the CTA by 25–40px across that range. A `rem` floor rather than
      a `vw` one because the copy's height grows as the phone narrows, and
      `vw` would shrink the band as it did. From ~1024px up `56.25vw` is
      larger, so the floor is inert on a desktop.
    */
    --_bf-hero-min-height: max(36rem, 60svh, min(56.25vw, 100svh));
    --_bf-hero-media-image-position: center bottom;

    /* The copy from the top of the sky, not the middle of the band. */
    align-content: start;
    padding-block: var(--space-2xl) var(--space-xl);
  }

  /*
    The ink. `color` on the band, so the standfirst and anything else in the
    column inherit it; the heading takes the lighter of the two navies, so
    it still reads as the brand's colour at display size. Contrast, worst
    pixel under any line, both photographs: the table above.

    The rest of the light-ground treatment is `bfHero`'s ink mode
    (`scrim="none"` in the template): no scrim fill, and none of the band's
    inversions — the focus ring stays `base/focus.css`'s dark one, which is
    what a light ground wants, and the buttons keep their own paint. This
    page used to override five of `bfHero`'s rules to get there.
  */
  .bf-home-hero.bf-hero--ink {
    color: var(--color-accent-dark);
  }

  .bf-home-hero :deep(.bf-hero__heading) {
    color: var(--color-accent-super-dark);
  }

  /*
    The first band after the hero stands the same `2xl` off it that every
    headed band stands off the band before it (`bfSection`'s band rhythm).
    That rule is keyed on `.bf-section + .bf-section`, and the hero is not a
    `bfSection`, so without this the first heading on the page sat a step
    closer to the photograph than any heading below it sits to its grid.
  */
  .bf-home-hero + .bf-section {
    margin-block-start: var(--space-2xl);
  }
}
</style>
