# 36 — `bfFooter` — site footer

One-line objective: evolve `wfFooter.vue` into `bfFooter`, fixing the same
D8 props-not-composable violation as `bfNav`, and switching the 4-column
layout to the data-driven grid contract from issue 04.

## Context

Depends on 35 (`bfNav`, reuses the internal `MenuLink` child), 04
(`.grid[data-min-width]` responsive contract — hard dependency, this is the
component the BRIEF explicitly names as the bf-* successor to one of the 7
hand-pinned `grid-template-columns` sites, D9). Builds from
`src/components/wireframe/wfFooter.vue` (as-built A/E: calls
`useWfContent().menus()` directly — same anti-pattern as `wfNav`, "must be
corrected in bf-*"). Consumed by 46 (layout shell). Provenance: BF-164; D8.

## Scope

- File: `src/components/bf/Footer.vue` → `<bfFooter>`.
- Props:
  ```ts
  interface Props {
    menus: Menu[]   // from src/types/bf-contracts.ts (issue 02) — same D8 fix as bfNav
  }
  ```
  Zero data access — no `useWfContent`, no composable, no `queryCollection`.
- Renders (same structure as `wfFooter.vue`): brand block (`BFNA` +
  "Bertelsmann Foundation North America") + search link, four menu columns
  from `menus.map(...)` reusing `bfNav`'s internal `MenuLink` child
  component (import it directly from `src/components/bf/nav/MenuLink.vue`
  — sibling reuse, not duplication), a social-links strip, a legal row
  (copyright year computed at render time, privacy link, "Site by ccm.design"
  credit — port the six social entries and their URLs verbatim from the wf
  source, including the placeholder Bluesky URL comment).
- The four-column menu grid: `<ul class="grid" data-min-width="..." data-
  gap="l">` — **no** `style="grid-template-columns: repeat(4, 1fr)"`
  anywhere in this file. Choose a `data-min-width` value that reflows to
  fewer columns before 4 columns get cramped (document the chosen value and
  why in Decisions — issue 04's probe established the reflow breakpoints at
  1200/800/400px, use those as a reference).

## Out of scope

- The search form (search lives in `bfNav`, not the footer — the footer's
  "Search" is a plain link, matching the wf source).
- A subscribe band (killed by D2 — do not resurrect it here).
- The layout wiring (issue 46 sources `menus` and passes it down).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variables `--_bf-footer-bg`, `--_bf-footer-border`. No new colour, no
  inline column style, no hand-pinned grid-template-columns anywhere in
  this file (grep-checked below).

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Footer.vue
grep -Lq "useWfContent\|queryCollection" src/components/bf/Footer.vue
grep -Lq "grid-template-columns" src/components/bf/Footer.vue
grep -q "data-min-width" src/components/bf/Footer.vue
```
Probe page `src/pages/bf-probe/36-bf-footer.vue` renders `<bfFooter :menus=
"fixtureMenus" />` from a fixture array and reflows to fewer columns at
narrow widths (verified via the resize-window / viewport check the issue-04
probe already established):
```bash
grep -q "bf-footer" .output/public/bf-probe/36-bf-footer/index.html
```
Fails today (no `bf/Footer.vue`), passes once done.

## Decisions

_Runner appends here._
