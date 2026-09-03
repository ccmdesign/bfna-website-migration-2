# Plan — gh#51 / issue 42: `bfGridInsights` + `bfGridProjects`

**Spec:** [`docs/ds-epic/issues/42-bf-grids.md`](../ds-epic/issues/42-bf-grids.md) ·
**Issue:** [gh#51](https://github.com/ccmdesign/bfna-website-migration-2/issues/51) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)

## Approach

Two thin data-in/cards-out organisms, built together under the BRIEF §5 rule 5
named-bundle exception. Each is a `<ul class="grid">` that `v-for`s a typed card
wrapper. Neither ships a `<style>` block and neither declares a column count:
column policy is a `minWidth` prop forwarded to `data-min-width`, resolved by
`composition/grid.css` (issue 04 / gh#13).

Three things are settled before writing code, because each is where the file
could go wrong:

1. **`minWidth` is a keyword union, not a free `string`.** The spec writes
   `minWidth?: string`, but `grid.css` maps exactly six values
   (`xs s m l xl 2xl`) onto floors; any other string sets the attribute, matches
   no rule, and silently falls back to the unset `240px` default. A union makes
   that a compile error. The type lives in `src/types/bf-contracts.ts`
   (BRIEF §5 rule 11) since both components share it.
2. **The defaults are read off issue 04's own measurements**, not guessed —
   see D-04.5 in `docs/ds-epic/issues/04-composition-grid-min-width.md`.
   `l` (300px floor) resolved 3 / 2 / 1 tracks at 1200 / 800 / 400px, which is
   the insights grid's pinned-3-col intent. Projects needs 2 at 1200, which
   pins the floor above `1140/3 ≈ 380` and below `1140/2 ≈ 570` → `xl` (400px).
   Justified per grid in the spec's Decisions.
3. **`extraChips` is a function on the grid and an array on the card.** The
   frozen `wfGridInsights.vue` takes `(i: WfInsight) => string[] | undefined`
   and calls `extraChips?.(i)` per row; `bfCardInsight` takes `extraChips?:
   string[]`. Keep exactly that shape — the grid is where the per-row function
   is applied.

## Files

| File | Change |
|---|---|
| `src/types/bf-contracts.ts` | add `GridMinWidth` union + `GridInsightsProps` / `GridProjectsProps` |
| `src/components/bf/GridInsights.vue` | new — `<bfGridInsights>` |
| `src/components/bf/GridProjects.vue` | new — `<bfGridProjects>` |
| `src/pages/bf-probe/42-bf-grids.vue` | new — probe under `layout: 'bf-probe'` |
| `docs/ds-epic/issues/42-bf-grids.md` | append Decisions |

Nothing under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue`
or `public/css/wireframe.css` is touched (D2).

## Component contract

```ts
// bfGridInsights
insights: Insight[]
excerptLength?: number
extraChips?: (i: Insight) => string[] | undefined
minWidth?: GridMinWidth   // default 'l'
headingLevel?: CardHeadingLevel  // forwarded to every card

// bfGridProjects — same shape
projects: Project[]
excerptLength?: number
minWidth?: GridMinWidth   // default 'xl'
headingLevel?: CardHeadingLevel
```

`headingLevel` is added because the card wrappers take it (#128) and the grid is
what stands between a template's section heading and the card — a template that
places a grid in a subsection has no other way to reach it. It is forwarded, not
re-decided: the grid's default is `undefined`, so the card's own `3` applies.

`excerptLength` is likewise forwarded as `undefined` when unset, so each card's
own default (`140`) stands rather than the grid restating it.

`$attrs` falls through to the `<ul>` (BRIEF §5 rule 4). `inheritAttrs` stays at
its default `true` — unlike the card wrappers there is no explicit
`v-bind="$attrs"` on a child component to double up with, and the `<ul>` is the
root the caller means.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe under the headless harness — the gh#20–#41 precedent
and the #109 decision.

`src/pages/bf-probe/42-bf-grids.vue`, `layout: 'bf-probe'`, root
`[data-probe]="42"` + `[data-probe-verdict]`, rows `[data-probe-row][data-ok]`.

Fixtures (BRIEF §5 rule 10 — real shapes, real lengths):
- 6 insights, including one with `image: null` and one the `extraChips` function
  answers for; excerpts at real lengths.
- 4 projects.

Three fixed-width rails per grid — 1200 / 800 / 400px with `.container`'s own
`padding-inline: var(--space-m)` — so absolute track counts can be asserted at
one harness viewport rather than derived from whatever width the run happens to
have. Assertions:

1. `getComputedStyle(ul).gridTemplateColumns` splits to **3 / 2 / 1** tracks for
   insights and **2 / 1 / 1** for projects.
2. …and each count **agrees with the `auto-fill` arithmetic**
   `floor((W + gap) / (min(floor, W) + gap))` at ±1px, so a failure names the
   reason rather than only the number (probe 03's method).
3. Neither `<ul>` carries a `style` attribute — the column count is never
   authored.
4. `data-gap="m"` resolves the same `column-gap` on both, matching the frozen
   `wf-*` sources.
5. **Row gap equals column gap** on the wrapped 400px rail, measured between two
   stacked cards, and every card `<li>` reports `margin-block: 0px` — the
   `li { margin-bottom: 0.5em }` leak D-36.7 caught in `bfFooter`.
6. `extraChips` reaches the card: the row the function answers for renders the
   extra chip text; the rows it returns `undefined` for do not.
7. One `<li>` per fixture row, `:key` on `slug`, cards are direct children.
8. `minWidth` is honoured: an explicit non-default value changes the resolved
   `--_grid-min-width`.
9. No `bf-*` rule on the page uses `:not()` with a complex selector (D-20.5).

Commands (all in `bfna-website-nuxt/`):

```bash
npx nuxt typecheck            # ≤ 178 total, 0 in src/components/bf|src/types
npx nuxt generate             # exits 0
grep -rn 'grid-template-columns' src/components/bf | wc -l   # 0
npx tsx scripts/check-probes.ts --only 42
npx tsx scripts/check-probes.ts
```

Plus the cumulative wireframe byte-identity diff against the pre-epic base.

## Risks

| Risk | Mitigation |
|---|---|
| `--space-m` is a fluid clamp, so a rail's content width is viewport-dependent and a pinned track count could flip | assertion 2 pairs every pinned count with the arithmetic check, and the rails are wide of every boundary (3-col needs ≥ 972px of content, the 1200 rail has ~1150) |
| `data-span="full"` cards (`bfCard`'s grid-slot modifier) interacting with `auto-fill` | out of scope here — the grids pass no `span`; `1 / -1` is already proven safe at any count in `bfCard` |
| `minWidth` typed as a union diverges from the spec's literal `string` | recorded as a Decision with the failure mode it prevents |
| The probe's fixed-width rails do not exercise a real viewport reflow | the harness has one viewport by construction (#109); rails are the same technique probe 03 uses, plus pinned counts |
