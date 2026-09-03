# Plan — gh#41 / issue 32 — `bfLoadMore`

**Spec:** [`docs/ds-epic/issues/32-bf-load-more.md`](../ds-epic/issues/32-bf-load-more.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Branch:** `feature/gh41-bfloadmore` off `dev`

Written by the item-runner directly (the sanctioned STEP 1 fallback) rather than
through `ce-plan`, to avoid any chance of detaching work past the turn — the
runner template's standing instruction after the #25 stall.

## Approach

A presentational molecule: five props in, one event out, no pagination state.
The caller keeps its own `visible` ref exactly as `pages/wireframes/insights/index.vue`
does today and increments it in the `@load` handler.

### The one real design question: where the live region lives

The spec asks for two things that pull against each other:

1. *"renders **nothing** (not even an empty wrapper) when `hasMore` is false"*, and
2. a persistent `aria-live="polite"` region announcing "Showing N of M items".

An `aria-live` region only announces a **mutation observed inside a region that
was already in the accessibility tree**. A region inserted and removed together
with the button announces nothing on the load that matters most — the last one,
where `hasMore` flips to `false` and the user most needs to hear *"Showing 354 of
354 items"* rather than silence and a vanished control.

Resolution, recorded in the spec's Decisions section:

| caller passes | at `hasMore=false` |
|---|---|
| **neither** `visibleCount` nor `totalCount` | the component renders **literally nothing** — the spec's letter, exactly |
| **both** counts | the button is removed; the visually-hidden live region persists |

So the spec's "nothing" case is honoured verbatim for the announcement-free
configuration it was written about, and the announcing configuration keeps the
one element that has to outlive the button for the feature to work at all. The
persisting region is `position: absolute` + clipped: zero layout footprint, zero
pixels — "renders nothing" holds visually and in layout either way.

## Files

| File | Change |
|---|---|
| `src/types/bf-contracts.ts` | **add** `LoadMoreProps` (the only place a shared bf type may live, BRIEF §5.11) |
| `src/components/bf/LoadMore.vue` | **new** — `<bfLoadMore>` |
| `src/pages/bf-probe/32-bf-load-more.vue` | **new** — probe under `layout: 'bf-probe'` |
| `docs/ds-epic/issues/32-bf-load-more.md` | append to § Decisions |

Nothing under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue`
or `public/css/wireframe.css` is read-modify-written (D2). The wireframe insights
page is read as the source of truth for the behaviour and left byte-identical.

## Component contract

```ts
interface LoadMoreProps {
  hasMore: boolean
  loading?: boolean
  label?: string          // default 'Load more'
  visibleCount?: number
  totalCount?: number
}
// emits: (e: 'load'): void
```

- Renders `<bfButton :disabled="loading" @click="$emit('load')">` — issue 15 / gh#24.
- `inheritAttrs: false` + `v-bind="$attrs"` on the single root, the `bfButton`
  precedent, so a conditional root never raises a fallthrough warning.
- No `:style`, no `cssVars`: the spec forbids new CSS variables beyond the ones
  `bfButton` already exposes, so the only rules here are the wrapper's layout and
  the visually-hidden clip for the status region.
- `@layer components`, and **no `:not()` with a complex selector** (D-20.5) — the
  stylesheet uses no `:not()` at all.
- No new colour: the wrapper paints nothing and the status region is clipped.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe under `scripts/check-probes.ts` — the gh#20–#40
precedent and the #109 harness decision. Substitution recorded in Decisions.

Probe cases, all under one page:

| case | configuration | proves |
|---|---|---|
| `feed` | a **real** `useBfInsights().active` pool of 9, `visible` ref at 3, step 3 | the emit fires once per click, the caller's slice grows, the announcement text tracks `visibleCount`, and the button disappears at the terminal state while the region keeps the final count |
| `bare` | `hasMore=false`, no counts | the component renders literally nothing — no root element at all |
| `labelled` | custom `label` | `label` reaches the button; the default is `Load more` |
| `loading` | `hasMore=true`, `loading=true` | `<button disabled>`, and a click emits nothing |
| `lab` | `hasMore=true` + counts, focused on mount | a **trusted** `Enter` (harness `data-probe-keys`, Decision 4) emits `load` — the native path, not a scripted `.click()` |

Plus the standing structural rows every probe in this epic carries: `.bf-load-more`
rules live inside `@layer components` in the live CSSOM, the component emits no
inline `style`, `$attrs` reaches the root, the status region is clipped rather
than `display:none`/`visibility:hidden` (which would take it out of the
accessibility tree and silence the announcement it exists for), and the page
contains no `bf-*` `:not()` complex-selector construct.

Per gh#39, every scripted click and every focus change runs inside `finalise()`,
**after** the key sequence, so the harness's `Enter` cannot be delivered to the
wrong element.

## Verification (all inside `bfna-website-nuxt/`)

```bash
npx nuxt typecheck 2>&1 | grep -cE 'error TS'        # gate: <= 178 baseline
npx nuxt typecheck 2>&1 | grep -E 'error TS' \
  | grep -E 'src/(components/bf|types|composables/bf)|content\.config' | wc -l   # must be 0
npx nuxt generate                                     # exits 0 — never `npm run generate`
npx tsx scripts/check-probes.ts --only 32             # exits 0
npx tsx scripts/check-probes.ts                       # full suite, exits 0
grep -q 'aria-live="polite"' src/components/bf/LoadMore.vue
grep -q "Load more" .output/public/bf-probe/32-bf-load-more/index.html
```

and, from the repo root, the two frozen-source gates, both of which must print
nothing:

```bash
git diff --stat dev...HEAD -- bfna-website-nuxt/src/pages/wireframes \
  bfna-website-nuxt/src/components/wireframe bfna-website-nuxt/src/layouts/wireframe.vue \
  bfna-website-nuxt/src/public/css/wireframe.css
git diff --stat f757a649361993275a43282456f4746d247be37b HEAD -- <same paths>
```

## Risks

| Risk | Mitigation |
|---|---|
| The live-region persistence reads as a spec violation to a later reviewer | Stated as a Decision in the spec file, with the ARIA reason, and asserted by a probe row that measures the wrapper's layout footprint at `hasMore=false` |
| `:disabled="loading"` drops focus when a load starts | Real, and the spec's own contract; the only consumer (issue 49) slices a build-time-static array synchronously, so `loading` is never true there. Noted in Decisions rather than silently redesigned |
| The keyboard lab times out and reports a component failure | Follows the gh#40 probe's proven handshake verbatim — arm `data-probe-keys` only after listeners are attached, focus the lab first, safety-net timeout that flags itself in its own row |
| A probe added here breaks the full-suite run | The full `check-probes.ts` run is part of acceptance, not just `--only 32` |
