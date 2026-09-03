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

**D-49.1 — a multi-select component drives two single-valued facets.**
`bfFilterBar` emits the whole new selection as an array (gh#39, by contract).
Both facets here hold at most one value, exactly as the frozen page's chips do,
so `onFacet()` reduces the emitted array to the one key that is not already
selected — or to nothing, when the user clicked the active chip. Toggle
semantics are therefore preserved without the component learning anything about
the URL (D8). Widening a facet to true multi-select is a product question (a
union or an intersection of two formats?) that neither the wireframe nor this
spec answers, so it was not answered here.

**D-49.2 — `?archive=1` survives as URL state with no control.**
The spec names three query keys and the wireframe's third facet is an inline
archive toggle. Archived items now have their own route (#55), so the Filters
band links to `/archive` instead — the same link, in the same words,
`pages/[program].vue` already ships. The `archive` key is still read and still
carried across every facet toggle by `linkWith()`, so a bookmarked wireframe-era
URL keeps working and the count line keeps its "(including archive)" qualifier.
Nothing on the page writes it.

**D-49.3 — the programme facet is keyed on slug and labelled short.**
`Insight.program` holds the display **name**; the URL and `pages/[program].vue`'s
existing `/insights?area=<slug>` link both use the **slug**; `programBySlug`
bridges them in `filtered`, as the frozen page does. The chip label is the
`shortProgram()` relabelling ported from `pages/index.vue` (D-47.2) — the full
"Transatlantic Relations & Global Challenges" is 43 characters and wraps the
facet row at every viewport this site has. `bfProgramSchema` still has no short
name field; the gap recorded on issue 47 stands.

**D-49.4 — `visible` resets when the query changes.**
Not ported from the frozen page, which does not do it: the page component is not
unmounted on a query-only navigation, so a reader who loaded 120 rows and then
picked a facet with 30 would see all of them and no "load more" — paging would
mean something different after a filter than before it. A latent bug in a
prototype, and not worth carrying into a template.

**D-49.5 — each facet bar has a visible caption and points at it.**
`aria-labelledby` on the bar, resolving to the `<span>` beside it, wins over
`bfFilterBar`'s own `aria-label` by the ARIA name-computation order — the call
site the component's own comment describes. Two bars on one page must not both
announce as "Filters", and a sighted user needs the caption the wireframe
already draws.

**D-49.6 — residual [#173] is fixed here (sanctioned).**
`EmptyStateProps` gains `headingLevel?: 1 | 2 | 3 | 4`, defaulting to **1** so
every call site written before it is unchanged, and `bfEmptyState` renders
`<component :is="'h' + headingLevel">`. This page passes `2`, because
`bfPageHeader` above it already owns the `<h1>`. Probe 33 gains one row and a
ninth, permanently-mounted instance at level 2 — mounted *after* the staged one
so `document.querySelector('.bf-empty-state')` still resolves to the case under
test, and rendering an `<h2>` so every existing "exactly one `<h1>`" row stays
true with two instances on the page. `/search` (#54) is where
`bfSearchShell` should pass the same `2`; that is its issue's to do.

**D-49.7 — residual [#179] is fixed in `layouts/bf-default.vue`, keyed on
`NuxtPage` rather than on the announcer.**
With no `app.vue`, Nuxt's own app template puts `<NuxtRouteAnnouncer />` inside
this layout's slot, so it became the first child of `<main class="stack">` and
pushed a `--space-xl` margin onto every page's first band. The layout now
partitions its slot roots and renders everything that is **not** the page outlet
before `<main>`.

The partition names `NuxtPage` and not `NuxtRouteAnnouncer` because the
announcer is registered **client-only**: the server renders Nuxt's
`ServerPlaceholder` (the literal `<div></div>` in the prerendered HTML) and the
client renders the announcer. A filter keyed on the announcer matched on the
client only, hoisting the node after hydration and leaving the two renders
structurally different — tried first, and caught by reading the generated HTML
rather than the dev server. With no page outlet in the slot the layout renders
every root inside `<main>` exactly as before, so the change degrades to today's
behaviour rather than hoisting on a guess.

#179's second half — the `<div>` → `<span>` tag change across hydration — is
**not** fixed and is not fixable from a layout: it is Nuxt's own client-only
placeholder mechanism. Recorded here so it does not read as an oversight.

**D-49.8 — vitest is not part of this issue's acceptance (residual #86).**
The harness on `dev` is broken and pre-existing; it was neither used nor fixed.
The substituted checks are of equivalent strength and are all machine-run:
`npx nuxt typecheck` against the recorded baseline (176 total / 0 in the bf
scope), `npx nuxt generate`, `test -f .output/public/insights/index.html`, the
count-line parity read against the frozen page's own prerendered output (98
items on both), `npx tsx scripts/check-probes.ts` (38 probes, 1635 rows), and a
headless browser pass over the built output for the facet, load-more and
empty-state behaviours the acceptance calls "manual/preview".
