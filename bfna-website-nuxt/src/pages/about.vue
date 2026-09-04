<script setup lang="ts">
/**
 * `/about` — mission, Board, Team, the Stiftung relationship, contact
 * (issue 53 / gh#62).
 *
 * Descends from `src/pages/wireframes/about.vue`, which is frozen (D2): read
 * for its band order, its copy and its two client comments about *why* the
 * bands are shaped this way, never edited, and nothing here imports from it.
 *
 * This file **retires the legacy `/about`** — the one file issue 53 deletes
 * (`02-legacy-retirement-inventory.md` §A). What it replaced was a hardcoded
 * in-component `aboutData` object rendered through `LegacyMoleculesHero` and
 * `LegacyMoleculesVideoSection`, with the mission copy, the five "what we do"
 * statements and the Stiftung button written as literals in the template. It
 * made no Directus call, so nothing was lost by dropping it: every string
 * below arrives from `bfPages` / `bfPeople`. There is no `about.vue.legacy`
 * companion, deliberately — the spec's acceptance greps for its absence.
 *
 * `src/pages/team.vue`, the standalone legacy `/team` route, is **not** touched
 * here: #66 redirects it to `/about#team` and #67 deletes it. The `#team`
 * anchor below is what makes that redirect land somewhere.
 *
 * ## The three anchor ids
 *
 * `#board`, `#team` and `#contact` are real ids on the three `<section>`
 * elements, matching the frozen source exactly. None of the three is written
 * by a component: each is a plain `id` attribute at this call site, and it
 * reaches the DOM through `bfSection`'s `$attrs` allow-list, which forwards
 * `id` (and `class`, `style`, `role`, `data-*`, `aria-*`, listeners) while
 * dropping prop-shaped junk. `bfContactSection`'s own root **is** a
 * `bfSection`, so `id="contact"` falls through it and then through that
 * allow-list — two hops, one attribute. The generated HTML is grepped for all
 * three in this issue's acceptance rather than the chain being trusted.
 *
 * ## Board 4 + Team 10 = 14 cards over 13 people
 *
 * The two lists are not a partition, and `useBfPeople` documents why at
 * length: `irene-braam` carries `board: true` *and* the job title "Executive
 * Director", so she joins the Board while staying in Team — the client's own
 * decision (Irene, Aug 5). The spec's "13 people render across the two grids"
 * counts **people**; the rendered card count is 14. See this issue's
 * Decisions.
 *
 * ## Data
 *
 * A page may call a composable; a `bf-*` component may not (D8). Every read on
 * this route happens in the two awaited calls below, and every component under
 * `<template>` receives entities as props. The imports are explicit because
 * Nuxt scans `composables/` one directory deep for `index` files only, and
 * these live at `composables/data/useBf*.ts`.
 */
import { useBfPages } from '~/composables/data/useBfPages'
import { useBfPeople } from '~/composables/data/useBfPeople'
import { paragraphs } from '~/utils/format'

defineOptions({ name: 'AboutPage' })

definePageMeta({ layout: 'bf-default' })

const { aboutPage, stiftungPage } = await useBfPages()
const { boardMembers, teamMembers } = await useBfPeople()

/** The mission deck — `pages.json`'s `about` row. */
const about = aboutPage()

/** The relationship block — `pages.json`'s `stiftung` row. */
const stiftung = stiftungPage()

/**
 * Both lists resolved once, at setup, rather than called from the template.
 *
 * `boardMembers()` filters and `teamMembers()` filters *and* sorts; a call in
 * a template re-runs on every render, and each run would hand `v-for` a fresh
 * array whose `:key` is then comparing new object identities. The content is
 * build-time static, so one pass is all it can ever need. Same shape
 * `/projects` and `/{program}` already use.
 */
const board = boardMembers()
const team = teamMembers()

/**
 * The two bodies, split on blank lines. `paragraphs()` is the shared formatter
 * in `~/utils/format`, the bf-side of the frozen source's
 * `useWfContent().paragraphs` — the split is not re-implemented here.
 *
 * Hoisted out of the template for the reason the two people lists are, one
 * paragraph up: a call in a template re-runs on every render and hands the
 * consumer a fresh array whose `:key`/prop identity has changed for no reason.
 * The frozen source calls `paragraphs()` inline in both places; that is the one
 * shape not carried over.
 */
const aboutTagline = computed(() => paragraphs(about?.description))
const stiftungParagraphs = computed(() => paragraphs(stiftung?.description))

/**
 * The page's own title, added to `bf-default`'s `titleTemplate`. Set here
 * rather than left off (as `/` deliberately leaves it off) because the
 * layout's contract is that every page below the root states its own name.
 */
useHead({ title: () => about?.heading ?? 'About Us' })
</script>

<template>
  <!--
    No wrapper element: `bf-default`'s `<main class="stack" data-gap="xl">` is
    this page's own stack, and a `<div>` here would collapse every band into a
    single stack child and lose the rhythm between them.
  -->

  <!--
    Zone 1 — the mission header (GGS about template: mission, institutional
    context, connection to programs). Copy is the consolidated dataset's
    `about` row, which is Irene's Jul 29 docx.

    **The trail is two entries, not the frozen source's one** — residual
    [#188](https://github.com/ccmdesign/bfna-website-migration-2/issues/188).
    `bfBreadcrumb` treats the *last* crumb as the current page and never links
    it, positionally, so a one-entry `[{ label: 'Home', to: '/' }]` trail would
    render Home as an unlinked `<span aria-current="page">` — a breadcrumb
    claiming the reader is on the homepage, with no link in it at all. Naming
    this page as the final, unlinked crumb restores Home to a real `<a href="/">`
    and puts `aria-current="page"` where it belongs. Same two-then-current
    shape `/projects` and `/insights/<slug>` already build.

    `aboutTagline` is the stored body split on blank lines; `bfPageHeader`
    renders a `string[]` tagline as one `<p>` per entry.
  -->
  <bfPageHeader
    label="Mission"
    :crumbs="[{ label: 'Home', to: '/' }, { label: 'About' }]"
    :heading="about?.heading ?? 'About Us'"
    :tagline="aboutTagline"
  />

  <!--
    Zone 2 — the Board.

    `id="board"` is the anchor #66's `/team` sibling redirect and any inbound
    deep link land on; it reaches the `<section>` through `bfSection`'s
    allow-list, not through a prop.

    `.grid[data-min-width]` (D9) — this replaces the frozen source's inline
    three-column pin at `about.vue:13`, which held `repeat(3, 1fr)` at every
    width including a phone. No column count is authored anywhere below; the
    composition resolves it from the track floor. (The pinned property is not
    written out even inside a comment: this issue's acceptance greps the whole
    file for its name.)
    `data-min-width="m"` is a **token**, not the spec's literal `16rem`: the
    primitive matches `[data-min-width="xs|s|m|l|xl|2xl"]` and nothing else, so
    `16rem` would select no rule and silently fall back to the 240px default.
    `m` *is* that 240px — the nearest step to the 256px the spec meant, and now
    stated rather than inherited by accident. Recorded in this issue's
    Decisions.

    `:heading-level="3"` keeps each person's name under the band's `<h2>`
    (BRIEF §5 rule 9); it is also `bfCardPerson`'s default, stated so the next
    reader does not have to know that.
  -->
  <bfSection
    id="board"
    label="Board of Directors"
    heading="Board of Directors"
  >
    <ul class="grid" data-min-width="m" data-gap="m">
      <bfCardPerson
        v-for="p in board"
        :key="p.slug"
        :person="p"
        :heading-level="3"
      />
    </ul>
  </bfSection>

  <!--
    Zone 3 — the Team, alphabetical by last name (Irene, Aug 5 — the sort
    lives in `useBfPeople`, not here). Same grid, same reason, replacing the
    frozen source's second pinned three-column grid (`about.vue:19`).

    Irene Braam appears in this band *and* in the Board band above. That is not
    a duplicate to be de-duplicated: she joins the Board while staying
    Executive Director, and the two predicates that produce it are the
    client's. `useBfPeople` carries the full note.
  -->
  <bfSection
    id="team"
    label="Team"
    heading="Team"
  >
    <ul class="grid" data-min-width="m" data-gap="m">
      <bfCardPerson
        v-for="p in team"
        :key="p.slug"
        :person="p"
        :heading-level="3"
      />
    </ul>
  </bfSection>

  <!--
    Zone 4 — the Bertelsmann Stiftung relationship. Live-site
    `/bertelsmann-stiftung` copy plus the repo's own hero image, exactly as the
    frozen source pairs them.

    `layout="switcher"` and `gap="l"` are the frozen source's two arguments,
    kept: the image and the text sit side by side above the composition's
    threshold and stack under it, with no media query and no column count.

    The `<h2>` is slot content rather than `bfSection`'s `heading` prop because
    the frozen source puts it *inside* the text column, beside the image rather
    than above both — passing the prop would render a third heading above the
    switcher. `bfSection`'s `label` still names the band as a landmark.

    `bfMedia` replaces the frozen source's `<img>` and its five inline
    declarations (`min-width: 0; max-width: 100%; height: auto;
    object-fit: cover; align-self: start`): `inline-size: 100%`,
    `object-fit: cover` and a `--_bf-media-ratio` are the component's own base
    rules, so the only thing left to say here is the proportion. `alt` is real
    text, not `""` — this image is the subject of the band, not decoration for
    a heading that already names it.

    Irene (Jul 30, via Megan): keep photo + text only — the old "image film"
    link is deliberately not restored.
  -->
  <bfSection
    label="Bertelsmann Stiftung"
    layout="switcher"
    gap="l"
  >
    <bfMedia
      src="/images/hero/stiftung.jpg"
      alt="Bertelsmann Stiftung headquarters"
      ratio="4/3"
    />

    <div class="stack" data-gap="s">
      <h2 class="bf-section__heading">{{ stiftung?.heading }}</h2>
      <p v-for="(para, i) in stiftungParagraphs" :key="i">{{ para }}</p>
    </div>
  </bfSection>

  <!--
    Zone 5 — contact. Every string is the component's own default, as in the
    frozen source, which passes it nothing either. `id="contact"` falls through
    `bfContactSection` to its `bfSection` root and out through that
    allow-list.
  -->
  <bfContactSection id="contact" />
</template>
