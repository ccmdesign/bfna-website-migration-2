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

**D-04.1 — the bug was the missing `min(…, 100%)`, not the attribute scale.**
`grid.css` already resolved tracks from `--_grid-min-width` and already mapped
`[data-min-width="xs…2xl"]` onto `160px…500px`. The only functional change is
line 4's floor: `minmax(var(--_grid-min-width, 240px), 1fr)` →
`minmax(min(var(--_grid-min-width, 240px), 100%), 1fr)`. The six values, the
private variable name and the `240px` default are all unchanged, so no existing
`.grid` consumer can regress: `min()` can only *lower* the floor, and only when
the floor already exceeded the container — i.e. only in the overflow case.
Measured on the probe at a 400px viewport with `data-min-width="2xl"`: old rule
resolved a `500px` track and `document.documentElement.scrollWidth` was `522`
against a `400` client width (horizontal overflow); new rule resolves
`356.45px` (one full-width column) with `scrollWidth === clientWidth === 400`.

**D-04.2 — no block was added, moved or reordered, so D-03.1 is untouched.**
D-03.1 requires the `[data-gap]` block to stay declared *after* the
`[data-space]` block in `grid.css` so `data-gap` wins at equal specificity
(0,2,0). The `[data-min-width]` block already sat below both and writes a
*different* variable (`--_grid-min-width`), so it never participated in that
precedence. This issue edits only the `.grid` rule body plus comments; the
`[data-space]` → `[data-gap]` → `[data-min-width]` order is byte-identical.
Re-verified live on the probe: the `-both` rows (`data-gap="3xl"
data-space="xs"`) still resolve `87.10px`, equal to the `data-gap="3xl"` rows,
on all four primitives.

**D-04.3 — probe 03 was extended rather than a `04-*.vue` added.** The spec
says "extend the one from issue 03", which also keeps the `data-gap` ×
`data-min-width` interaction demonstrable on one page. The change is purely
additive — a third `<section>` plus one `gridItems` constant and a docblock
paragraph; every existing `data-testid` and case in probe 03 is intact, and
its gap assertions were re-run as a regression check. Three new hooks:
`grid-min-width-l` (the 3→2→1 acceptance case), `grid-min-width-2xl` (the
`min(…,100%)` overflow case) and `grid-min-width-l-gap-3xl` (the documented
composition of the two attributes — the wider gap is subtracted from available
inline size before the count resolves). Per the epic ground rules the probe is
kept; only the final cutover issue removes `src/pages/bf-probe/`.

**D-04.4 — the documentation lives in a header comment above `@layer
composition`.** The spec asks for the supported values and the `data-gap`
interaction to be documented "in a short comment block at the top of
`grid.css`". A CSS comment before the `@layer` block is valid and keeps the
table out of the cascade; `npx stylelint` on the file exits 0. The
`[data-min-width]` block also carries a two-line inline note pointing back at
the table and stating explicitly that it does not participate in D-03.1
precedence, so a future reader touching rule order sees it in place.

**D-04.5 — reflow thresholds are container-relative and were read back, not
eyeballed.** `.container` is `max-inline-size: 1200px` with `--space-m` inline
padding, so the acceptance viewports give ~1140 / ~750 / ~356px of content
against a 300px floor. Resolved `grid-template-columns` track lists at the
three widths: **1200px → `367.19px ×3`**, **800px → `365.80px ×2`**, **400px →
`356.45px ×1`**, with `getAttribute('style') === null` on the element at every
width. The 3→2→1 acceptance therefore holds with margin on both sides of each
boundary rather than by coincidence.
