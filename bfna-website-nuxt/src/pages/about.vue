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
const aboutParagraphs = computed(() => paragraphs(about?.description))
const stiftungParagraphs = computed(() => paragraphs(stiftung?.description))

/**
 * The mission, as the body under the masthead (refined pass, Sep 2026; final
 * pass). All four paragraphs used to be the header's tagline, so the masthead
 * ran a full desktop viewport of paper before the first name on the page.
 * The refined pass kept the first paragraph there as a standfirst, which
 * still set seventy words at the lede step on the paper — nine lines at 375,
 * where every other index header carries one line at body size.
 *
 * So the header is the trail and the `<h1>`, and the whole mission is the
 * band under it: the first paragraph as its lede — who the Foundation is and
 * how it works, one step up — and the other three as the body. That is the
 * split the insight and project pages make, where the lede opens the body
 * and not the masthead.
 *
 * Nothing is reworded or dropped: the two slices are the one stored
 * description, in order.
 */
const missionLede = computed(() => aboutParagraphs.value[0])
const missionBody = computed(() => aboutParagraphs.value.slice(1))

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

    No tagline: the mission is the band below, lede and all (see
    `missionLede`), so the masthead is the trail and the `<h1>`, like the
    insight and project mastheads.
  -->
  <bfPageHeader
    label="Mission"
    :crumbs="[{ label: 'Home', to: '/' }, { label: 'About' }]"
    :heading="about?.heading ?? 'About Us'"
  />

  <!--
    Zone 1b — the mission, as the body under the masthead: its first
    paragraph as the lede, the rest as body.

    No heading: it is the text the `<h1>` titles, not a new subject, so it
    neither takes a band heading nor needs a landmark name (`bfSection` names
    a band from its heading, and this one has none to name). The reading
    column and the paragraph rhythm are the page's own — `.bf-about-prose` in
    the `<style>` block, shared with the Stiftung text below so the page's two
    runs of prose read at one measure — and the lede is `.bf-about-lede`, the
    insight lede's step.

    `v-if` so a missing description renders no empty band.
  -->
  <bfSection
    v-if="missionLede"
    label="Mission statement"
  >
    <div class="bf-about-prose | stack" data-gap="s">
      <p class="bf-about-lede">{{ missionLede }}</p>
      <p v-for="(para, i) in missionBody" :key="i">{{ para }}</p>
    </div>
  </bfSection>

  <!--
    Zone 2 — the Board.

    `id="board"` is the anchor #66's `/team` sibling redirect and any inbound
    deep link land on; it reaches the `<section>` through `bfSection`'s
    allow-list, not through a prop. So does `data-rule="program"`,
    `bfSection`'s section rule, which every headed band on this page opens
    on (see `Section.vue`, "The section rule"): no band here is one
    programme's, so its bar is the neutral navy `:root` default.

    `.grid` (D9) — this replaces the frozen source's inline three-column pin
    at `about.vue:13`, which held `repeat(3, 1fr)` at every width including a
    phone. No column count is authored anywhere below; the composition
    resolves it from the track floor. (The pinned property is not written out
    even inside a comment: this issue's acceptance greps the whole file for
    its name.)

    The floor is the grid's proportional `quarter` step, not a fixed one
    (refined pass, Sep 2026). The `m` step (240px) this list used to carry
    gave four columns at the desktop measure and **one** on a phone, where fourteen
    full-width portraits made the two bands 6,300px of scrolling — a third of
    the page's length for fourteen names. No single fixed floor gives four
    columns at 1100px and two at 320px (the ratio between the widths is 3.4,
    so a floor small enough for two on a phone gives five or six on a
    desktop), so the floor is proportional instead: a fraction of the list's
    own width, never under a size a portrait still reads at. The `<style>`
    block has the arithmetic; `composition/grid.css` has the step.

    `:heading-level="3"` keeps each person's name under the band's `<h2>`
    (BRIEF §5 rule 9); it is also `bfCardPerson`'s default, stated so the next
    reader does not have to know that.

    `role="list"` is not redundant: `base/reset.css:95-103` strips `list-style`
    from every `ul[class]`, and WebKit reads that declaration as the author no
    longer meaning a list — VoiceOver stops saying "list, N items" and stops
    offering list navigation. Restating the implicit role puts the semantics
    back without putting the bullets back. Same fix and same reason as
    `nav/Dropdown.vue:109` and `Breadcrumb.vue:238-240` (gh#220, D27). The Team
    list below carries it for the same reason.
  -->
  <bfSection
    id="board"
    data-rule="program"
    label="Board of Directors"
    heading="Board of Directors"
  >
    <ul
      class="grid bf-about-people"
      role="list"
      data-min-width="quarter"
      data-gap="m"
    >
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
    data-rule="program"
    label="Team"
    heading="Team"
  >
    <ul
      class="grid bf-about-people"
      role="list"
      data-min-width="quarter"
      data-gap="m"
    >
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

    **Stacked, not side by side** (refined pass, Sep 2026). The frozen source
    passes `layout="switcher"` and `gap="l"`, and this band kept both until
    the refined pass measured what they did with this photograph. The file
    is a 1600 × 774 panorama — the headquarters across the lake — and in the
    switcher it took its natural width as its minimum: at 1280 the picture
    claimed 800px, stretched to the height of the text and cropped to a
    near-square, and the three paragraphs ran down a 260px column at ~27
    characters a line. Fixing the minimum only traded that for a 4:3 crop
    of a 2:1 picture beside a column twice its height.

    So the band opens on its heading like Board and Team above it, the
    photograph runs the full measure at close to its own proportion — the
    insight page's lead-image shape, and the one wide picture on a page of
    portraits — and the text sits under it in the page's reading column.
    Opening on the heading also gives the band the `--space-2xl` step
    `bfSection` keys on a first-child heading, so it stands off the Team
    grid the way Team stands off the Board.

    The heading is now `bfSection`'s `heading` prop, which puts the `id` on
    the `<h2>` and points the `<section>`'s `aria-labelledby` at it — the
    band was a generic container before (the slotted `<h2>` had no id, and
    `bfSection` warned in dev), and is a named region now. `?? undefined`
    because the schema's `heading` is nullable and the prop is not: a
    missing heading renders no `<h2>` and no idref, never an empty one.

    `bfMedia` replaces the frozen source's `<img>` and its five inline
    declarations. No `ratio` prop: the prop writes the ratio **inline**, and
    the proportion here changes with the width (see the `<style>` block), so
    it is set through the `--_bf-media-ratio` hook from the stylesheet
    instead. `alt` is real text, not `""` — this image is the subject of the
    band, not decoration for a heading that already names it.

    Irene (Jul 30, via Megan): keep photo + text only — the old "image film"
    link is deliberately not restored.
  -->
  <bfSection
    class="bf-about-stiftung"
    data-rule="program"
    label="Bertelsmann Stiftung"
    :heading="stiftung?.heading ?? undefined"
  >
    <bfMedia
      src="/images/hero/stiftung.jpg"
      alt="Bertelsmann Stiftung headquarters"
    />

    <div class="bf-about-prose | stack" data-gap="s">
      <p v-for="(para, i) in stiftungParagraphs" :key="i">{{ para }}</p>
    </div>
  </bfSection>

  <!--
    Zone 5 — contact. Every string is the component's own default, as in the
    frozen source, which passes it nothing either. `id="contact"` falls through
    `bfContactSection` to its `bfSection` root and out through that
    allow-list.

    The street address is still the component's placeholder — the Directus
    contact singleton has not landed, and an address is not something a page
    may invent (BRIEF §5 rule 10). It stays visible until it arrives as the
    `address` prop.

    The band names itself: `bfContactSection` points its region's
    `aria-labelledby` at its form column's `<h2>`, so the name is the visible
    heading and cannot drift from it. (This call site used to add an
    `aria-label` for it.) `data-rule` falls through to the same root, and the
    component draws the rule over each of its two column headings.
  -->
  <bfContactSection id="contact" data-rule="program" />
</template>

<style scoped>
/*
  The page's own skin: the reading column and its lede, the people grids
  and the Stiftung photograph. Everything else on the route is `bf-*` and
  styles itself. Where a rule reaches a component's element it goes through
  that component's `--_bf-*` hook, from a page class, with `:deep()` —
  never by restating a component's own declarations.

  Wrapped in `@layer components`, like every page-level rule (gh#68 — an
  unlayered page rule outranks every layer). Tokens only, no colour at all,
  and no `:not()` (D-20.5).

  Scoped selectors land on a band's root because a child component's root
  element carries its parent's scope id: `bfSection` renders a `<section>`,
  so `.bf-about-stiftung` matches there, and `:deep()` reaches what is inside
  it.
*/
@layer components {
  /*
    The reading column: 60ch of the type that is actually set, the insight
    page's measure (`article.css`, "The reading column") — ~70 characters
    of IBM Plex Sans light at the 20px body step, where the band's 1100px
    ran a line of prose past 120. `ch` and `em` scale together, so the
    expression resolves to the same width on any element set in the body
    face, whatever its size: the mission body and the Stiftung text share
    it, and the mission's lede wraps to the same right edge at its larger
    size.

    Left-aligned in the band, not centred as the article's is: this page
    also carries two grids at the full measure, and one left edge down the
    page — breadcrumb, title, lede, band headings, prose — holds it
    together better than a centred column between them.
  */
  .bf-about-prose {
    --_bf-about-measure: calc(60ch * var(--size-0) / 1em);
  }

  .bf-about-prose {
    max-inline-size: var(--_bf-about-measure);
    text-wrap: pretty;
  }

  /*
    The lede — the mission's first paragraph, opening the band one step
    above the body. The insight lede (`.bf-article-lede`) and the project
    lede, exactly: the body's own face and weight, `--size-1`, leading 1.4,
    in the reading column. The size alone carries the role; a paragraph of
    seventy words in the display italic the article keeps for its one-line
    subheading would read as a pull quote. `text-wrap: pretty` comes from
    `.bf-about-prose`, its parent.
  */
  .bf-about-lede {
    font-size: var(--size-1);
    line-height: 1.4;
  }

  /*
    ## The people grids

    One floor for both lists, proportional to the list's own width:

      track floor = max(min(11rem, 45%), 22%)

    - 22% gives four columns at every width from ~800px of list up, and never
      five — four tracks of 22% plus three gaps fit, five cannot — so the
      desktop measure keeps the four-up grid it had (252px cards at 1280).
    - `min(11rem, 45%)` holds the phone at two: at 375 the list is 346px,
      45% of it is under 11rem, and two 162px cards fit; at 320 two 135px
      cards still do. Under that the primitive's own `min(…, 100%)` drops to
      one column rather than overflowing.
    - Between the two it is 11rem (176px): two columns to ~560px of list,
      three to ~800px — 640 and 768 wide are three columns of 190–230px.

    The phone floor was a flat 8rem until the final pass, and 8rem is also
    what it held a tablet to: four 134–165px cards at 640–768 and three
    135px ones at 480, whose ~100px text box cut the longer job titles
    mid-word ("Director, BFNA Documentarie"). The rem floor now rises with
    the width until 22% takes over.

    The floor is the grid primitive's own `data-min-width="quarter"` step
    (`composition/grid.css`), which is this value and is changed there, not
    here: it was written to the primitive's private `--_grid-min-width` from
    here until it had a name, and a directory-style grid (people, logos) can
    ask for it by name.

    The list is also its own query container, so the cards can tighten by
    the width the list actually has (below) rather than by the viewport.
  */
  .bf-about-people {
    container: bf-about-people / inline-size;
  }

  /*
    Two-up on a phone, the card's own padding (`--space-m`, 21px at 375) left
    a 119px portrait inside a 162px card. The card's `--_bf-card-padding`
    hook steps down to `--space-s`, so the portrait gets back 15px and the
    name one more character a line; the card is still the family's card —
    ground, radius and elevation untouched. Keyed on the list at 40rem, the
    width under which its tracks are phone-sized. (0,3,0) once scoped,
    against `bfCard`'s (0,1,0) in the same layer.
  */
  @container bf-about-people (max-width: 40rem) {
    .bf-about-people :deep(.bf-card) {
      --_bf-card-padding: var(--space-s);
    }
  }

  /*
    A role is data, not an excerpt, so it is never clamped. `bfCard` clamps
    a media card's paragraph at four lines so a row of excerpts keeps one
    rhythm; a person card's one paragraph is the job title, and at four
    lines "Executive Board and Chief Operating Officer" lost its last word
    at every phone and tablet width. Here it sets whole and wraps where it
    must — hyphenated, and broken mid-word only when one word is wider than
    the card. The grid still aligns: the cards stretch to the row's tallest.

    Written through the same `:has()` the clamp is keyed on, so it outranks
    `bfCard`'s (0,4,1) at (0,5,1) once scoped, in the same layer.
  */
  .bf-about-people :deep(.bf-card:has(> .bf-card__media) .bf-card__text > p) {
    display: block;
    overflow: visible;
    -webkit-line-clamp: unset;
    line-clamp: none;
    overflow-wrap: break-word;
    hyphens: auto;
  }

  /*
    ## The Stiftung photograph

    Close to the file's own 2.07:1 on a phone (`2 / 1`), so the headquarters
    and the lake both survive at 346px; a touch wider at the desktop measure
    (`5 / 2`, 1100 × 440), which trims sky and water rather than the
    building, and keeps the picture a band rather than a poster. Through
    `bfMedia`'s `--_bf-media-ratio` hook — its scoped default is (0,2,0), and
    this is (0,3,0). The 48rem step is the system's one documented
    breakpoint.

    The radius is the card media's (`--border-radius-m`), so the page's one
    wide picture is cut like its fourteen portraits.
  */
  .bf-about-stiftung :deep(.bf-media) {
    --_bf-media-ratio: 2 / 1;

    border-radius: var(--border-radius-m);
  }

  @media (width >= 48rem) {
    .bf-about-stiftung :deep(.bf-media) {
      --_bf-media-ratio: 5 / 2;
    }
  }
}
</style>
