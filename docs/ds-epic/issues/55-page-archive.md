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
