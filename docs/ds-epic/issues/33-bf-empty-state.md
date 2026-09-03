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

_Runner appends here._
