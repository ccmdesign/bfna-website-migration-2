# gh#225 — `bfLoadMore` must not drop focus to `<body>`

Row 100 of the accessibility pass-1 index (`docs/a11y-epic/issues.md`), DoD-A6.
Brief: [`docs/a11y-epic/BRIEF.md`](../a11y-epic/BRIEF.md) — §3 gates, §4 D23/D24/D29/D32, §5, §7.

## The defect

`/insights` renders 98 insights, 24 at a time. The fourth "Load more" click takes
`remaining` to `0`, so `hasMore` goes false, and `LoadMore.vue:140`'s `v-if="hasMore"`
unmounts the button the user is standing on. Vue removes the focused element and the
browser has nowhere to put focus, so `document.activeElement === document.body`. A
keyboard user's next `Tab` restarts from the top of the document. WCAG 2.4.3 (Focus
Order); measured during the audit, not inferred.

`LoadMore.vue:142`'s `:disabled="loading"` is the same defect wearing different
clothes: setting `disabled` on the element that currently has focus blurs it to
`<body>` in every major engine. The component's own block comment already names this
cost and accepts it on the grounds that the one shipping caller never sets `loading`.
An unpaid bug is still a bug, and this row is where it is paid.

## The fix chosen: keep the button mounted, `aria-disabled`, guarded activation

The issue offers two routes. I take **route 1 — keep the button mounted** — with one
correction that route 2 does not need and route 1 does:

> **the unavailable state is `aria-disabled="true"` with a guarded handler, not the
> native `disabled` attribute.**

Why route 1 over route 2 (move focus to the first newly appended row):

- **It fixes both halves of the row.** The `loading` defect is the *same* unmount /
  blur mechanism. One change closes both; route 2 closes only the exhaustion half and
  would leave `:disabled="loading"` to a later row.
- **`bfLoadMore` is presentational-only (BRIEF D8).** It is passed `hasMore`, a label
  and two counts; it never sees the rows. Moving focus to "the first newly appended
  row" is arithmetic only `insights/index.vue` can do, so route 2 pushes the fix into
  the page — the opposite of D24 ("fix it once, in the component") — and any second
  caller of `bfLoadMore` would have to re-implement it.
- **It moves focus nowhere.** Focus stays exactly where the user put it. Route 2 is a
  deliberate focus *jump*, which is the "focus moved somewhere disorienting" risk;
  route 1 has no such risk because there is no move.

Why `aria-disabled` and not the native attribute: a native `disabled` on the mounted
button reproduces the very blur this row exists to remove — mounted-and-`disabled` is
not a fix, it is the same bug one step later. `aria-disabled="true"` keeps the control
focusable and in the tab order, which is what preserves focus, and the ARIA APG names
exactly this ("keep a disabled control focusable when removing it would strand focus").

The component's block comment currently rejects `aria-disabled` because "an element
that is still activated by Enter … lies about being unavailable". That objection is
real and is neutralised rather than ignored: the `@click` handler becomes a guarded
function that returns without emitting `load` while the control is inert, so Enter,
Space and mouse all do nothing. The comment is rewritten to record the reversal and
its condition.

### Mount condition

The button's `v-if` is deleted and its presence is tied to the wrapper's existing
`v-if="hasMore || announcement"`. That keeps the documented contract intact:

| caller passes | `hasMore=false` — before | `hasMore=false` — after |
|---|---|---|
| **neither** count | no element at all | no element at all (unchanged) |
| **both** counts | wrapper + status, button gone | wrapper + status + inert button |

So the "renders literally nothing — not even an empty wrapper" case (`LoadMoreProps`
contract, `bf-contracts.ts:506-517`) is untouched. Only the counts-supplied case —
`/insights`, the one shipping caller, the one where focus can actually be dropped —
gains a persistent control.

### The announcement is not touched

`LoadMore.vue:167-173`'s `role="status" aria-live="polite" aria-atomic="true"` span,
its `v-if="announcement"`, the `visually-hidden` utility class and the wrapper's
`v-if="hasMore || announcement"` all stay byte-identical in intent. D29 holds: the
region is mounted in the idle state and outlives the button. The gate asserts the final
`Showing 98 of 98 items` still reads after the last click, so a regression here is a red
build, not a review note.

### Labelling the inert state

The button gains `aria-describedby` pointing at the status span (a `useId()` id, the
`FormField.vue:119` / `Section.vue:167` idiom — D27), so a screen reader that lands on
the inert control hears *why* it is inert — "Showing 98 of 98 items" — rather than a
dead "Load more, unavailable". No new copy is invented; the sentence already exists.

### Appearance — D23/D32

No new colour, font face, size, weight, letter-spacing, line-height, radius or shadow.
`Button.vue:272-275` already ships the only disabled affordance the system has:

```css
.bf-button:disabled { cursor: not-allowed; opacity: 0.5; }
```

That selector gains `, .bf-button[aria-disabled='true']`. One selector, zero new
property values, zero new tokens — "a `disabled` button's appearance comes from
existing tokens" (row scope). The DoD-A10 grep (`^\+.*(color|font-size|…)\s*:`) stays
empty because no declaration line is added.

## Files

| file | change |
|---|---|
| `src/components/bf/LoadMore.vue` | button always mounted inside the wrapper; `aria-disabled` + guarded `@click` replaces `:disabled`; `aria-describedby` → status id; block comment rewritten |
| `src/components/bf/Button.vue` | one selector added to the existing `:disabled` rule so `aria-disabled` renders identically. No new declaration. |
| `src/types/bf-contracts.ts` | `LoadMoreProps.hasMore` / `loading` doc updated to describe inert-not-removed |
| `scripts/check-routes.ts` | new whole-build gate `loadMoreFocusRows` (below) |
| `docs/plans/gh225-plan.md` | this file |

Explicitly **not** touched: `Hero.vue`, `PageHeader.vue`, `Prose.vue`,
`public/css/base/typography.css`, `public/images/hero/**` (BF-220 is landing on the same
`dev`); `/wireframes/**`, `layouts/wireframe.vue`, `components/wireframe/**`,
`public/css/wireframe.css`, `assets/wireframe-data` (byte-guarded, brief §7).

## Reproduce before, prove after

**Before** — `origin/dev`, `/insights`, real input only:

1. `Tab` to the "Load more" button (a real key event, not `.focus()`; Chrome's
   `:focus-visible` heuristic keys on the last interaction modality).
2. Real mouse press/release on it, four times.
3. After click 4: `document.activeElement` is `BODY`. Recorded verbatim.

**After** — same walk on the branch: after click 4 `document.activeElement` is still
`button.bf-load-more__button`, now `aria-disabled="true"`, and
`.bf-load-more__status` reads `Showing 98 of 98 items` with `display` not `none`.

## The gate (brief §5 — every issue adds an assertion)

`scripts/check-routes.ts` gains a whole-build group, `load-more focus (DoD-A6)`,
modelled on `emptyStateStatusRows` (gh#224): its own CDP target, `/insights` served
from `.output/public`, wait for hydration, then drive the control to exhaustion with
**real `Input.dispatchMouseEvent` press/release at the button's own coordinates** — not
`el.click()`, and not `el.focus()`. Chrome focuses a `<button>` on mousedown, so the
walk establishes real focus the same way a user does.

Rows asserted:

1. the walk was not vacuous — at least 2 clicks landed and exhaustion was actually
   reached (`aria-disabled="true"`), so a build where the button never renders fails
   rather than passing with zero work done;
2. `document.activeElement !== document.body` after **every** click, the button
   included — the DoD-A6 assertion, reported with the step it broke at;
3. focus is still on the load-more button itself after the last click, not merely
   somewhere non-`body`;
4. the button is still in the DOM after exhaustion and carries `aria-disabled="true"`
   (and no native `disabled`, which would re-introduce the blur);
5. the status region survives, is not `display: none`, and reads `Showing N of N items`
   with both counts equal to the feed total.

Negative-tested by reverting `LoadMore.vue` to `dev`'s template and confirming the group
goes red on rows 2/3/4 before the fix is restored.

## Risks

- **The gate is slow / flaky in CI.** It adds one target and ~5 round trips.
  Mitigated by bounding the walk (`≤ 10` clicks), polling with the harness's existing
  `timeoutMs`, and closing the target in a `finally`, exactly as gh#224 does.
- **Coordinates.** The button can be below the fold. The probe `scrollIntoView`s and
  re-reads the rect immediately before dispatching, and fails loudly (rather than
  silently clicking nothing) if the rect is empty or off-viewport.
- **An inert control left in the tab order.** Deliberate — that is the fix — and
  mitigated by `aria-disabled` + `aria-describedby` so it announces as unavailable and
  says why.
- **Typecheck baseline.** No signature change expected; the edits are template and one
  computed. Verified against `.github/typecheck-baseline.txt` before the PR.

## Out of scope (noted, not fixed)

`bfLoadMore` sits inside `<template v-if="filtered.length">` in
`src/pages/insights/index.vue:352`, so filtering to zero results unmounts the whole
live region along with it. That is real and it is **#233's**, not this row's. No change
here touches the `v-if` on that `<template>`.
