# gh#60 — plan — `/projects` index (spec 51)

## Objective

One new file, `bfna-website-nuxt/src/pages/projects/index.vue`, on layout
`bf-default`. Retires nothing (no legacy page owns `/projects`; the nearest
analog is the `[...slug].vue` product branch, retired by #58/#57).

## Approach

Descends from the frozen `src/pages/wireframes/projects/index.vue` — read for
band order and copy, never edited, nothing imported from it.

Three zones, in the frozen source's order:

1. `bfPageHeader label="Projects index"`, `heading = indexPage?.heading ??
   'All Projects'`, `tagline = indexPage?.description`, from
   `useBfPages().pageBySlug('projects')`.
2. One `bfSection` per `useBfPrograms().programs()` entry (`v-for`), each
   holding a linked `<h2>` to `/${program.slug}` and a
   `bfGridProjects :projects="gridProjectsByProgram(program.name)"
   :excerpt-length="120" :heading-level="3"`.
3. `bfSection v-if="retag.length"` — the "Pending re-tag (Q3)" band, from
   `useBfProjects().projectsPendingRetag()`.

## Breadcrumb — residual #188

The frozen source passes a single-entry trail `[{ label: 'Home', to:
'/wireframes' }]`. `bfBreadcrumb` (#20) treats the **last** crumb as the current
page and never links it, so a one-entry trail renders "Home" as an unlinked
`<span aria-current="page">` — the residual. The fix is at the call site, not in
the component: pass `[{ label: 'Home', to: '/' }, { label: 'Projects' }]`, the
same two-then-current shape `insights/[slug].vue` already uses. Home becomes a
real `<a href="/">`, "Projects" is the current page.

## Ordering

Never re-derived. `programs()` is already sorted on the stored `order`
(gh#180); `gridProjectsByProgram()` already sorts on the stored `grid_order`
(gh#89); `projectsPendingRetag()` returns its own set. The page calls each once
and renders the result.

## Data (measured from `content/bf/**` before writing a line)

| program (`order`) | grid-eligible |
|---|---|
| Democracy (1) | 4 — graphic-images, city-solutions-series, how-to-fix-democracy, election-analysis |
| Transatlantic Relations & Global Challenges (2) | 6 — transatlantic-periscope, range, transatlantic-barometer, astropolitics, indo-pacific-nexus, critical-minerals |
| Future Leadership (3) | 3 — the-bertelsmann-foundation-fellowship, summer-enrichment-series, leadership-in-action |

**13** project cards total, **0** pending-retag (100 Questions is archived), so
the third band does not render today. `transponder-magazine` is
`external_only` + `grid_eligible: false` — it is the homepage product band
(#47), not a card here. The epic's "14 project links" parity figure is 13 here
plus that one on `/`.

## Files

- `bfna-website-nuxt/src/pages/projects/index.vue` — new, the only app file.
- `docs/ds-epic/issues/51-page-projects-index.md` — Decisions appended.
- `docs/plans/gh60-plan.md` — this file.

No component change, no `bf-contracts.ts` change, no CSS. Nothing under
`pages/wireframes/**` or `components/wireframe/**`.

## Test strategy

- Typecheck gate: no new `error TS` vs. the recorded baseline (176), and zero
  in `src/(components/bf|types|composables/bf)` / `content.config`.
- `npx nuxt generate` exits 0 and emits `.output/public/projects/index.html`.
- Assert on the generated HTML: 3 `<section data-label>` bands, 13 `<h3>` card
  titles matching the table above, the pending band absent, `<a href="/">Home`
  present in the breadcrumb, and zero `grid-template-columns` in the page
  source.
- Full `npx tsx scripts/check-probes.ts` exits 0 (no new probe — probes stop at
  #46; this is a template issue).
- Wireframe byte-identity diff prints nothing.

## Risks

- **Route collision** — none. `pages/projects/` does not exist; `[...slug].vue`
  is a catch-all and ranks below a static segment, so no legacy file is deleted.
- **A linked `<h2>` inside a band.** `bfSection`'s own `heading` prop renders a
  plain `<h2>` and cannot carry a link, so the heading goes in the slot (as the
  frozen source does) and the band is named via `aria-labelledby` pointing at
  it — `bfSection`'s attr allowlist forwards `aria-*` and call-site attrs win.
- **`useId()` in a `v-for`** would be wrong; the ids are derived from the
  program slug instead, which is unique by construction.
