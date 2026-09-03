# 04 — composition-grid-min-width

Make `.grid[data-min-width]` a real responsive contract instead of a fixed
`minmax()` floor, so column count derives from available width.

## Context

Depends on 03 (same file, `grid.css`, gap-API landed first to avoid
re-touching the file twice in conflicting ways). Blocks 36 (`bfFooter`), 42
(`bfGridInsights`/`bfGridProjects`), 47 (Home), 53 (About) — their hand-pinned
`grid-template-columns` successors all consume this. Builds from
`bfna-website-nuxt/src/public/css/composition/grid.css`. Provenance: BF-178;
v2 §2 Level 0 row 2; D9 (BRIEF §4) names the exact successor issues.

**Verified today**: `grid.css` line 4 sets
`grid-template-columns: repeat(auto-fill, minmax(var(--_grid-min-width,
240px), 1fr))` — the mechanism exists and `[data-min-width="xs|s|m|l|xl|2xl"]`
already maps to `160px…500px` (lines 24–29), but nothing in scope uses it
(`grep -rn "data-min-width" src` under `bfna-website-nuxt/src` returns only
one hit, `src/pages/blog/index.vue:20`, outside the wireframe/bf scope). All
7 `wf-*` `ul.grid` sites hand-pin `grid-template-columns: repeat(N,1fr)` via
inline `style` instead (as-built-wireframe-inventory.md §C/§D.2):
`wfFooter.vue:15`, `wfGridInsights.vue:16`, `wfGridProjects.vue:15`,
`index.vue:29`, `index.vue:39`, `about.vue:13`, `about.vue:19`. None reflow.

## Scope

- `bfna-website-nuxt/src/public/css/composition/grid.css` — change line 4's
  `minmax(var(--_grid-min-width, 240px), 1fr)` to
  `minmax(min(var(--_grid-min-width, 240px), 100%), 1fr)` so a min-width
  larger than the viewport can't force horizontal overflow on narrow
  screens (the missing `min(…, 100%)` wrap is the actual bug — the
  `data-min-width` attribute values themselves already work).
- Document the six supported values (`xs=160px` … `2xl=500px`, already
  defined lines 24–29) and their interaction with `data-gap`/`data-space`
  from issue 03 in a short comment block at the top of `grid.css`.
- Probe page (extend the one from issue 03): a `.grid[data-min-width="l"]`
  (300px) with ≥6 placeholder items, resized/verified at 1200px (3 col),
  800px (2 col), 400px (1 col) viewport widths, no inline `style` on the
  grid element.

## Out of scope

- Any inline `grid-template-columns` in new `bf-*` code — every later
  organism/template that needs a grid uses `.grid[data-min-width]` only
  (D9 names bfFooter/36, bfGridInsights+bfGridProjects/42, page-home/47,
  page-about/53 as the consumers, not this issue).
- Editing any of the 7 `wf-*` hand-pinned sites listed above — D2/D9 freeze
  them; their `bf-*` successors consume this fix later, not by editing the
  frozen files.
- Changing the `data-gap`/`data-space` value scale (issue 03's job, already
  done by the time this issue starts).
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

Tokens: no new value — reuses the existing 6-step min-width scale
(`160px…500px`) already declared in `grid.css`. Primitive: `.grid` only,
`@layer composition`. No `--_bf-*` hook — substrate, not a component.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
grep -n "minmax(min(var(--_grid-min-width" src/public/css/composition/grid.css
# today: no match (grep exits 1); after: 1 match
git diff --stat -- src/pages/wireframes src/components/wireframe   # must be empty
```
Plus the probe grid reflows 3→2→1 columns at 1200/800/400px viewport
widths with no inline `style="grid-template-columns"` on the element
(manual/visual check, per the issues.md `verify` column).

## Decisions

_Runner appends here._
