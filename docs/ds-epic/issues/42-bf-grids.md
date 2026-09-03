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

**D-42.1 — `minWidth` is a six-value keyword union, not the spec's `string`.**
The spec sketches `minWidth?: string`. `composition/grid.css` resolves the track
floor through exactly six `[data-min-width="xs|s|m|l|xl|2xl"]` attribute rules
and nothing else, so any other string writes an attribute that matches no rule:
the grid keeps the unset `240px` default and lays out at a column count the
caller did not ask for, under a `data-min-width` in the DOM claiming otherwise —
a layout bug with a plausible-looking cause in the markup and no error anywhere.
`GridMinWidth` in `src/types/bf-contracts.ts` makes it a compile error instead.
The reasoning is the one `CardHeadingLevel` already records for not typing
`headingLevel` as `number` (a value the base's selectors do not style), applied
to a value the composition layer does not map. Values stay keywords rather than
lengths so the mapping remains the composition layer's to retune (D9).

**D-42.2 — the defaults are `l` for insights and `xl` for projects, read off
issue 04's measurements rather than chosen by eye.** Both were then re-measured
on this issue's own probe, which reports the numbers in its row labels.

`.container` is `max-inline-size: 1200px` with `--space-m` inline padding, and
`auto-fill` resolves `floor((W + gap) / (min(floor, W) + gap))`. Measured on
probe 42 at the harness viewport: the 1200 / 800 / 400px rails give **1140 /
740 / 340px** of content against a **30px** gap (`data-gap="m"`, kept verbatim
from both frozen sources).

| floor | 1140px | 740px | 340px |
|---|---|---|---|
| `m` (240px) | 4 | 2 | 1 |
| **`l` (300px)** | **3** | **2** | **1** |
| **`xl` (400px)** | **2** | **1** | **1** |
| `2xl` (500px) | 2 | 1 | 1 |

`wfGridInsights.vue` pins three columns, so insights takes `l` — the only value
resolving 3 at a desktop width, and the same 3 / 2 / 1 ladder D-04.5 recorded
for the acceptance viewports. `wfGridProjects.vue` pins two, so projects takes
`xl`: two columns require a floor above `1140/3 - gap ≈ 350px` (or three fit)
and at most `(1140 + 30)/2 - 30 ≈ 555px` (or one does), and `xl` is the value
inside that window with the most room on both sides. `2xl` also resolves 2 at
1140px but sits `45px` from the one-column collapse, so a slightly narrower
container would drop it to one column where `xl` still holds two.

That `bfGridProjects` falls to a **single** column at 800px rather than holding
two is the arithmetic, not a compromise: a 740px container cannot hold two
tracks each wide enough to have earned two at 1140px. The frozen source's pinned
two columns squeezed instead — which is the behaviour D9 exists to end.

**D-42.3 — no shared base, but a shared *type*.** The spec puts a unified grid
base out of scope ("not enough evidence yet"). What the two components do share
— `minWidth`, `excerptLength`, `headingLevel` — is stated once as `GridProps` in
`bf-contracts.ts`, which both prop interfaces extend. A type costs nothing at
runtime, commits to no component hierarchy, and makes the shared surface visible
in one place if a later issue does gather the evidence.

**D-42.4 — `extraChips` stays a function on the grid and an array on the card.**
`wfGridInsights.vue` declares `(i: WfInsight) => string[] | undefined` and calls
`extraChips?.(i)` per row, while `bfCardInsight` takes `extraChips?: string[]`.
That split is kept exactly. Only the caller knows how to derive a programme or a
project name a row does not itself carry, and only the grid has the row to derive
it from; a card taking the function would have to be handed the whole collection
to know which row it was. `bfGridProjects` has no counterpart, because
`bfCardProject` derives its chips from the row (`kind`, `external_url`,
`pending`) and takes no extra-chip prop — a prop that typechecked and did nothing
would be worse than its absence.

**D-42.5 — `headingLevel` is on the grids, forwarded and never re-decided.**
Not in the spec's prop list, added because #128 put `headingLevel` on every card
wrapper and the grid is the only thing standing between a template's section
heading and its cards. Templates #47–#52 place these grids inside subsections, so
without it a card in a subsection emits a level jump (BRIEF §5 rule 9). It is
forwarded **unset when unset** — as is `excerptLength` — so each card's own
default (`3`, `140`) applies rather than the grid holding a second copy of a
number that would drift the first time the card's changed.

**D-42.6 — `inheritAttrs` stays at its default on both grids.** The card
wrappers set `inheritAttrs: false` (D-21.1) because they `v-bind="$attrs"`
explicitly onto a child component and would otherwise apply everything twice.
Neither grid does that: the `<ul>` is the single root and the element a caller
means, so the automatic fallthrough is correct. It is also load-bearing rather
than incidental — `aria-labelledby` is how a template names the list from its own
section heading, and the probe asserts it arrives.

**D-42.7 — the grep gate is honoured in the comments too.** The spec's
acceptance is a literal `grep -rn` for the column-template property over
`src/components/bf`, which must return nothing. A first cut of both files
described the frozen source's pinned columns *by naming the property* in a
docblock and tripped the gate at 4 occurrences, all of them prose. The property
name is now absent from both files entirely — a gate worth having is one a
comment cannot trip — and the frozen source's declaration is described rather
than quoted.

**D-42.8 — acceptance is the probe under the headless harness, not vitest.**
The vitest harness on `dev` is broken and pre-existing (residual #86), so this
issue's acceptance is `npx tsx scripts/check-probes.ts --only 42` plus the full
suite, per the gh#20–#41 precedent and the #109 harness decision. The spec also
names `npm run typecheck`; the epic-wide gate since #10 / residual #71 is **no
new errors** against `dev`'s ~178 legacy ones, and this branch measured
**178 → 178** total with **0** in `src/components/bf`, `src/types`,
`src/composables/bf` or `content.config.ts`.

**D-42.9 — the probe emulates three viewports with fixed-width rails, and pins
the counts as well as deriving them.** The contract is stated at three viewports
and the harness runs at one (#109 — the viewport is an input to the verdict).
Probe 03 answered that by deriving its expected count from whatever width it
measured, which proves the arithmetic but can never say "three columns". Probe 42
mounts each grid three times inside a rail of fixed inline size carrying
`.container`'s own `padding-inline`, and gives every rail **both** rows: the
pinned count (3 / 2 / 1 and 2 / 1 / 1) and the `auto-fill` agreement at ±1px, so
a failure names its reason rather than only its number. The honest caveat, stated
in the page's own docblock: `--space-m` is a fluid clamp and resolves at the
harness viewport, not at the width a rail emulates — which is why every pinned
count sits far from its boundary and why the second row exists.

**D-42.10 — the probe measures row gap against column gap, per D-36.7.**
`base/typography.css` declares `li { margin-bottom: 0.5em }` in
`@layer defaults`, and a block margin on a **grid item** is added to the row gap
— the leak `bfFooter`'s review caught. `bfCard` already zeroes `margin-block`
from `@layer components`, so neither grid needs a stylesheet of its own (and
neither ships one). The probe proves it rather than assuming it: all 42 rendered
cards report `margin-block: 0px`, and at the 400px rail — where both grids have
collapsed to one column, so the row gap is measurable between two stacked cards
— the **measured** distance between the first two cards equals the column gap.

**D-42.11 — the probe's rows are ten real documents, not fixtures.** BRIEF §5
rule 10. The page queries six `bfInsights` and four `bfProjects` rows and hands
them over as props; the components fetch nothing (D8). They are chosen for
spread: an insight with a null `image` and ones with no excerpt at all (195 of
371 real rows carry none), excerpts from 0 to 1550 characters, archived and live
rows, a project with a `pending` flag and an external URL, and `cepi-2010` — no
`kind`, no `external_url`, no `pending` — which renders no chip cluster at all.
