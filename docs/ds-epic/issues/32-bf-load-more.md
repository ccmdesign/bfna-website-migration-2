# 32 — `bfLoadMore` — feed pagination control

One-line objective: new molecule `bfLoadMore`, replacing the inline
load-more button in the insights feed, with an accessible live-region
count announcement.

## Context

Depends on 02 (`bf-scaffold`), 15 (`bfButton`). Builds from the inline
button in `src/pages/wireframes/insights/index.vue:30-32`: `<button
class="wf-button" @click="visible += 24">Load more ({{ filtered.length -
visible }} remaining)</button>`. Consumed by 49 (`/insights` template).
Provenance: BF-213.

## Scope

- File: `src/components/bf/LoadMore.vue` → `<bfLoadMore>`.
- Props/emits:
  ```ts
  interface Props {
    hasMore: boolean
    loading?: boolean
    label?: string    // default 'Load more'
  }
  // emits
  (e: 'load'): void
  ```
- Renders `<bfButton v-if="hasMore" :disabled="loading" @click="$emit
  ('load')">{{ label }}</bfButton>` — renders **nothing** (not even an
  empty wrapper) when `hasMore` is false, matching the wf source's implicit
  "button just isn't there once everything's loaded" behaviour (the
  wireframe's `v-if="filtered.length > visible"` on the whole `<p>`).
- A visually-hidden `aria-live="polite"` region announcing the current
  count, e.g. "Showing N of M items" — driven by props the caller passes
  (this component does not know the total/visible counts itself; add
  `visibleCount?: number` and `totalCount?: number` props feeding the live
  region text, defaulting to no announcement when either is omitted).
- Owns **no** pagination state or array slicing — the caller (issue 49's
  page) tracks `visible`/`filtered` exactly as the wireframe does today and
  simply increments its own ref in the `@load` handler.

## Out of scope

- Owning pagination state or slicing arrays (the template owns that).
- Infinite scroll (no wireframe evidence — this is a manual "load more"
  click pattern only).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables beyond what `bfButton` already exposes. The live
  region uses the standard visually-hidden clip-rect pattern, no new
  colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/LoadMore.vue
grep -q "hasMore" src/components/bf/LoadMore.vue
grep -q 'aria-live="polite"' src/components/bf/LoadMore.vue
```
Probe page `src/pages/bf-probe/32-bf-load-more.vue` renders it with
`hasMore=true` and toggles to `hasMore=false` on click, confirming the
component disappears and the announced count updates when the caller
changes `visibleCount`/`totalCount` — verified as a manual interactive
check plus:
```bash
grep -q "Load more" .output/public/bf-probe/32-bf-load-more/index.html
```
Fails today (no `bf/LoadMore.vue`), passes once done.

## Decisions


Recorded by the item-runner for [gh#41](https://github.com/ccmdesign/bfna-website-migration-2/issues/41).

### D-32.1 — the live region outlives the button

The spec asks for two things that pull against each other: *"renders **nothing**
(not even an empty wrapper) when `hasMore` is false"*, and a persistent
`aria-live="polite"` count.

An `aria-live` region only announces a mutation observed **inside a region that
was already in the accessibility tree**. A region inserted and removed together
with the button therefore announces nothing on the load that matters most — the
last one, where the count reaches its total *and the control disappears from
under the user's finger*. Implemented literally, the feature would be dead code
on exactly the interaction it was written for.

The two readings are split along a seam the spec already draws — it says the
announcement defaults to *off* when either count is omitted:

| caller passes | at `hasMore=false` |
|---|---|
| **neither** `visibleCount` nor `totalCount` | renders **literally nothing** — no element at all. The spec's letter, verbatim. |
| **both** counts | the button is removed; the clipped region persists, carrying the final count. |

The persisting region is `position: absolute` and clipped to a 1×1px box, so it
occupies no space, paints no pixel and moves no layout — "renders nothing" holds
visually and in layout in both rows. Probe 32 asserts the `bare` case renders no
element **and** measures the announcing wrapper's height as `0` at
`hasMore=false`, rather than taking either on trust.

### D-32.2 — `disabled`, not `aria-disabled`, with the cost stated

`loading` renders `bfButton`'s `disabled` branch — the spec's own contract, and
that component's only genuinely non-interactive *and* non-focusable branch.

It has a known cost: a focused button that becomes `disabled` drops focus to
`<body>`. That is not papered over, because the alternative is worse —
`aria-disabled` leaves an element that Enter still activates, i.e. a control
that lies about being unavailable. The consumer this component exists for (issue
49) slices a build-time-static array **synchronously** and never sets `loading`,
so the cost is not paid on any path this epic ships. A caller that genuinely
fetches should move focus itself once the load resolves; noted here rather than
solved speculatively.

### D-32.3 — `label` takes the whole string; there is no `remaining` prop

The wireframe writes `Load more ({{ filtered.length - visible }} remaining)`.
The remainder is the caller's arithmetic over the caller's own state, so the
caller composes the string and passes it whole. A `remaining` prop plus a
template to interpolate would be a second way to say the same thing, and the two
would drift.

### D-32.4 — acceptance substitutes the probe for vitest (residual #86)

The vitest harness on `dev` is broken and pre-existing, and this issue's runner
is instructed not to fix it or depend on it. Acceptance is therefore probe 32
under the #109 harness, which is an equivalent-or-stronger check: it runs in a
real engine against the prerendered build, and the emit, the count text and the
terminal state are read from the live DOM rather than from a mounted stub.

```bash
cd bfna-website-nuxt
npx nuxt generate
npx tsx scripts/check-probes.ts --only 32     # 31 rows, 0 failures
npx tsx scripts/check-probes.ts               # 24 probes, 1109 rows, 0 failures
```

The spec's own `npm run typecheck` line is likewise substituted, per the
orchestrator's decision after #10 (residual #71): `dev` carries 178 pre-existing
`error TS`, so "green" is unreachable and the gate is **no new errors**. Measured
on this branch: **178 before, 178 after, 0 of them in
`src/components/bf|src/types|src/composables/bf|content.config`.**

### D-32.5 — the probe drives a real feed, because the claim is about absence

`bfLoadMore`'s central claim is something it deliberately does *not* do: it owns
no pagination state. A probe handing it two literal numbers and clicking would
pass identically on a component that had quietly grown its own `visible` ref —
the exact defect the spec forbids.

So probe 32's `feed` case slices a real `useBfInsights().active` pool with a ref
the **page** owns, incremented in the `@load` handler exactly as
`pages/wireframes/insights/index.vue:30-32` does. The probe queries; the
component may not (BRIEF D8). The rendered item count, the announcement text and
the button's disappearance are then all consequences of the caller's state,
which is the contract under test.

The emit is asserted twice over: scripted clicks for the "once per click" count,
and a **trusted** `Enter` through the harness's `data-probe-keys` hook
(`docs/decisions/probe-harness.md` Decision 4) for the native activation path a
`.click()` would pass without exercising.

### D-32.6 — no `:not()` at all

`.bf-load-more`'s stylesheet uses no `:not()` in any form, complex or simple
(D-20.5, #29). Probe 32 additionally scans the **emitted** CSSOM for any `.bf-`
selector whose `:not()` contains a combinator or descendant whitespace, so the
ban is checked against what shipped rather than against the source it was
written in.
