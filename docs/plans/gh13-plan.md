# Plan — gh#13 / issue 04 `.grid[data-min-width]` responsive contract

Spec (authoritative): [`docs/ds-epic/issues/04-composition-grid-min-width.md`](../ds-epic/issues/04-composition-grid-min-width.md)
Issue: ccmdesign/bfna-website-migration-2#13 · Epic: BF-217 · Base: `dev` · Branch: `feature/gh13-grid-data-min-width`

## Approach

`.grid` already resolves its track sizing from `--_grid-min-width` and
`[data-min-width="xs…2xl"]` already maps that variable onto a 6-step
`160px…500px` scale (`grid.css:36–41`). The mechanism is therefore present and
the attribute values are correct — the defect is the **missing `min(…, 100%)`
wrap** on the `minmax()` floor. A floor wider than the available inline size
(e.g. `2xl` = 500px inside a 360px container) cannot be honoured by
`auto-fill`, so the track overflows the container and the page scrolls
sideways instead of collapsing to one column. One character-level change to
line 4 turns the attribute into a real responsive contract:

```css
grid-template-columns: repeat(auto-fill, minmax(min(var(--_grid-min-width, 240px), 100%), 1fr));
```

This is the whole functional change. Everything else is documentation and a
probe.

### Rule order — respects D-03.1

D-03.1 (issue 03's Decisions section) fixed `data-gap` as canonical and
`data-space` as the alias, made uniform by declaring the `[data-gap]` block
**last** among the `--_grid-gap` writers. In `grid.css` the order is therefore
`[data-space]` → `[data-gap]` → `[data-min-width]`. The `[data-min-width]`
block already sits below both and writes a *different* variable
(`--_grid-min-width`), so **no block is added, moved or reordered** by this
issue. The edit is confined to line 4 (inside `.grid` itself) plus a comment
block above `@layer composition`. Precedence is untouched by construction.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/public/css/composition/grid.css` | wrap the `minmax()` floor in `min(…, 100%)` (line 4); add a header comment documenting the 6 `data-min-width` values and their interaction with `data-gap`/`data-space` |
| `bfna-website-nuxt/src/pages/bf-probe/03-composition-gap-api.vue` | **extend** (per spec) with a `data-min-width` section: an `l` (300px) grid of 6 items for the 3→2→1 reflow check, plus a `2xl` (500px) grid that proves the `min(…,100%)` overflow fix |
| `docs/ds-epic/issues/04-composition-grid-min-width.md` | append `## Decisions` entries |
| `docs/plans/gh13-plan.md` | this file |

No `wf-*` file, no component, no new token, no new colour, no inline
`grid-template-columns` anywhere.

## Test strategy

1. **Typecheck gate** (repo rule, not the spec's `npm run typecheck`): `dev`
   carries 178 legacy errors, so the gate is *no new errors* — count must stay
   ≤ 178 and the `src/components/bf|types|composables/bf|content.config`
   filter must be 0.
2. `npx nuxt generate` exits 0 (never `npm run generate`).
3. `grep -n "minmax(min(var(--_grid-min-width" src/public/css/composition/grid.css` → exactly 1 match (spec's own acceptance command; exits 1 today).
4. Cumulative wireframe byte-identity against the pre-epic SHA `f757a64` prints nothing.
5. Browser: serve `.output/public`, load `/bf-probe/03-composition-gap-api/`
   headless at 1200 / 800 / 400 px and read the live `grid-template-columns`
   track list off the `l` grid — 3 → 2 → 1 tracks, and assert the element
   carries no inline `style`. At 400px also assert
   `documentElement.scrollWidth <= clientWidth` with the `2xl` grid present.
6. Probe 03's own gap assertions (`data-gap` > `data-space` precedence rows)
   still hold — regression check on the earlier probe.

## Risks

- **R1 — reflow thresholds are container-relative, not viewport-relative.**
  `.container` is `max-inline-size: 1200px` with `--space-m` inline padding, so
  the 3/2/1 boundaries are computed on ~1140 / ~750 / ~355px of content. With a
  300px floor and a `--space-s` gap the counts land at 3 / 2 / 1 with margin on
  both sides of each boundary. Verified by reading the resolved track list, not
  by eyeballing.
- **R2 — wireframe rendering may shift.** `min(…,100%)` only *lowers* the floor
  when it exceeds the container, so it can only remove overflow. All 7 `wf-*`
  `ul.grid` sites hand-pin `grid-template-columns` inline anyway, which beats
  the composition layer — they are unaffected. Source stays byte-identical
  either way (checked); a rendered-output change is permitted by DoD-4.
- **R3 — editing a merged probe.** The spec directs extending probe 03 rather
  than adding `04-*.vue`. Existing `data-testid` hooks and sections are left
  intact; only additive markup and one docblock line change.
