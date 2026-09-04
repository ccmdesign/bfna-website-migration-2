# 53 — page-about — About `/about`

One-line objective: build `src/pages/about.vue` on `bf-default`, deleting
the legacy `pages/about.vue`, with mission/board/team/Stiftung/contact
sections using data-driven grids instead of the wireframe's pinned columns.

## Context

Depends on #46 (`bf-default`), #38 (`bfPageHeader`), #24 (`bfCardPerson`),
#44 (`bfContactSection`), #39 (`bfSection`), #04
(`.grid[data-min-width]`). Descends from
`src/pages/wireframes/about.vue`. Provenance: BF-208. Retires exactly one
file: `src/pages/about.vue` (legacy, `02-legacy-retirement-inventory.md` §A
row `/about` — today a hardcoded in-component `aboutData` object, no
Directus call) — no other legacy file. `pages/team.vue` (the standalone
legacy `/team` route) is **not** deleted here; it is redirected to
`/about#team` by #57 and deleted by #58.

## Scope

- `src/pages/about.vue`, `definePageMeta({ layout: 'bf-default' })`.
- Section order, from `pages/wireframes/about.vue`:
  1. `<bf-page-header label="Mission" :crumbs="[{label:'Home',to:'/'}]" :heading="about?.heading ?? 'About Us'" :tagline="paragraphs(about?.description)" />`.
  2. `<bf-section id="board" label="Board of Directors" heading="Board of Directors">` wrapping `<ul class="grid" data-min-width="16rem" data-gap="m"><bf-card-person v-for="p in boardMembers()" :person="p" /></ul>` — **replaces the wireframe's inline `style="grid-template-columns: repeat(3, 1fr)"` (`about.vue:13`) with `.grid[data-min-width]` (D9)**, not a 3-up pin.
  3. `<bf-section id="team" label="Team" heading="Team">` — same grid pattern, `teamMembers()`, replacing `about.vue:19`'s pinned 3-col grid.
  4. Bertelsmann Stiftung — `<bf-section label="Bertelsmann Stiftung" layout="switcher" gap="l">` wrapping `<bf-media>`/`<img>` + a `.stack` text block from `stiftungPage()`.
  5. `<bf-contact-section id="contact" />`.
- `#team` and `#board` are real anchor ids on the two `bf-section`
  elements, matching the wireframe exactly — this is what makes
  `/about#team`/`/about#board` work as #57's `/team` redirect target.
- Composable → prop map: `useBfPages().aboutPage` → page-header
  heading/tagline; `useBfPages().stiftungPage` → Stiftung heading/body;
  `useBfPeople().boardMembers`/`.teamMembers` → the two `bfCardPerson`
  grids.
- Consumes collections: `bfPeople`, `bfPages` (`aboutPage`, `stiftungPage`).

## Out of scope

- No edits under `pages/wireframes/**` or `components/wireframe/**` — fails the epic.
- A standalone `/team` route (redirected, not rebuilt, per #57).
- Person detail pages (no such route exists in the epic's §7 route list).
- Any legacy file other than `src/pages/about.vue`.

## Styling

- Tokens: existing semantic tokens, no new colour.
- Primitives: `.grid[data-min-width]` on both person grids (D9 — **not**
  the wireframe's pinned three columns); `.switcher` on the Stiftung
  section, matching wireframe.

## Acceptance / verification

```bash
cd bfna-website-nuxt && npm run typecheck
cd bfna-website-nuxt && npx nuxt generate   # NEVER `npm run generate`
```

Issue-specific:
```bash
test -f bfna-website-nuxt/.output/public/about/index.html
grep -q 'id="board"' bfna-website-nuxt/.output/public/about/index.html && grep -q 'id="team"' bfna-website-nuxt/.output/public/about/index.html   # both anchors resolve
grep -c "bf-card-person\|bfCardPerson" bfna-website-nuxt/.output/public/about/index.html   # 13 people render across the two grids (board + team)
! grep -q "grid-template-columns" bfna-website-nuxt/src/pages/about.vue    # no pinned columns (D9)
test ! -f bfna-website-nuxt/src/pages/about.vue.legacy                    # legacy about content is gone
diff <(git show HEAD~1:bfna-website-nuxt/src/pages/wireframes/about.vue) bfna-website-nuxt/src/pages/wireframes/about.vue   # empty — wf source untouched (DoD-4)
```

## Decisions

_Runner appends here._

### D-53.1 — `data-min-width="m"`, not the spec's literal `16rem`

The Scope section writes `<ul class="grid" data-min-width="16rem" data-gap="m">`.
`composition/grid.css` matches `[data-min-width]` on **six token values only** —
`xs` 160px · `s` 200px · `m` 240px · `l` 300px · `xl` 400px · `2xl` 500px — so
`16rem` selects no rule and the grid silently falls back to the unset 240px
default. Both person grids therefore ship `data-min-width="m"`, which *is* that
240px: the nearest step to the 256px the spec meant, now stated rather than
arrived at by accident. D9's requirement is unaffected — the column count is
still resolved from a track floor and is authored nowhere.

### D-53.2 — 14 cards over 13 people

The Acceptance section reads "13 people render across the two grids". The
rendered **card** count is 14: `boardMembers()` returns 4 and `teamMembers()`
returns 10, and `irene-braam` is in both — she carries `board: true` and the job
title "Executive Director", so she joins the Board while staying in Team
(Irene, Aug 5; `useBfPeople.ts` documents the asymmetric predicates at length).
13 is the count of *people*, and the generated page asserts both numbers: 14
`<li class="bf-card">` and 13 unique `<h3>` names.

### D-53.3 — a two-entry breadcrumb, not the frozen source's one

`:crumbs="[{ label: 'Home', to: '/' }, { label: 'About' }]"`, where the frozen
wireframe passes only the Home entry. Residual
[#188](https://github.com/ccmdesign/bfna-website-migration-2/issues/188):
`bfBreadcrumb` treats the last crumb as the current page and never links it,
positionally, so a one-entry trail renders Home as an unlinked
`<span aria-current="page">`. The same two-then-current shape `/projects` and
`/insights/<slug>` already build.

### D-53.4 — `#contact` is a third anchor, verified not assumed

The spec names `#board` and `#team`. `bfContactSection` is given `id="contact"`
as well, matching the frozen source. None of the three is a prop: each rides
`bfSection`'s `$attrs` allow-list (`id` is on it), and `bfContactSection`'s own
root *is* a `bfSection`, so that one falls through twice. The generated HTML is
grepped for all three rather than the chain being trusted — all three land on
the `<section>`.

### D-53.5 — the Stiftung image is `bfMedia` at `4/3`, with real alt text

The frozen source's `<img>` carries five inline declarations (`min-width: 0;
max-width: 100%; height: auto; object-fit: cover; align-self: start`). Four of
them are `bfMedia`'s own base rules, so the only thing left to state at the call
site is the proportion; `4/3` is the landscape ratio nearest the source photo
and is a `--_bf-media-ratio` a consumer stylesheet can still re-proportion.
`alt` is real text, not `""`: this image is the subject of the band, not
decoration beside a heading that already names it.

### D-53.6 — folded residual [#187](https://github.com/ccmdesign/bfna-website-migration-2/issues/187)

Sanctioned P2 fold. `bfCardFeatured` linked its heading to `/insights/<slug>`;
`useBfInsights` builds `items` as `all.filter(i => !i.featured && !i.retired_news)`
and `bySlug` searches `items`, so **no** featured row resolved at that route and
every featured card 404ed. All eight curated rows carry `content: null` and a
populated `external_url` — they are pointers to other sites, which is why the
normaliser gave them no body.

Fixed at the component, not at `bySlug`: widening that predicate would mint an
`/insights/<slug>` route for a record with nothing to render — a 200 emptier
than the 404 it replaced. The heading now takes the `bfCardProduct` shape, a raw
`<a href="{external_url}" rel="noopener">` with `data-external` gated on
`isExternal()` (D-26.1), falling back to the `NuxtLink` when `external_url` is
absent so a future featured row with a body still routes internally.

Two of the eight point back at `www.bfna.org`, a `SITE_HOST`, so they get the
anchor and `rel` but **not** the `↗` marker — the arrow means "another site" and
would misdescribe them. Probe 23 asserts the marker matches `isExternal()`
per row, quotes the 6/2 split so the row cannot pass vacuously, and exercises
the internal branch through a synthesised row with `external_url: null`. 59/59
rows green; full `check-probes` 38 probes / 1642 rows / 0 failures.

**The home page renders 4 of the 8, not 8**: `pages/index.vue` takes
`highlights().slice(0, 4)` because the band is a strip beside the product card.
All four now resolve to their external destinations; the other four featured
records are not rendered on `/` at all.

### D-53.7 — STEP 1 planning was inline

The runner wrote `docs/plans/gh62-plan.md` itself (the template's sanctioned
fallback) after reading the spec, the frozen wireframe page, the five `bf-*`
components, both composables, probe 23 and the eight `featured` documents
first-hand. No `ce-plan` invocation.
