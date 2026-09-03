# 03 — composition-gap-api

Make `data-gap` work as the single spacing attribute on `.stack`, `.cluster`,
`.switcher` and `.grid`, with `data-space` accepted as an alias everywhere.

## Context

Depends on 01. Blocks 04 (grid min-width builds on this file), 20 (`bfCard`
needs a working gap on its chip cluster), 39 (`bfSection`), 42 (`bfGridInsights`/
`bfGridProjects`). Builds from the four composition CSS files under
`bfna-website-nuxt/src/public/css/composition/`: `stack.css`, `cluster.css`,
`switcher.css` (each currently keys spacing off `[data-space="…"]` only) and
`grid.css` (keys spacing off `[data-gap="…"]` only). Provenance: BF-176; v2
§2 Level 0 row 1 ("honor `data-gap` on `.stack`/`.cluster`/`.switcher`,
currently `.grid`-only").

**Verified today** (`grep -rn "data-gap\|data-space" src/components/wireframe
src/pages/wireframes`): every `wf-*` file writes `data-gap="…"` on `.stack`/
`.cluster`/`.switcher` elements too (e.g. `wfFooter.vue:16` `class="stack"
data-gap="xs"`, `wfHero.vue:14` `class="cluster" data-gap="s"`) — today these
are silent no-ops because the CSS for those three primitives only defines
`[data-space="…"]` selectors.

## Scope

Edit the four files under `bfna-website-nuxt/src/public/css/composition/`
only (all in the `@layer composition`, none is a `wf-*` file):

- `stack.css`, `cluster.css`, `switcher.css` — for each, add a `[data-gap="…"]`
  selector block identical in values to the existing `[data-space="…"]`
  block already there (`3xs`…`3xl` → the same `var(--space-*)` custom
  property each already sets), so both attributes set the same internal
  variable (`--_stack-space` / `--_cluster-space` / the switcher's
  `--_switcher-space`). `data-gap` and `data-space` are aliases — same
  selector specificity, last-declared-wins is acceptable if both are present
  on one element (not a real call site today).
- `grid.css` — add the mirror `[data-space="…"]` block (currently only
  `[data-gap="…"]` exists, lines 13–21) so `.grid` accepts both attribute
  names too, same `--_grid-gap` variable, same 9-step scale.
- Values: `3xs, 2xs, xs, s, m, l, xl, 2xl, 3xl` mapped to the existing
  `var(--space-3xs)` … `var(--space-3xl)` Utopia tokens already referenced
  by every one of these files today. No new spacing value.
- Add a probe page at `src/pages/bf-probe/03-composition-gap-api.vue`
  (dev-only, per BRIEF §Probe pages) rendering `.stack`, `.cluster`,
  `.switcher`, `.grid` each with `data-gap="xs"`, `data-gap="l"`, `data-gap="3xl"`
  siblings to visually confirm three distinct gaps per primitive.

## Out of scope

- `.box`, `.frame`, `.cover`, `.reel`, `.imposter`, `.container` — explicitly
  unchanged (v2 §2 Level 0 last row).
- Editing any `wf-*` file or `public/css/wireframe.css` to make use of the
  now-working attribute — D2 freezes them; the ~50 wireframe call sites stay
  as `data-gap` no-op writes today and silently start working once this
  issue lands, no wireframe file is touched.
- `data-min-width` (issue 04) and `data-measure` (issue 05).
- Any edit under `pages/wireframes/` or `components/wireframe/` — fails the
  epic even if the change looks like a bugfix.

## Styling

Tokens: existing `--space-3xs`…`--space-3xl` Utopia scale only, no new
value. Composition primitives touched: `.stack`, `.cluster`, `.switcher`,
`.grid` (all four, `@layer composition`). No `--_bf-*` CSS-variable hook —
this issue has no component, it is substrate.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
grep -c 'data-gap=' src/public/css/composition/stack.css     # today: 0, fails
grep -c 'data-gap=' src/public/css/composition/cluster.css   # today: 0, fails
grep -c 'data-gap=' src/public/css/composition/switcher.css  # today: 0, fails
grep -c 'data-space=' src/public/css/composition/grid.css    # today: 0, fails
git diff --stat -- src/pages/wireframes src/components/wireframe   # must be empty
```
Plus the probe page: 4 primitives × 3 `data-gap` values render 3 visibly
distinct gaps each (manual/visual check, per the issues.md `verify` column).

## Decisions

_Runner appends here._
