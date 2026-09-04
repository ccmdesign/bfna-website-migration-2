# Plan — gh#64 / issue 55 — Archive `/archive`

Spec: [`docs/ds-epic/issues/55-page-archive.md`](../ds-epic/issues/55-page-archive.md).
Branch: `feature/gh64-archive-archive` off `dev`.

## Approach

One **new** file, `src/pages/archive.vue`, on `bf-default`. It is the singular
route: the legacy `/archives` (plural) is redirected by #57 and deleted by #58,
and neither is touched here.

The page descends from the frozen `pages/wireframes/archive.vue` (D2 — read,
never edited) and keeps its structure element for element, swapping the
wireframe's hand-rolled parts for the components that now exist:

| Wireframe | Here |
|---|---|
| `<wf-page-header>` + count/range `<p>` | `<bfPageHeader>` + the same `<p data-measure="narrow">` in its default slot |
| `<wf-section label="By year">` | `<bfSection label="By year">` |
| `<details :open="y === years[0]"><summary><strong>{{year}}</strong> ({{n}})` | `<bfAccordion :label="\`${year} (${n})\`" :open="y === years[0]">` |
| `<li class="cluster">` + `wf-chip` + `NuxtLink` + `<time>` | one `<bfCardRow variant="insight" :item :heading-level="3">` |

The year grouping is the wireframe's, ported verbatim: a `Map` keyed by
`publish_date.slice(0, 4)` with `'Undated'` as the fallback bucket, then
`sort((a, b) => b.year.localeCompare(a.year))` — descending, newest first. It
lives **in the page**, not in `useBfInsights` (the spec is explicit, and the
composable stays thin by design).

Data is `useBfInsights().archived` — 256 rows in the current snapshot, all of
them carrying a `publish_date`, spread over 11 years (2007, then 2014–2023).
The `'Undated'` branch is kept anyway: it costs one `??`, and an archived row
with a null date is a data change away, not an impossibility.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/pages/archive.vue` | **new** — the whole issue |
| `docs/ds-epic/issues/55-page-archive.md` | Decisions appended |
| `docs/plans/gh64-plan.md` | this file |

Nothing else. No component is edited, no contract is changed, no new type is
declared, no new colour, no `pages/wireframes/**`, `components/wireframe/**`,
`layouts/wireframe.vue` or `public/css/wireframe.css` file touched, and no
probe page is added (the spec calls for none; the full probe suite is run as a
regression gate).

## Deviations from the spec text (recorded in the spec's Decisions)

- **No `bfFilterBar` facets.** The spec's §Scope item 3 says "omit unless the
  runner confirms it's wanted — flag as an open decision rather than silently
  adding UI the wireframe doesn't show". The wireframe `/archive` has no facet
  UI, so none is built; recorded as an open decision.
- **Crumbs gain a trailing current-page node.** The spec quotes
  `[{Home,/}, {Insights,/insights}]`; `bfBreadcrumb`'s contract marks the
  current page by a `to`-less final `Crumb`, so a third `{ label: 'Archive' }`
  is appended. Without it the trail ends on a link to a page the reader is not
  on and the current page is unnamed.
- **No vitest.** The harness on `dev` is broken and pre-existing (residual
  #86). The per-year-count assertions run as an inline `npx tsx` assertion over
  the generated HTML instead (see Verification).

## Test strategy

Run in `bfna-website-nuxt/`:

1. **Typecheck gate** — `npx nuxt typecheck` total `error TS` count ≤ the
   pre-change baseline (176), and 0 errors matching
   `src/(components/bf|types|composables/bf)|content\.config`.
2. **Build** — `npx nuxt generate` exits 0 (never `npm run generate`).
3. **Prerender** — `.output/public/archive/index.html` exists.
4. **Structure** — over the generated HTML: `<details class="bf-accordion">`
   count === 11 (one per year); exactly one carries `open`, and it is the
   first (2023); the per-accordion `.bf-card-row` counts sum to 256 and match
   the `(n)` in each summary; 256 distinct `/insights/<slug>` hrefs (unique
   since #151).
5. **Wireframe byte-identity** — the cumulative diff against the pre-epic base
   prints nothing.
6. **Probes** — the full `npx tsx scripts/check-probes.ts` exits 0.
7. **Browser** — the generated `/archive` driven headlessly: newest accordion
   open, a closed one opens on Enter from the keyboard, focus ring visible.

## Risks

- **Prerender reachability.** `/archive` is not in `nitro.prerender.routes`;
  it is reached because `pages/insights/index.vue:330` renders
  `<bfButton to="/archive">`. The batched prerender hand-off is known to be
  lossy (the `probeRoutes` note in `src/nuxt.config.ts`), so if
  `.output/public/archive/index.html` is missing after a clean generate, the
  fix is to seed `/archive` into `prerender.routes` — a one-line config change,
  recorded in Decisions if taken.
- **256 rows in one page.** No pagination (spec § Out of scope). Ten of the
  eleven accordions are closed on load, so the cost is DOM weight, not layout;
  `<details>` keeps closed content out of the tab order natively.
- **The `Archive` chip.** `bfCardRow` appends an `Archive` chip for any row
  with `archived === true`, which is every row on this page. That is the
  component's contract, not this page's decision, and it is left alone —
  recorded in Decisions.
