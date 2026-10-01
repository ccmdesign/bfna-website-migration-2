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
import contact from '~/assets/bf-data/contact.json'

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

/** Keep the opening paragraph in the hero and the remaining copy below it. */
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

  <!-- Match the program page's split hero and centered introduction. -->
  <bfSection
    class="bf-about-hero"
    label="Mission"
    aria-labelledby="about-heading"
    data-scrim="full"
    gap="m"
    padded
  >
    <template #bleed>
      <bfHeroMedia :src="about?.image ?? '/images/hero/about.jpg'" alt="" />
    </template>
    <bfBreadcrumb :items="[{ label: 'Home', to: '/' }, { label: 'About' }]" />
    <div class="switcher bf-about-hero__columns" data-threshold="s" data-gap="xl">
      <div class="stack" data-gap="m">
        <h1 id="about-heading" class="bf-about-hero__heading">{{ about?.heading ?? 'About Us' }}</h1>
        <div>
          <bfButton to="#team" variant="primary" size="l">Meet our team</bfButton>
        </div>
      </div>
      <p v-if="missionLede" class="bf-about-hero__intro">{{ missionLede }}</p>
    </div>
  </bfSection>

  <bfSection v-if="missionBody.length" label="Mission statement">
    <div class="stack bf-about-mission__body" data-gap="s" data-measure="narrow">
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

  <!-- Verified contact data is shared separately from the presentational band. -->
  <bfContactSection
    id="contact"
    data-rule="program"
    :email="contact.email"
    :address="contact.address"
  />
</template>

<style scoped>
@layer components {
  .bf-about-hero {
    --_bf-section-padding-block: var(--space-2xl);

    position: relative;
    isolation: isolate;
    display: grid;
    align-content: center;
    color: var(--color-text-inverse);
  }

  .bf-about-hero__columns {
    align-items: baseline;
  }

  .bf-about-hero__columns > * {
    min-inline-size: 0;
  }

  .bf-about-hero__heading {
    font-size: clamp(var(--size-2), 4.5vw, var(--size-5));
    text-wrap: balance;
  }

  .bf-about-hero__intro {
    margin: 0;
    font-size: clamp(1rem, 1.75vw, var(--size-1));
    line-height: 1.4;
    text-wrap: pretty;
  }

  .bf-about-hero :deep(.bf-breadcrumb) {
    --_bf-breadcrumb-separator-color: var(--color-text-inverse);
    --_bf-breadcrumb-focus-color: var(--color-text-inverse);
  }

  .bf-about-hero :deep(.bf-button[data-variant='primary']) {
    border-color: var(--color-text-inverse);
    background: var(--color-surface-page);
    color: var(--color-accent);
  }

  .bf-about-hero :deep(:focus-visible),
  .bf-about-hero :deep(.bf-button:focus-visible) {
    outline-color: var(--color-text-inverse);
  }

  .bf-about-mission__body {
    margin-inline: auto;
  }

  .bf-about-prose {
    max-inline-size: calc(60ch * var(--size-0) / 1em);
    text-wrap: pretty;
  }

  @media (width >= 48rem) {
    .bf-about-hero {
      --_bf-section-padding-block: var(--space-xl);

      aspect-ratio: 16 / 8;
    }
  }

  @media (width < 48rem) {
    .bf-about-hero__columns {
      flex-flow: column nowrap;
      align-items: stretch;
    }

    .bf-about-hero__columns > * {
      flex: none;
    }
  }

  /* The shared quarter-width grid reflows to three and then two columns.
     Extra row space separates portraits from the preceding row's roles. */
  .bf-about-people {
    row-gap: var(--space-xl);
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

    The wide photograph keeps the standard media radius.
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
