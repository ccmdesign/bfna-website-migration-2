# 28 — `bfBreadcrumb` — breadcrumb trail

One-line objective: evolve `wfBreadcrumb.vue` into `bfBreadcrumb`, using the
shared `Crumb` type from `types/bf-contracts.ts` instead of a locally
declared interface.

## Context

Depends on 02 (`bf-contracts.ts` exports `Crumb`). Builds from
`src/components/wireframe/wfBreadcrumb.vue` (as-built A: `items:WfCrumb[]`,
1 direct use site inside `wfPageHeader.vue`, reaching 8 pages transitively).
Consumed by 38 (`bfPageHeader`). Provenance: BF-204.

## Scope

- File: `src/components/bf/Breadcrumb.vue` → `<bfBreadcrumb>`.
- Props:
  ```ts
  interface Props {
    items: Crumb[]   // from src/types/bf-contracts.ts (issue 02) — { label: string, to?: string }
  }
  ```
  `Crumb` is **imported**, not redeclared — `wfBreadcrumb.vue` locally
  defines `export interface WfCrumb { label: string, to?: string }`;
  `bfBreadcrumb` must not repeat this pattern, it consumes the shared type.
- Root: `<nav aria-label="Breadcrumb">` wrapping an **ordered list**
  (`<ol>`) of crumbs — the wf source uses inline `<span> / </span>`
  separators with no list markup at all; `bfBreadcrumb` upgrades this to a
  real `<ol>` for correct landmark/list semantics (a real a11y improvement,
  not a wf-* behavioural change — the visual separator moves to CSS
  `::before`/`::after` on `li + li`, never a text node).
- Each item: `<li>` containing either `<NuxtLink :to="c.to">{{ c.label
  }}</NuxtLink>` (linked crumbs) or a plain `<span aria-current="page">{{
  c.label }}</span>` for the **last** item specifically (not just any
  item without a `to`) — `aria-current="page"` marks the final crumb
  regardless of whether it happens to carry a `to`.
- No route-derivation logic — pages pass `items` in fully formed (matches
  every `wfPageHeader` call site, which all pre-build the `crumbs` array).

## Out of scope

- Deriving crumbs from the current route (pages own that, per every
  `wfPageHeader` call site in the wireframe pages).
- Truncation logic for long trails (no wireframe evidence of more than 2
  levels in practice).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variable `--_bf-breadcrumb-separator-color`; separator via `content:`
  on a `::before` pseudo-element, sourced from a semantic token, not a new
  colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Breadcrumb.vue
grep -q "Crumb\[\]" src/components/bf/Breadcrumb.vue
grep -Lq "interface.*Crumb" src/components/bf/Breadcrumb.vue
```
Probe page `src/pages/bf-probe/28-bf-breadcrumb.vue` renders a 1-item trail
and a 4-item trail:
```bash
grep -q 'aria-label="Breadcrumb"' .output/public/bf-probe/28-bf-breadcrumb/index.html
grep -q 'aria-current="page"' .output/public/bf-probe/28-bf-breadcrumb/index.html
```
Fails today (no `bf/Breadcrumb.vue`), passes once done.

## Decisions

_Runner appends here._
