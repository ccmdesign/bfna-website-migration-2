# 42 — `bfGridInsights` + `bfGridProjects` — data-in/cards-out grids (build together)

One-line objective: evolve both grid wrappers together as thin data-in/
cards-out organisms wrapping `bfCardInsight`/`bfCardProject`, consuming the
`data-min-width` contract instead of hand-pinned columns.

## Context

Depends on 04 (`.grid[data-min-width]` — hard dependency, D9), 21
(`bfCardInsight`), 22 (`bfCardProject`). Builds from
`src/components/wireframe/wfGridInsights.vue` (fixed 3-col, `style=
"grid-template-columns: repeat(3, 1fr)"`) and `wfGridProjects.vue` (fixed
2-col, same pattern) — built together per BRIEF §5's named bundle
exception. Consumed by templates 47, 48, 49, 50, 51, 52 (`bfGridInsights`)
and 47, 48, 51 (`bfGridProjects`). Provenance: BF-171 (depends on BF-178,
i.e. issue 04); D9.

## Scope

- Files: `src/components/bf/GridInsights.vue` → `<bfGridInsights>`,
  `src/components/bf/GridProjects.vue` → `<bfGridProjects>`.
- `bfGridInsights` props:
  ```ts
  interface Props {
    insights: Insight[]        // zod-inferred type from issue 09
    excerptLength?: number
    extraChips?: (i: Insight) => string[] | undefined
  }
  ```
  Renders `<ul class="grid" data-min-width="..." data-gap="m"><bfCardInsight
  v-for="i in insights" :key="i.slug" :insight="i" :excerpt-length=
  "excerptLength" :extra-chips="extraChips?.(i)" /></ul>` — **no**
  `style="grid-template-columns: ..."` anywhere; column policy expressed
  entirely as the `minWidth` prop below.
- `bfGridProjects` props: same shape, `projects: Project[]`, wraps
  `bfCardProject`.
- Both additionally accept:
  ```ts
  minWidth?: string   // forwarded to the grid's data-min-width, default chosen to approximate the wf source's 3-col/2-col intent at typical viewport widths — document the chosen default per grid in Decisions
  ```
- Neither component fetches data — both are pure props-in/cards-out, no
  `queryCollection`, matching D8.

## Out of scope

- Fetching data (pages own that — issues 47–52 call the composables and
  pass arrays in).
- A unified shared grid base between the two (as-built explicitly flags
  "no shared base between the two — could be unified per D.2" but the
  BRIEF/inventory says "not enough evidence yet" — do not build one).
- The two raw page-level grids on the homepage (`index.vue:29` featured
  projects, `index.vue:39` product+featured band) — their bf-* successor
  (issue 47, home template) owns those directly, they are not wrapped by
  either of these two organisms.
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables — column policy is entirely `data-min-width`/
  `data-gap`, both resolved by the composition layer (issues 03/04). No
  inline `grid-template-columns` anywhere in either file (hard grep gate
  below).

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/GridInsights.vue
test -f src/components/bf/GridProjects.vue
grep -n 'grid-template-columns' src/components/bf/GridInsights.vue src/components/bf/GridProjects.vue   # must print nothing
grep -q "data-min-width" src/components/bf/GridInsights.vue
grep -q "data-min-width" src/components/bf/GridProjects.vue
```
Probe page `src/pages/bf-probe/42-bf-grids.vue` renders both grids from
fixture arrays and both reflow responsively at 1200/800/400px (per the
issue-04 probe methodology):
```bash
grep -n 'grid-template-columns' src/components/bf | wc -l   # 0
```
Fails today (no `bf/GridInsights.vue`/`bf/GridProjects.vue`), passes once
done.

## Decisions

_Runner appends here._
