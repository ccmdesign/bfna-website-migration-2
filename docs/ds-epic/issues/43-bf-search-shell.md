# 43 — `bfSearchShell` — search UI shell (new)

One-line objective: new organism `bfSearchShell`, extracting the page-inline
search UI (input, facets, results, relevance meter) into a props-in/
events-out shell.

## Context

Depends on 30 (`bfFilterBar`, the facet row), 27 (`bfCardRow`, the results
list). Also composes 33 (`bfEmptyState`). Builds from
`src/pages/wireframes/search.vue` (inline, un-componentized: the query
input at L6-13, the facet row at L20-40, the results list at L42-65,
including the bespoke relevance-meter bar at L57-62). Consumed by 54
(`/search` template — ranking implemented in the page, this shell renders
what the page computes). Provenance: BF-172.

## Scope

- File: `src/components/bf/SearchShell.vue` → `<bfSearchShell>`.
- Props/emits:
  ```ts
  import type { Filter, SearchResultRow } from '~/types/bf-contracts'   // issue 02 — not declared inline
  interface Props {
    query: string
    filters: Filter[]        // from bf-contracts.ts, forwarded to bfFilterBar
    selectedFilters: string[]
    results: SearchResultRow[]
    resultCount: number
  }
  // emits
  (e: 'update:query', value: string): void   // debounced
  (e: 'update:selectedFilters', value: string[]): void
  ```
- Renders: a labelled `<input type="search">` bound to `query`, debounced
  before emitting `update:query` (matches the wf source's live-typing
  `v-model="q"` but adds debounce, since this shell now owns the emit
  boundary rather than a page-local ref); the facet row via `<bfFilterBar
  :filters="filters" :model-value="selectedFilters" @update:modelValue=
  "$emit('update:selectedFilters', $event)" />`; the result count line
  (`<strong>{{ resultCount }}</strong> results for …`); the results list as
  one `<bfCardRow>` per `results` entry inside an `<ol>` (matches the wf
  source's `<ol class="stack">`); the empty state via `<bfEmptyState
  v-if="!results.length" heading="No results" message="No records matched —
  try fewer or different words." />` (message text ported from the wf
  source's own copy); a small internal relevance-meter bar per result,
  driven by each row's `score` (0–1) — width computed as `Math.max(6,
  score * 100 * 1.6)` or equivalent, ported from the wf source's inline bar,
  moved from a raw `:style` width hack into a CSS custom property
  (`--_bf-search-shell-meter-width`) set via `:style="{ '--_bf-search-shell-
  meter-width': \`${pct}%\` }"` so the actual bar rule lives in CSS, not an
  inline `width:` declaration.

## Out of scope

- Ranking, indexing, embeddings — entirely the page's job (issue 54); this
  shell only renders whatever `results`/`score` values it's handed.
- The `/search` route itself (issue 54 builds the page around this shell).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variables `--_bf-search-shell-meter-width`, `--_bf-search-shell-
  meter-color` (existing semantic token, no new colour).

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/SearchShell.vue
grep -Lq "queryCollection" src/components/bf/SearchShell.vue
grep -q "score" src/components/bf/SearchShell.vue
```
Probe page `src/pages/bf-probe/43-bf-search-shell.vue` renders a fixture
result set with scores, emits `update:query`/`update:selectedFilters` on
interaction, and shows the empty state at zero results:
```bash
grep -q "No results" .output/public/bf-probe/43-bf-search-shell/index.html
```
Performs no data access (grep-clean for `queryCollection`/`useWfContent`).
Fails today (no `bf/SearchShell.vue`), passes once done.

## Decisions

_Runner appends here._
