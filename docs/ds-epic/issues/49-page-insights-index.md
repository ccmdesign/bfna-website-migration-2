# 49 — page-insights-index — Insights list `/insights`

One-line objective: build `src/pages/insights/index.vue` on `bf-default`
with URL-linkable filters, a results grid, and load-more pagination.

## Context

Depends on #46 (`bf-default`), #38 (`bfPageHeader`), #42 (`bfGridInsights`),
#30 (`bfFilterBar`), #32 (`bfLoadMore`), #33 (`bfEmptyState`), #11
(`useBfInsights`). Descends from `src/pages/wireframes/insights/index.vue`.
Provenance: BF-199. Retires no legacy file — `/updates` (the nearest legacy
analog) is retired by #57/#58, not here (different route, different data
model).

## Scope

- `src/pages/insights/index.vue`, `definePageMeta({ layout: 'bf-default' })`.
- Section order, from `pages/wireframes/insights/index.vue`:
  1. `<bf-page-header label="Insights feed" :crumbs="[{label:'Home',to:'/'}]" :heading="feedPage?.heading ?? 'Insights'" :tagline="feedPage?.description" />`.
  2. Filters — `<bf-section label="Filters" gap="s">` wrapping `<bf-filter-bar :filters="formatFilters" v-model="query.format" />` (format facet) + a second `bf-filter-bar` for the program facet, replacing the wireframe's two hand-rolled `wf-chip` clusters — this is exactly the BF-209 dependency on BF-157's toggle variant.
  3. Results — `<bf-section label="Results">` showing the count, `<bf-grid-insights :insights="filtered.slice(0, visible)" />`, `<bf-load-more :has-more="filtered.length > visible" @load="visible += 24" />`.
  4. A link to `/archive` for archived items ("Include archived (`archived.length`) →", replacing the wireframe's inline archive toggle since `/archive` is now its own route, #55) — placed at the end of the Filters band.
- Filter state lives in `route.query` (`format`, `area`, `archive`), same
  `linkWith()` toggle pattern as the wireframe page — implemented in this
  page, not in `bfFilterBar` (D8: the component only emits, the page owns
  the URL).
- Composable → prop map: `useBfInsights().active`/`.archived` → filtered
  pool; `useBfPrograms().programs` → the program `bfFilterBar` options;
  filtered result → `bfGridInsights.insights`.
- Consumes collections: `bfInsights` (`active`, `archived`), `bfPrograms`
  (facet options).

## Out of scope

- No edits under `pages/wireframes/**` or `components/wireframe/**` — fails the epic.
- Server-side filtering, saved filters, a Pinia store (rejected per ADR-2).
- The archive page itself (#55) — this page only links to it.

## Styling

- Tokens: existing semantic tokens, no new colour.
- Primitives: `.cluster` inside `bfFilterBar` (component-owned), `.grid[data-min-width]` inside `bfGridInsights` — no inline styles on this page.

## Acceptance / verification

```bash
cd bfna-website-nuxt && npm run typecheck
cd bfna-website-nuxt && npx nuxt generate   # NEVER `npm run generate`
```

Issue-specific:
```bash
test -f bfna-website-nuxt/.output/public/insights/index.html               # /insights prerenders
grep -q "bfLoadMore\|bf-load-more" bfna-website-nuxt/src/pages/insights/index.vue
grep -q "/archive" bfna-website-nuxt/src/pages/insights/index.vue           # archive link present
# manual/preview: selecting a format facet updates ?format= in the URL and narrows the grid; an empty result set renders bfEmptyState
```

## Decisions

_Runner appends here._
