# Plan — gh#58 / issue 49 · Insights list `/insights`

**Spec:** [`docs/ds-epic/issues/49-page-insights-index.md`](../ds-epic/issues/49-page-insights-index.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Base:** `dev` @ `8189918` · **Branch:** `feature/gh58-insights-list-insights`

## Approach

One new template, `src/pages/insights/index.vue`, on `bf-default`, descended from the
frozen `pages/wireframes/insights/index.vue` (read, never edited — D2). It retires no
legacy file: `/insights` is a new route, and `/updates` (the nearest legacy analog) is
retired by a later phase-7 issue.

Band order, from the frozen source:

1. `bfPageHeader` — `label="Insights feed"`, one crumb to `/`, heading and tagline from
   the `insights` row of `bfPages`.
2. `bfSection label="Filters" gap="s"` — **two** `bfFilterBar`s (format facet, program
   facet) replacing the wireframe's two hand-rolled `wf-chip` clusters, plus the archive
   link.
3. `bfSection label="Results"` — the count line, `bfGridInsights` over
   `filtered.slice(0, visible)`, `bfLoadMore`, and `bfEmptyState` when nothing matched.

**Filter state lives in `route.query`** (`format`, `area`, `archive`), with the frozen
source's `linkWith()` toggle pattern re-implemented in this page. `bfFilterBar` only
emits (D8) — the page maps the emitted array back onto a single-valued query key and
navigates. The archive facet is no longer a chip: `/archive` is its own route (issue 55),
so the wireframe's inline `?archive=1` toggle becomes a link at the end of the Filters
band, exactly as `pages/[program].vue` already writes it.

Two sanctioned residual fixes ride along, both named in the item brief:

- **#173** — `bfEmptyState` renders an `<h1>`, and this page's header already owns one.
  `EmptyStateProps` gains `headingLevel?: 1 | 2 | 3 | 4` (default `1`, so every existing
  call site is unchanged); the component renders `<component :is="'h' + headingLevel">`;
  probe 33 gains one row; this page passes `2`.
- **#179** — `NuxtRouteAnnouncer` is a child of the layout's `<slot />`, so it lands
  inside `<main class="stack">` and pushes an `xl` margin onto every page's first band.
  Fixed in `src/layouts/bf-default.vue` only, by partitioning the slot's root vnodes and
  rendering the announcer as a sibling *before* `<main>`.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/pages/insights/index.vue` | **new** — the template |
| `bfna-website-nuxt/src/types/bf-contracts.ts` | `EmptyStateHeadingLevel` + `EmptyStateProps.headingLevel` |
| `bfna-website-nuxt/src/components/bf/EmptyState.vue` | render the heading at the stated rank |
| `bfna-website-nuxt/src/pages/bf-probe/33-bf-empty-state.vue` | one extra row + a second, `h2`-ranked instance |
| `bfna-website-nuxt/src/layouts/bf-default.vue` | hoist the route announcer out of `<main>` |
| `docs/ds-epic/issues/49-page-insights-index.md` | Decisions section |

No `bf-*` component gains a data read; no `grid-template-columns` is authored; no colour
is added.

## Data → props

| Source | Destination |
|---|---|
| `useBfPages().pageBySlug('insights')` | `bfPageHeader` heading + tagline |
| `useBfInsights().active` / `.archived` | the filtered pool / the archive counter |
| `useBfPrograms().programs()` | the program facet's `Filter[]` (ordered, gh#180) |
| `filtered.slice(0, visible)` | `bfGridInsights.insights` |

`Insight.program` is the display **name**, not a slug, so the `area` query value is
resolved through `programBySlug()` before the pool is filtered — the frozen source's own
indirection, kept.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86) — not used, not
fixed. Acceptance instead is:

```bash
cd bfna-website-nuxt
npx nuxt typecheck 2>&1 | grep -cE 'error TS'      # <= 176 (the baseline on dev)
npx nuxt typecheck 2>&1 | grep -E 'error TS' | grep -E 'src/(components/bf|types|composables/bf)|content\.config' | wc -l   # 0
npx nuxt generate                                   # exits 0
test -f .output/public/insights/index.html          # /insights prerenders
npx tsx scripts/check-probes.ts --only 33           # the #173 row
npx tsx scripts/check-probes.ts                     # every probe, green
grep -o '<main id="main"[^>]*>.\{0,40\}' .output/public/index.html   # no announcer inside main (#179)
```

plus a browser pass (STEP 6) over the built output: `?format=report` narrows the grid and
survives a reload, a second facet composes with the first, clicking an active chip clears
it, load-more appends, and an impossible pair renders `bfEmptyState` under a single `h1`.

And the epic's standing gate:

```bash
git diff --stat f757a649 HEAD -- bfna-website-nuxt/src/pages/wireframes \
  bfna-website-nuxt/src/components/wireframe bfna-website-nuxt/src/layouts/wireframe.vue \
  bfna-website-nuxt/src/public/css/wireframe.css      # prints nothing
```

## Risks

1. **`bfFilterBar` is multi-select; this page's facets are single-valued.** The component
   emits the whole new array; the page reduces it to at most one key (the one that is not
   the current selection) and writes that to the query. Toggling the active chip emits an
   array without it → the key is dropped from the URL. Mitigated by driving the real page
   in a browser in STEP 6 rather than reasoning about it.
2. **The announcer partition (#179) depends on a vnode shape Nuxt owns.** Written to
   degrade to today's behaviour if nothing matches, and verified against the *generated*
   HTML rather than against the dev server.
3. **Probe 33's per-case rows are position-sensitive.** The `headingLevel` instance is
   therefore mounted *after* the staged one and asserted by its own row, so no existing
   row's `CASES`-shaped expectation changes.
4. **`/archive` does not exist yet** (issue 55 / a later gh issue). The link is written
   anyway — `pages/[program].vue` already ships the same forward link, and the route
   lands before the epic closes.
