<script setup lang="ts">
/**
 * `/projects` — the all-projects index (issue 51 / gh#60).
 *
 * Descends from `src/pages/wireframes/projects/index.vue`, which is frozen
 * (D2): read for its band order, its copy and its two comments about *why*
 * the bands are shaped this way, never edited, and nothing here imports from
 * it. Three zones, in the frozen source's order:
 *
 * 1. the page header, from the `projects` row of `bfPages`, closing on the
 *    program index — one in-page link per band, with its project count;
 * 2. one band per program — a ruled, linked `<h2>`, the program's own
 *    `tagline`, and that program's grid;
 * 3. a "Pending re-tag (Q3)" band, rendered only when that set is non-empty.
 *
 * ## The refined pass (Sep 2026)
 *
 * The page said "grouped by program" and then gave the reader nothing to
 * group by: three bare names, the same heading over the same grid, and no
 * word about what any program *is*. The pass keeps the zones, the order and
 * every string, and changes three things, all local to this file:
 *
 * - **Each band opens on a section rule** — a hairline across the column with
 *   a short bar of the program's colour at its start, the editorial device
 *   for "a new section begins" (`bfSection`'s `data-rule="program"`, shared
 *   with the hubs). The colour is the programme token (`--color-program`,
 *   gh#251), scoped by putting `data-program` on the band itself rather than
 *   on `<html>` as the hubs do, because this is the one page that shows all
 *   three at once.
 * - **Each band states its program** in the program's own `tagline` — the
 *   line the homepage's program cards already use — so a reader learns what
 *   the program is about before its projects, without leaving for the hub.
 * - **The header maps the page.** Three bands run to four screens at desktop
 *   and six on a phone, so the header ends on a short index of them: name,
 *   count, and the same colour bar, each a jump to its band.
 *
 * What stays out: no program colour on the cards or as text (the on-light
 * tier exists, but a coloured title would compete with the card titles below
 * it), and no count beside each band heading, because the index already says
 * it once.
 *
 * It retires no legacy file. `pages/projects/` did not exist, and the legacy
 * catch-all `pages/[...slug].vue` — which served the old product URLs — ranks
 * below a static route segment in vue-router, so adding this file takes
 * `/projects` from the catch-all without deleting anything (BRIEF §5 rule 7
 * asks for a deletion only where a *page file* owned the route). The product
 * branch of that catch-all is retired by #58/#57.
 *
 * ## Ordering is consumed, never re-derived (spec §Ordering, D3)
 *
 * Both orders this page renders are stored fields, materialised by the
 * normaliser and sorted once inside the composables:
 *
 * | what | stored key | sorted in |
 * |---|---|---|
 * | the three bands | `Program.order` | `useBfPrograms` (gh#180) |
 * | the cards in a band | `Project.grid_order` | `useBfProjects` (gh#89) |
 *
 * So this file calls each member once and renders what comes back. There is no
 * `.sort()` below, and `GRID_ORDER` is not named here — it lives in the
 * normaliser (#07/D3).
 *
 * ## Data
 *
 * A page may call a composable; a `bf-*` component may not (D8). Every read on
 * this route therefore happens in the three awaited calls below, and every
 * component under `<template>` receives entities as props. The imports are
 * explicit because Nuxt scans `composables/` one directory deep for `index`
 * files only, and these live at `composables/data/useBf*.ts`.
 *
 * ## What is deliberately not here
 *
 * No filters and no search — the faceted index is `/insights` (#49), and the
 * spec puts a projects filter out of scope (#54). No project detail markup
 * (#52). No product cards: `transponder-magazine` is `external_only` and
 * `grid_eligible: false`, so `gridProjectsByProgram` prunes it and it renders
 * on `/` as a `bfCardProduct` band (#47) instead.
 */
import { useBfPages } from '~/composables/data/useBfPages'
import { useBfPrograms } from '~/composables/data/useBfPrograms'
import { useBfProjects } from '~/composables/data/useBfProjects'

defineOptions({ name: 'ProjectsIndexPage' })

definePageMeta({ layout: 'bf-default' })

const { pageBySlug } = await useBfPages()
const { programs } = await useBfPrograms()
const { gridProjectsByProgram, projectsPendingRetag } = await useBfProjects()

/** The copy deck behind this index — `pages.json`'s `projects` row. */
const indexPage = pageBySlug('projects')

/**
 * The `id` of a band's linked `<h2>`, and the target of that band's
 * `aria-labelledby`.
 *
 * Derived from the program slug rather than from `useId()`: `useId()` returns
 * one value per *component instance*, and this page is one instance rendering
 * three bands, so a single id would be reused three times and the second and
 * third `aria-labelledby` would both point at the first band's heading. The
 * slug is unique by construction (it is the `/{program}` route segment) and
 * stable across the server render and the client hydration, which is the other
 * thing `useId()` is normally relied on for.
 */
const bandHeadingId = (slug: string) => `projects-band-${slug}`

/**
 * The three bands, resolved once at setup: the program, its heading id, and
 * its grid rows in the stored `grid_order`.
 *
 * Built here rather than by calling `programs()` and
 * `gridProjectsByProgram()` from the template, because a function call in a
 * template re-runs on every render — three `.filter().sort()` passes over the
 * 18 top-level projects each time, and three fresh arrays handed to
 * `bfGridProjects` whose `:key` would then be comparing new object identities.
 * The content is build-time static, so one pass is all it can ever need. This
 * is the shape `[program].vue` already uses for the same call.
 *
 * Still no re-derivation (spec §Ordering): both orders arrive sorted from the
 * composables — `Program.order` (gh#180) and `Project.grid_order` (gh#89) —
 * and nothing below reorders either.
 */
const bands = programs().map(program => ({
  program,
  headingId: bandHeadingId(program.slug),
  projects: gridProjectsByProgram(program.name)
}))

/**
 * The index entry's count line — "4 projects", "1 project".
 *
 * It counts the band's own grid rows, so it is the number of cards the jump
 * lands on, not the program's full roster: the podcasts and external-only
 * products `gridProjectsByProgram` prunes are not on this page, and counting
 * them would promise cards that are not there.
 */
const projectCount = (n: number) => `${n} ${n === 1 ? 'project' : 'projects'}`

/**
 * Legacy projects whose new program is still a `RE-TAG` placeholder (Q3),
 * archived rows excluded. Empty today — 100 Questions, the only member the
 * wireframe ever had here, is archived — which is exactly why the band below
 * is guarded rather than unconditional: an empty band would render a heading
 * over nothing.
 */
const retag = projectsPendingRetag()

/**
 * The band's own title, added once by `bf-default`'s `titleTemplate`. Set
 * here rather than left off (as `/` deliberately leaves it off) because the
 * layout's contract is that every page below the root states its own name.
 */
useHead({ title: () => indexPage?.heading ?? 'All Projects' })
</script>

<template>
  <!--
    No wrapper element: `bf-default`'s `<main class="stack" data-gap="xl">` is
    this page's own stack, and a `<div>` here would collapse every band into a
    single stack child and lose the rhythm between them.
  -->

  <!--
    Zone 1 — the index header.

    `heading` and `tagline` come from `pages.json`'s `projects` row; the
    fallback is the frozen page's own literal, kept so the page still names
    itself if that document ever disappears.

    **The trail is two entries, not the frozen source's one** — residual
    [#188](https://github.com/ccmdesign/bfna-website-migration-2/issues/188).
    `bfBreadcrumb` (#20) treats the *last* crumb as the current page and never
    links it, positionally, whether or not it carries a `to`. A one-entry
    `[{ label: 'Home', to: '/' }]` trail therefore renders Home as an unlinked
    `<span aria-current="page">` — a breadcrumb claiming the reader is on the
    homepage, with no link anywhere in it. Naming this page as the final,
    unlinked crumb restores Home to a real `<a href="/">` and puts
    `aria-current="page"` where it belongs. The fix is a call-site one: the
    component's rule is right, and it is the same two-then-current shape
    `insights/[slug].vue` already builds.
  -->
  <bfPageHeader
    label="Projects index"
    :crumbs="[{ label: 'Home', to: '/' }, { label: 'Projects' }]"
    :heading="indexPage?.heading ?? 'All Projects'"
    :tagline="indexPage?.description"
  >
    <!--
      The program index — the page's own table of contents, in the header's
      default slot ("header actions", `bfPageHeader`'s slot contract).

      A labelled `<nav>` because it is a set of navigation links, and the
      label is distinct from the site bar's and the breadcrumb's so the three
      are told apart in a landmark list. Plain `<a href="#…">` rather than
      `NuxtLink`: these are in-document jumps, and the browser's own fragment
      navigation — `:target`, the focus starting point moving to the band —
      is exactly the behaviour wanted, with no router in between.

      Each entry carries `data-program`, so its bar takes the same colour as
      the rule over the band it jumps to. The name and the count are one
      anchor, so the accessible name is "Democracy 4 projects" and there is
      one target per entry, not two.

      The re-tag band is left out on purpose: it is a holding area for rows
      the client has not re-filed, not a program, and it is empty today.
    -->
    <nav v-if="bands.length > 1" class="bf-projects-index" aria-label="Programs on this page">
      <ul class="bf-projects-index__list | grid" role="list" data-min-width="l" data-gap="m">
        <li
          v-for="band in bands"
          :key="band.program.slug"
          class="bf-projects-index__item"
          :data-program="band.program.slug"
        >
          <a class="bf-projects-index__link" :href="`#${band.program.slug}`">
            <span class="bf-projects-index__name">{{ band.program.name }}</span>
            <span class="bf-projects-index__count">{{ projectCount(band.projects.length) }}</span>
          </a>
        </li>
      </ul>
    </nav>
  </bfPageHeader>

  <!--
    Zone 2 — one band per program, in the stored `order`.

    The `<h2>` is slot content rather than `bfSection`'s `heading` prop
    because it has to be a **link** to the program hub, and that prop renders
    plain text. The frozen source does the same thing for the same reason. The
    band is still a named `region` landmark: `aria-labelledby` points at the
    heading's id, and `bfSection`'s attribute allowlist forwards `aria-*` with
    a call-site value winning over the prop-derived one.

    Three more attributes ride the same allowlist. `id` is the program slug,
    the target of the index entry above — `/projects#democracy` is a link
    worth being able to send. `data-program` scopes the programme colour to
    this band alone (the header docblock says why not `<html>`), and
    `data-rule="program"` is `bfSection`'s section rule, drawn on the
    heading in that colour. `class` is the page's own hook for the tagline,
    merged onto `bf-section`.

    `bfGridProjects` brings its own `.grid[data-min-width]` (D9) — this page
    names no column count anywhere. `:excerpt-length="120"` is the frozen
    source's value, tighter than the card's own 140 default. `:heading-level="3"`
    keeps the card titles under the band's `<h2>` (BRIEF §5 rule 9); it is also
    `bfCardProject`'s default, stated so the next reader does not have to know
    that.
  -->
  <bfSection
    v-for="band in bands"
    :id="band.program.slug"
    :key="band.program.slug"
    class="bf-projects-band"
    :data-program="band.program.slug"
    data-rule="program"
    :label="band.program.name"
    :aria-labelledby="band.headingId"
  >
    <!--
      `class="bf-section__heading"` is the hook `bfSection` puts on the heading
      it renders itself. A slotted heading is still that band's heading, so it
      carries the same hook — and it is load-bearing now: `bfSection` hangs the
      heading's balance, its link colour and arrow, the headed band's
      `--space-2xl` step and the section rule (`data-rule`) on that class. It
      also has to stay the column's **first child** for the step to apply,
      which is why the tagline follows it rather than wrapping it.
    -->
    <h2 :id="band.headingId" class="bf-section__heading">
      <NuxtLink :to="`/${band.program.slug}`">{{ band.program.name }}</NuxtLink>
    </h2>

    <!--
      The program's own one-line statement, from `bfPrograms` — the string
      the homepage's program card sets under the same name. Guarded, so a
      program saved with an empty tagline renders no empty paragraph (an
      empty stack child still takes a gap).
    -->
    <p v-if="band.program.tagline" class="bf-projects-band__tagline">{{ band.program.tagline }}</p>

    <bfGridProjects
      :projects="band.projects"
      :excerpt-length="120"
      :heading-level="3"
    />
  </bfSection>

  <!--
    Zone 3 — legacy items whose new program is unresolved (Q3), kept visible
    rather than hidden, so nothing falls off the site while the client
    re-tags it.

    Guarded on `retag.length`, so the band disappears entirely when the set
    empties — which is its state today. This one *does* use `bfSection`'s
    `heading` prop: the band is not a program and has no hub to link to.

    It wears the same rule as the program bands so it reads as one more
    section of the same index, and carries no `data-program`, so its bar
    resolves the neutral navy `:root` default — the colour of "no program",
    which is what the band is.
  -->
  <bfSection
    v-if="retag.length"
    class="bf-projects-band"
    data-rule="program"
    label="Pending re-tag (Q3)"
    heading="Pending re-tag"
  >
    <bfGridProjects
      :projects="retag"
      :excerpt-length="120"
      :heading-level="3"
    />
  </bfSection>
</template>

<style scoped>
/*
  The index's own skin — the band tagline and the program index in the
  header. Everything else on the route is `bf-*` and styles itself, the band
  rule included (`bfSection`'s `data-rule`); nothing below reaches into a
  component's internals.

  Wrapped in `@layer components`, like every page-level rule (gh#68 — an
  unlayered page rule outranks every layer). All colour is semantic or
  programme tokens; no `:not()` (D-20.5). `bf-projects-band` stays on the
  band root as the block its tagline is named for, and draws nothing.
*/
@layer components {
  /*
    The band rule is `bfSection`'s own (`data-rule="program"` in the
    template): the hairline in `--color-rule`, the programme's bar one
    `--space-xl` long. The index below draws each entry from the same pair
    of values, so it reads as a legend for the bands it jumps to:

    - the hairline, `--color-rule` — the navy family's lightest useful
      step rather than a grey;
    - the length of the program's bar, one `--space-xl`.

    The jump itself clears the sticky site bar through `base/reset.css`'s
    `:target` margin, which reads the bar's published height; the band used
    to approximate it with a margin of its own.
  */
  .bf-projects-index {
    --_bf-projects-rule: var(--color-rule);
    --_bf-projects-bar: var(--space-xl);
  }

  /*
    The program's tagline, as the band's standfirst. Pulled up to
    `--space-xs` under the heading (the stack's `m` gap would set it as far
    from its own heading as the grid is), capped at the site's 60ch reading
    measure so the Democracy line breaks into readable lines rather than
    running the width of the grid, and set in the body face at the body size
    — it is prose, and the cards' titles below are what should out-rank it.
    The grid keeps the stack's own gap after it.
  */
  .bf-projects-band__tagline {
    max-inline-size: 60ch;
    margin-block-start: var(--space-xs);
    text-wrap: pretty;
  }

  /*
    The program index. Its own gap from the tagline, a step larger than the
    header's `s` stack gap, so it reads as the header's last group and not as
    a third tagline line.
  */
  .bf-projects-index {
    margin-block-start: var(--space-l);
  }

  /*
    One entry. The same rule as the band it jumps to — hairline plus bar —
    so the index is a legend for the page below it.

    The `.grid` primitive's `l` floor lays the entries out: one track on a
    phone, two on a tablet, three at the full measure. Up to the site's one
    breakpoint each entry is one row — the name at the start, the count at
    the end, baseline-aligned — so three entries cost three rows. Above it
    the count moves under the name: across three columns, a count flung to
    each column's far edge, beside a name that wraps and one that does not,
    would sit at three different places along the row.
  */
  .bf-projects-index__link {
    position: relative;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3xs) var(--space-s);
    padding-block-start: var(--space-xs);
    border-block-start: var(--border-width-thin) solid var(--_bf-projects-rule);
    color: var(--color-text);
    text-decoration: none;
  }

  .bf-projects-index__link::before {
    content: "";
    position: absolute;
    inset-block-start: calc(var(--border-width-thin) * -1);
    inset-inline-start: 0;
    inline-size: var(--_bf-projects-bar);
    block-size: var(--border-width-thick);
    background-color: var(--color-program);
    transform-origin: left center;
    transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  }

  /*
    The name, in the display face a size step down from the band headings it
    names — the index is their contents line, not a second set of headings,
    so semibold rather than their bold.
  */
  .bf-projects-index__name {
    font-family: var(--font-family-display);
    font-size: var(--size-1);
    font-weight: var(--font-weight-semibold);
    line-height: var(--leading-display);
    letter-spacing: var(--tracking-display);
    text-wrap: balance;
    text-decoration-thickness: var(--border-width-medium);
    text-underline-offset: 0.12em;
  }

  /*
    The count, as meta: the UI face, a step under body, in navy. Not
    `--color-text-muted`, the card date's colour: that is 4.96:1 on the white
    page ground, but this line sits on the header's paper, and measured on the
    rendered texture it falls to ~4.1–4.4:1 — under AA at this size. Navy is
    11.66:1 on white and stays near 10:1 on the paper, and still reads as the
    quieter line beside the near-black name. Tabular figures, so "4", "6" and
    "3" sit on one width. `nowrap` keeps "13 projects" from breaking between
    the number and its noun.
  */
  .bf-projects-index__count {
    flex-shrink: 0;
    color: var(--color-accent);
    font-family: var(--font-family-ui);
    font-size: var(--size--1);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  /*
    Hover: the name takes the heading link's own underline, and the bar
    draws a step further along its rule — the one moving part on the page,
    and the same easing as the band heading's arrow. The bar grows by
    transform, not by width, so it never reflows the entry.
  */
  .bf-projects-index__link:hover .bf-projects-index__name {
    text-decoration-line: underline;
    text-decoration-color: var(--color-primary);
  }

  .bf-projects-index__link:hover::before {
    transform: scaleX(1.6);
  }

  @media (width > 48rem) {
    .bf-projects-index__link {
      flex-direction: column;
      justify-content: flex-start;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bf-projects-index__link::before {
      transition: none;
    }
  }
}
</style>
