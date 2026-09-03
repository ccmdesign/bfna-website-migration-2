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

### D-27.1 — the stretched-link overlay moved from `::after` to `::before`

**Residual [#138] closed in this PR.** `external-link.css` paints the external
marker through `a[data-external]::after` at specificity **(0,1,1)**;
`bfCard`'s stretched link was `.bf-card :is(h2, h3, h4) a::after` at
**(0,1,2)** — `:is()` takes the specificity of its most specific argument — and
both live in `@layer components`. So the card's empty `content` won and **no
`bfCard` heading link in the system could ever show its `↗`**.

Option 3 of the three #138 records, taken because the other two are worse the
moment a second wrapper needs the marker: "accept it" leaves a silent trap for
the next reader, and rendering an explicit `<span aria-hidden> ↗</span>`
(`bfCardProject`'s answer) makes the affordance two different things spelled
two different ways in one component family.

The overlay is `position: absolute`, so it is out of flow: `::before` and
`::after` differ only in the tree position of a box that has been taken out of
the tree. No box moves, the anchor's text is untouched, and both
pseudo-elements paint after the anchor's own background either way — so the
change is a pure specificity release. The consequence is asserted three ways on
probe 20, not argued: the marker's resolved `content` is non-empty, the overlay
is `position: absolute` on `::before`, and the card is **still** hit-testable
over its whole area with a dispatched click reaching the anchor's handler.

Three rows on probes 25 and 26 measured the *old* pseudo-element, and one of
them (probe 26's) measured the defect itself — `content: ""` on `::after` was
the assertion. Fixing the cascade necessarily flips them, so they were updated
to assert the corrected behaviour, and probe 26 gained a third row proving
`::after` now carries no overlay of its own. Nothing else in probes 21–26
changed, and all 19 probes / 831 rows pass.

Two probe-20 mechanics also had to change, and neither is about `bfCard`:
adding a sixth card pushed the later hit-test targets below a 1280×1024
viewport, where `elementFromPoint` returns `null`, so each hit test now scrolls
its card into view first; and because scrolling and dispatched clicks move the
browser's *sequential focus navigation starting point*, the probe resets it
(focus + blur on the `<h1>`, then `scrollTo(0, 0)`) before arming the keyboard
handshake. Without the reset the harness's `Tab` resumed beside the last card
measured and check 8 reported a focus-ring regression that was an artefact of
the probe's own measuring.

[#138]: https://github.com/ccmdesign/bfna-website-migration-2/issues/138

### D-27.2 — the union is narrowed on `'publish_date' in item`

The spec names "`publish_date`/`format`" for the `Insight` branch and
"`kind`/`external_url`" for the `Project` branch. **`external_url` is on both
schemas** (`bfInsightSchema:55`, `bfProjectSchema:79`) and narrows nothing;
using it would have sent every insight carrying an external URL down the
project branch, silently — the fields that branch reads (`slug`, `heading`)
exist on an insight too, so the row would have rendered a plausible link to
`/projects/<an-insight-slug>`, a 404 that typechecks. The other three fields
are each on exactly one schema.

`publish_date` is the one used because it is also the field the Insight branch
*reads*, so the guard and the thing it protects are the same key.

`in` rather than a truthiness test, and this is load-bearing: `publish_date` is
`z.string().nullable()` and **20 of the 371 real rows carry `null`**.
`if (item.publish_date)` would have mis-routed every one of them. Probe 27
renders `astropolitics-bertelsmann-site-dedicated-to-geopolitics` — one of the
twenty — and asserts it still links into `/insights/`.

### D-27.3 — the row is a class modifier on `bfCard`, not a new stylesheet

`bfCardRow` ships **no stylesheet**. The one-line arrangement is
`.bf-card-row`, declared in `Card.vue`'s own `@layer components` block:
`flex-direction: row`, `flex-wrap: wrap`, `align-items: baseline`,
`gap: var(--_bf-card-row-gap)` (defaulting to `--space-xs`, the gap
`archive.vue:17`'s `class="cluster" data-gap="xs"` resolves to), plus zeroing
`.bf-card > time`'s `margin-block-start: auto` — which in a row is an auto
margin on the cross axis, overriding `align-items` and dropping the date off
the shared baseline.

It lives in the base because every one of those declarations *overrides a rule
a few lines above it*. A separate file would have had to re-specify
`.bf-card__chips`'s `order` and `.bf-card > time`'s margin from outside and
would have raced this block for both.

A **class**, unlike `data-span="full"`: `span` is a value from a closed set and
reads as a state; "this card is a row" is a kind. It also gives #43 and #55 a
name to hang container rules on. Every selector is written
`.bf-card.bf-card-row` — (0,2,x) — so the modifier outranks the base rule it
overrides on **specificity** rather than on source order, which a later
reordering of the block could otherwise break silently.

Chips keep the base's `order: -1`, so they lead the row visually exactly as the
frozen `archive.vue` / `search.vue` markup puts them, while the heading stays
**first in the DOM** — the base's invariant, untouched. Tokens only, no new
colour, and no `:not()` anywhere, so D-20.5 does not arise.

### D-27.4 — `variant` stays an open `string`

As the spec types it. There is no `wf-*` precedent to name values from — the
wireframe left this row un-componentised — so a union invented here would be a
guess with a compile error attached. It renders as `data-variant` and styles
nothing on its own; #43 and #55 are what will name its values, and widening a
`string` to a union later is the source-compatible direction.

This is the opposite call from `TimeFormat`, deliberately: there, a
silently-ignored value renders the wrong *content*; here, an unrecognised
`variant` renders an inert attribute that changes nothing.

### D-27.5 — acceptance substitutes the probe harness for vitest

The spec's acceptance names `npm run typecheck`, which routes through the
vitest harness that is broken and pre-existing on `dev` (residual [#86]). Per
the epic's standing decision and the [#109] harness decision, the
equivalent-strength substitution is:

- the **typecheck gate**: `npx nuxt typecheck` total `error TS` count must not
  exceed the pre-change baseline, and must be **0** within
  `src/components/bf|types|composables/bf|content.config`. Measured: baseline
  **178 / 0**, after **178 / 0**.
- `npx nuxt generate` exits 0 (never `npm run generate` — that needs Directus
  secrets);
- `npx tsx scripts/check-probes.ts --only 27` → **43/43 rows**;
  `--only 20` → **46/46 rows**; the full run → **19 probes, 831 rows, 0
  failures**.

[#86]: https://github.com/ccmdesign/bfna-website-migration-2/issues/86
[#109]: https://github.com/ccmdesign/bfna-website-migration-2/issues/109
