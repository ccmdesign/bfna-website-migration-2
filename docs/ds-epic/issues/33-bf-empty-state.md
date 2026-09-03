# 33 — `bfEmptyState` / `bfNotFound` — shared not-found/empty block

One-line objective: new molecule `bfEmptyState` (aliased `bfNotFound`),
replacing the identical block duplicated verbatim at three wireframe call
sites.

## Context

Depends on 02 (`bf-scaffold`), 15 (`bfButton`, for the back link — record
in Decisions whether the back link renders as `bfButton` or a plain
`NuxtLink`, since the wf source uses a plain link, not `.wf-button`).
Builds from the identical block at `pages/wireframes/[area].vue:40`,
`pages/wireframes/insights/[slug].vue:35`, `pages/wireframes/projects/
[slug].vue:86`: `<div class="center | stack" style="padding-block: var
(--space-xl);"><h1>…</h1><p><NuxtLink>…</NuxtLink></p></div>`. Consumed by
48, 50, 52 (template fallbacks), 56 (`error.vue` 404/500). Provenance:
BF-214; as-built D.1.

## Scope

- File: `src/components/bf/EmptyState.vue` → `<bfEmptyState>`, with
  `bfNotFound` as a **named alias export** from the same file (e.g. `export
  { default as bfNotFound } from './EmptyState.vue'` pattern, or a thin
  re-export component) rather than a second implementation — one component,
  two names.
- Props:
  ```ts
  interface Props {
    heading: string
    message?: string
    backLabel?: string
    backTo?: string
  }
  ```
  Default slot for custom content beyond heading/message/back-link.
- Renders exactly **one** `<h1>` (`{{ heading }}`), an optional `<p>{{
  message }}</p>`, an optional back link (`<NuxtLink :to="backTo">{{
  backLabel }}</NuxtLink>`, rendered only when both `backTo` and
  `backLabel` are given), then the default slot.
- Centred layout via the composition layer (`.center | .stack` classes,
  `data-gap`), not bespoke CSS — matches the wf source's own `center |
  stack` class list exactly, replacing only the inline `style="padding-
  block: var(--space-xl);"` with a `padded` convention consistent with
  `bfSection`'s own `padded` prop (issue 39) if that lands first, otherwise
  a component-local `--_bf-empty-state-padding-block` variable.

## Out of scope

- The 404 route itself (issue 56 builds `error.vue` around this component,
  not inside this issue).
- The three wireframe call sites (D2 — frozen; their bf-* successors in
  issues 48/50/52 use this component instead).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variable `--_bf-empty-state-padding-block` (Utopia `xl` space token
  by default, matching the wf source's `var(--space-xl)`). No new colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/EmptyState.vue
grep -q "heading: string" src/components/bf/EmptyState.vue
grep -c "<h1" src/components/bf/EmptyState.vue
```
Probe page `src/pages/bf-probe/33-bf-empty-state.vue` renders it as the sole
content on the page in three forms — heading-only, heading+link, and with
slot content:
```bash
[ "$(grep -c '<h1' .output/public/bf-probe/33-bf-empty-state/index.html)" = "1" ]
```
Fails today (no `bf/EmptyState.vue`), passes once done.

## Decisions

_Appended by the item-runner for [gh#42](https://github.com/ccmdesign/bfna-website-migration-2/issues/42)._

### D-33.1 — the alias is a re-export, not a wrapper

`components/bf/NotFound.vue` is a **script-only SFC** — no template, no props,
no style — whose whole body is:

```vue
<script lang="ts">
import EmptyState from './EmptyState.vue'
export default EmptyState
</script>
```

Nuxt's `components/bf` scanner (`prefix: 'bf'`, `pathPrefix: false`) registers
one auto-import name per file from that file's default export, so `bfNotFound`
and `bfEmptyState` resolve to **the same component object**: same contract, same
stylesheet, same `.bf-empty-state` root, one implementation. Probe 33 asserts
that identity (`alias` case) rather than assuming it.

The default export is written as an import plus `export default EmptyState`
rather than `export { default } from './EmptyState.vue'`, because the SFC
compiler looks for a literal `export default` when deciding what a `<script>`
block's component is; a re-export declaration is not one.

A wrapper component (`<bfEmptyState v-bind="$attrs"><slot /></bfEmptyState>`)
was rejected on three counts, all of which bite later rather than now: the props
contract forks and has to be kept in step by hand (the duplication this issue
exists to remove, moved one level up); `$attrs` loses the types, defaults and
`Boolean` casting; and a forwarded default slot is not the real one for scoped
slots or `useSlots()`. It would also add a second component instance, a second
render function and a second frame in every devtools trace for one block.

### D-33.2 — the back link is a plain `NuxtLink`, not `bfButton`

The spec asks for this to be recorded either way. **Plain `NuxtLink`.**

The wireframe block writes `<p><NuxtLink to="/wireframes">Back to wireframe
home</NuxtLink></p>` with no `.wf-button` — the three call sites agree — and
wf-source parity is the tie-breaker the epic uses everywhere else. On the merits
it is also the right element: a way back out of a dead end is navigation, not a
primary call to action, and rendering it as a button would make the loudest
thing on a 404 page an apology for the 404. `bfButton` stays available to a
caller who wants one, through the default slot.

Rendered **only when both `backTo` and `backLabel` are supplied**. Half a pair
would produce either an anchor with no accessible name (WCAG 2.4.4 — the failure
[#130](https://github.com/ccmdesign/bfna-website-migration-2/issues/130) named
for the card wrappers, at a smaller scale) or a label that navigates nowhere.
Probe 33 carries a `to-only` and a `label-only` case for exactly this.

### D-33.3 — padding hook, because `bfSection`'s `padded` has not landed

The spec allows reusing `bfSection`'s `padded` convention (issue 39) "if that
lands first". It has not: there is no `src/components/bf/Section.vue` on `dev`
at the time of this issue. So the spec's stated fallback applies —
`--_bf-empty-state-padding-block`, defaulting to `var(--space-xl)`, which is the
exact length the wf source's inline
`style="padding-block: var(--space-xl);"` resolved to.

The hook is declared **inside the rule**, not bound inline, so a consumer can
outrank it with an ordinary rule; an inline style cannot be outranked by one
(the `bfMedia` lesson, gh#26). It is a plain custom property, so a later
`bfSection` `padded` prop can adopt or wrap it without a breaking change.

`class="center | stack"` is the wireframe's own class list, kept character for
character; `data-gap="s"` is added explicitly, and `s` is what `.stack`'s
`--_stack-space` already defaults to, so the rendered gap is unchanged and the
value is now declared rather than inherited by accident. Probe 33 asserts that
`.bf-empty-state`'s own rule declares **no** layout property at all — no
`display`, `flex`, `grid`, `margin`, `max-inline-size`, `width`, `text-align`,
`align-items`, `justify-content` or `gap` — so a later "small fix" that
re-implements what the composition layer already owns fails a row instead of
quietly landing.

### D-33.4 — no `headingLevel` prop, unlike the card wrappers

[#128](https://github.com/ccmdesign/bfna-website-migration-2/issues/128) gives
every typed card wrapper a `headingLevel`, because several cards appear on one
page. This block is the opposite case: it is what a page renders *instead of*
its content, so its heading **is** the page's heading. The `<h1>` is
unconditional and there is no level prop, which makes BRIEF §5 rule 9 (one `h1`
per page) true by construction rather than by every caller remembering. A
consumer wanting this shape inside a populated page wants a different component
and should say so.

### D-33.5 — the probe mounts one instance at a time (test-harness substitution)

The vitest harness on `dev` is broken and pre-existing (residual
[#86](https://github.com/ccmdesign/bfna-website-migration-2/issues/86)), so
acceptance is the probe under `npx tsx scripts/check-probes.ts --only 33` plus
the full suite, per the [#109](https://github.com/ccmdesign/bfna-website-migration-2/issues/109)
harness decision and the gh#20–#41 precedent. **28 rows, all passing; the full
suite is 25 probes / 1137 rows / 0 failures.**

`src/pages/bf-probe/33-bf-empty-state.vue` renders **one** `bfEmptyState` at a
time and cycles a `form` ref through eight configurations — `heading`,
`message`, `link`, `to-only`, `label-only`, `slot`, `alias` (via `<bfNotFound>`)
and `padded` — reading the live DOM at each, rather than rendering them side by
side. Two reasons, and both are the spec's own:

1. Eight instances would put eight `<h1>`s on one page, breaking BRIEF §5
   rule 9 — the rule this component exists to satisfy by construction.
2. The spec's static check is
   `[ "$(grep -c '<h1' .output/public/bf-probe/33-bf-empty-state/index.html)" = "1" ]`.
   With one instance mounted the prerendered page holds exactly one `<h1` — the
   component's — so **the check passes as written, unamended**. Verified:
   `grep -c` and `grep -o … | wc -l` both return 1. The probe's own title is an
   `<h2>` **below** the demo for the same reason; the spec asks for the
   component "as the sole content on the page", so the page's `h1` is the
   component's, and the heading order on the page is `h1 → h2`, sequential.

Cycling is strictly stronger than the grep it satisfies: "exactly one `<h1>` in
the document, and it is inside `.bf-empty-state`, and its text is the `heading`
prop" is re-asserted after **every** switch, which a static count cannot say.

### D-33.6 — two acceptance greps re-pointed (BRIEF §5 rule 11 wins)

Both are deviations from the spec's literal text, recorded rather than silently
fixed:

| Spec command | What was run | Why |
|---|---|---|
| `grep -q "heading: string" src/components/bf/EmptyState.vue` | `grep -q "heading: string" src/types/bf-contracts.ts` | BRIEF §5 rule 11: *all* shared TS types live in `src/types/bf-contracts.ts` and no component declares one inline. The spec's `interface Props` block landed there as `EmptyStateProps`, which the component imports — same as every other `bf-*` component. Passes at the new path. |
| `grep -c "<h1" src/components/bf/EmptyState.vue` | the same, plus a template-only count | `grep -c` counts *lines*, and the file's block comment quotes the wireframe source and discusses the `<h1>` rule, so the raw count is 4. Counted over the `<template>` block alone it is **1**, which is what the check is asking about — the #115 precedent, where `grep -c ":style="` was re-pointed at comment-stripped source for the same reason. |

`npm run typecheck` in the spec's acceptance block is the epic-wide gate, which
the orchestrator replaced after [#10](https://github.com/ccmdesign/bfna-website-migration-2/issues/10)
with **no new errors** against a `dev` baseline: 178 `error TS` before this
change, 178 after, and 0 in
`src/(components/bf|types|composables/bf)|content.config` both before and after.
`npx nuxt generate` exits 0 (915 routes).

