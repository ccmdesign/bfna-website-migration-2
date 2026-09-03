# 27 — `bfCardRow` — dense list row (6th typed wrapper, new)

One-line objective: componentise the un-componentized dense list row (chip +
linked heading + time on one line) used by search results and the archive
accordion, as a new `bfCard`-based typed wrapper.

## Context

Depends on 20 (`bfCard`), 16 (`bfChip`), 18 (`bfTime`). Builds from **new**
markup — the wireframe left this un-componentized: inline chip + `NuxtLink`
+ `<time>` in `pages/wireframes/search.vue:50-56` (results list) and
`pages/wireframes/archive.vue:17-21` (per-year accordion list). Consumed by
43 (`bfSearchShell` results list), 55 (`/archive` accordion body).
Provenance: BF-202; as-built confirms "card: list row — new (6th variant) —
unbuilt-still-valid".

## Scope

- File: `src/components/bf/CardRow.vue` → `<bfCardRow>`.
- Props:
  ```ts
  interface Props {
    item: Insight | Project   // zod-inferred union from issue 09 (bfInsights | bfProjects)
    variant?: string           // presentation hint, no wf-* precedent to name values from — leave as an open string, document usage in the demo
  }
  ```
- `inheritAttrs: false`, built on `<bfCard v-bind="$attrs">` with a compact
  preset (no media slot ever filled, chips + heading + time on one visual
  line via a `.cluster` wrapper with `data-gap="xs"` inside the default
  slot — mirrors `archive.vue:17`'s `<li ... class="cluster" data-gap="xs">`
  structure, not `wfCard`'s default stacked layout).
- A discriminated read on `item`: if it has a `publish_date`/`format` field
  it is an `Insight` (renders the format chip via `formatLabel` +
  conditional Archive chip + `/insights/:slug` link); if it has `kind`/
  `external_url` it is a `Project` (renders the kind chip + `/projects/:slug`
  link, no time — projects carry no display date in the wireframe row
  markup). Use a type guard, not a runtime `instanceof` — both are plain
  data objects.
- `<bfTime :date="item.publish_date" />` renders only for the `Insight`
  branch (the archive row's bare `<time>{{ monthYear(...) }}</time>` becomes
  this).
- Heading wraps gracefully at narrow widths — no `white-space: nowrap`, no
  fixed-width heading column.

## Out of scope

- The results list or accordion **containers** (issues 43, 55 own those —
  this component is one row).
- Relevance meters (that bar is bespoke to `bfSearchShell`, issue 43, not
  this row).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variable `--_bf-card-row-gap` (falls back to the `xs` Utopia space
  token) for the cluster gap between chip/heading/time.
- No new colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/CardRow.vue
grep -q "Insight | Project" src/components/bf/CardRow.vue
```
Probe page `src/pages/bf-probe/27-bf-card-row.vue` renders one `Insight` row
and one `Project` row from the same `v-for` over a mixed array (proving the
union works from one call site), including one insight with a 980-character
heading to prove it wraps without breaking the row layout:
```bash
grep -q "bf-card-row" .output/public/bf-probe/27-bf-card-row/index.html
```
Fails today (no `bf/CardRow.vue`), passes once done.

## Decisions

_Runner appends here._
