# 55 — page-archive — Archive `/archive`

One-line objective: build `src/pages/archive.vue` on `bf-default`, one
`bfAccordion` per year (descending) listing archived insights as
`bfCardRow`.

## Context

Depends on #46 (`bf-default`), #38 (`bfPageHeader`), #31 (`bfAccordion`),
#16 (`bfChip`), #18 (`bfTime`), #11 (`useBfInsights`). Descends from
`src/pages/wireframes/archive.vue`. Provenance: BF-212. **No legacy file
retired here** — the note in `02-legacy-retirement-inventory.md` §E is that
the legacy route is `/archives` (plural), this one is `/archive`
(singular); the redirect `/archives → /archive` is #57's job, and deleting
`pages/archives/index.vue` is #58's job. This issue only builds the new
route.

## Scope

- `src/pages/archive.vue`, `definePageMeta({ layout: 'bf-default' })`.
- Section order, from `pages/wireframes/archive.vue`:
  1. `<bf-page-header label="Archive index" :crumbs="[{label:'Home',to:'/'},{label:'Insights',to:'/insights'}]" :heading="indexPage?.heading ?? 'Archive'" :tagline="indexPage?.description">` with a count/range line ("`archived.length` pieces of past work, `oldestYear`–`newestYear`").
  2. "By year" — `<bf-section label="By year">` wrapping one `<bf-accordion :label="\`${year} (${items.length})\`" v-for="y in years">` per year, each `<bf-accordion>` listing its items as `<bf-card-row v-for="i in y.items" :item="i" variant="insight" />` (replacing the wireframe's raw `<li class="cluster">` + `wf-chip` + `NuxtLink` + `<time>` composite with the single dense-row wrapper #27 built) — includes a `bfChip` (format) and `bfTime` (publish date) inside each row via `bfCardRow`'s internal composition.
  3. Optional program facets via `bfFilterBar` (#30) — the wireframe page
     itself has no facet UI on `/archive` (facets only appear on
     `/insights`, #49); this is a scope note, not a required build:
     **omit unless the runner confirms it's wanted** — flag as an open
     decision rather than silently adding UI the wireframe doesn't show.
- Newest year open by default: `<bf-accordion :open="y === years[0]">`
  (matches wireframe's `:open="y === years[0]"` on the native `<details>`).
- Composable → prop map: `useBfInsights().archived` → the year-grouping
  source (grouping by `publish_date.slice(0,4)` happens in this page, not
  the composable); grouped items → `bfAccordion` default slot →
  `bfCardRow.item`.
- Consumes collection: `bfInsights` (`archived`).

## Out of scope

- No edits under `pages/wireframes/**` or `components/wireframe/**` — fails the epic.
- The legacy `/archives` page (retired in #58).
- Pagination, restoring archived items.

## Styling

- Tokens: existing semantic tokens, no new colour.
- Primitives: `.stack` inside each accordion body (matches wireframe's
  `<ul class="stack" data-gap="xs">`).

## Acceptance / verification

```bash
cd bfna-website-nuxt && npm run typecheck
cd bfna-website-nuxt && npx nuxt generate   # NEVER `npm run generate`
```

Issue-specific:
```bash
test -f bfna-website-nuxt/.output/public/archive/index.html                 # /archive prerenders (singular)
grep -c "bf-accordion\|bfAccordion" bfna-website-nuxt/.output/public/archive/index.html   # one per year present
# per-year counts sum to archived.length — verify by comparing accordion item counts against useBfInsights().archived.length in a probe/console check
grep -q "open" bfna-website-nuxt/src/pages/archive.vue                      # newest year opens by default
```

## Decisions

_Runner appends here._

### D-55.1 — No facet UI, and it is an open decision, not an omission

§Scope item 3 asks the runner to confirm whether `bfFilterBar` program facets
are wanted on `/archive`, and to *flag rather than silently build*. **None is
built.** The frozen `pages/wireframes/archive.vue` shows no facet UI on this
route — facets live on `/insights` (#49) — and the archive's organising axis is
the year, which the accordions already are. Adding a program bar would give the
page two competing filters over the same 256 rows, one of which (`year`) is not
a filter at all but the document structure.

Left open for a later issue if the client asks: the shape would be a single
`bfFilterBar` above the accordions, filtering `archived` before grouping, with
the selection in `route.query.program` the way `/insights` and `/search` both
already do it. Nothing in this page's structure blocks that.

### D-55.2 — The section gets a real `<h2>`

The frozen source writes `<wf-section label="By year">`, and `label` reaches
the DOM as `data-label`, which the wireframe skin draws as a corner tag and
finished `bf-*` chrome draws not at all. Ported literally, "By year" would
disappear from the page and the 256 row headings would sit at `h3` directly
under the `<h1>` with no `<h2>` between them — a skipped level, which BRIEF §5
rule 9 forbids.

So the band takes **both** `label="By year"` (the stable selector hook) and
`heading="By year"` (the `<h2>`). This is the same information the wireframe
already displays, moved from a skin affordance into the document outline; it is
not new UI. The generated page carries exactly one `h1`, one `h2` and 256 `h3`s.

Note what is *not* claimed: the year summaries are `<summary>` elements, not
headings, so the eleven years do not appear in the heading outline. That is
native `<details>` behaviour and the wireframe's, and `bfAccordion` deliberately
declines to wrap its summary in a heading (its contract explains why). A reader
navigating by heading gets "Archive → By year → 256 items"; a reader navigating
by interactive element gets the eleven disclosures.

### D-55.3 — Crumbs end on a `to`-less current-page node

§Scope quotes `[{Home,/}, {Insights,/insights}]`. `bfBreadcrumb` marks the
current page by the **absence** of `to` on the final crumb, so that trail would
put `aria-current="page"` on the `/insights` link — telling the reader they are
on the insights feed while they are on the archive — and leave this page
unnamed. A third `{ label: 'Archive' }` is appended, which is the same
two-then-current shape `/insights` (gh#62), `/projects` (#51) and both detail
routes already build.

### D-55.4 — `Undated` sorts last, and is excluded from the range

The frozen source sorts the year buckets with a bare
`b.year.localeCompare(a.year)`, which puts the `'Undated'` bucket **first** —
`'U'` sorts above `'2'`. In the wireframe that is inert because the bucket is
empty; here it is load-bearing twice over, since `years[0]` is both the band
opened by default and the newest end of the count/range sentence. One archived
row with a null `publish_date` would open a band called "Undated" and print
"2007–Undated".

`'Undated'` is therefore forced last in the comparator, and the range sentence
is computed from the dated years only. The bucket itself is kept — it costs one
`??`, and an item that vanished from a page whose promise is *"nothing is
deleted"* would be the worst possible defect here.

Current snapshot: **all 256 archived rows carry a `publish_date`**, so the
bucket renders nothing today. (The three null-date rows noted in BF-218 are
*active*, not archived, and so never reach this page.)

### D-55.5 — Every row carries an `Archive` chip, and that is `bfCardRow`'s call

`bfCardRow` appends an `Archive` chip to any item with `archived === true`
(gh#36 / #140), which on this page is every row. It is not suppressed: the
behaviour is the component's contract, shared with `/search`, and a page-level
override would be either a prop this issue is not chartered to add or a CSS
rule hiding a chip the component chose to render. Noted rather than changed.

### D-55.6 — No vitest; the counts are asserted on the generated HTML

Per the epic's test-harness decision (residual #86) the vitest harness on `dev`
is broken and pre-existing, so §Acceptance's "verify by comparing accordion item
counts against `archived.length` in a probe/console check" is satisfied by an
assertion over the prerendered output instead. Run after `npx nuxt generate`,
from `bfna-website-nuxt/`:

```bash
node -e '
const html = require("fs").readFileSync(".output/public/archive/index.html", "utf8")
const summaries = [...html.matchAll(/<summary[^>]*class="bf-accordion__summary"[^>]*>([^<]*)<\/summary>/g)].map(m => m[1].trim())
const perBand = html.split(/<details[^>]*class="bf-accordion"/).slice(1)
  .map(p => (p.split("</details>")[0].match(/bf-card-row/g) || []).length)
const hrefs = [...html.matchAll(/href="\/insights\/([^"#?]+)"/g)].map(m => m[1])
console.log({ bands: summaries.length, labels: summaries, perBand,
  labelled: summaries.map(s => Number(s.match(/\((\d+)\)/)[1])),
  rows: perBand.reduce((a, b) => a + b, 0), hrefs: hrefs.length, distinct: new Set(hrefs).size })
'
```

Recorded result on this branch:

| Assertion | Result |
|---|---|
| `/archive` prerenders | `.output/public/archive/index.html`, 190 KB |
| one accordion per year | 11 `<details class="bf-accordion">`, 11 year buckets |
| bands descending, newest first | 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2007 |
| exactly one open by default, and it is the newest | only band 0 (`2023`) carries `open` |
| per-year labels match per-year rows | 27, 21, 28, 40, 32, 21, 10, 34, 27, 15, 1 — identical in both |
| per-year counts sum to `archived.length` | 256 = 256 |
| one row per archived item, one link each | 256 `bf-card-row`, 256 `/insights/<slug>` hrefs, **256 distinct** (slugs unique since #151) |
| heading outline | 1 × `h1`, 1 × `h2`, 256 × `h3` — no skipped level |
| count/range sentence | "256 pieces of past work, 2007–2023." |
| typecheck gate | 176 total `error TS` (= baseline 176), 0 in `src/(components/bf\|types\|composables/bf)\|content.config`, 0 in `archive.vue` |
| full probe suite | `npx tsx scripts/check-probes.ts` → PASS, 38 probes, 1643 rows, 0 failures |
| wireframe byte-identity | `git diff --stat` vs `dev` **and** vs the pre-epic base `f757a64` — both empty |

No probe page is added: §Acceptance calls for none, and the disclosure
behaviour this page relies on is already asserted by probe `31-bf-accordion`
(51/51 rows), which the suite re-runs.

### D-55.7 — `/archive` is not seeded into `nitro.prerender.routes`

It does not need to be. `bfNav` links it (the generated page carries
`aria-current="page"` on its own nav entry) and `pages/insights/index.vue:330`
renders `<bfButton to="/archive">`, so the crawler reaches it from pages it
already renders. Confirmed empirically rather than assumed: a clean
`npx nuxt generate` (1774 routes) produced `.output/public/archive/index.html`.
The lossy batched hand-off documented in `src/nuxt.config.ts` is the reason
this was checked and not the reason to add a config line that is not needed.

### D-55.8 — Skills used

`ce-plan` and `ce-work` were **not** invoked; the plan
(`docs/plans/gh64-plan.md`) and the implementation were written inline, the
sanctioned fallback, to keep every step inside the runner's turn. Review was
the inline diff read (STEP 3).
