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

_Appended by the gh#37 item-runner._

### D-28.1 — the last crumb is never a link

The issue body ("linked crumbs via `NuxtLink` and the final crumb plain"), this
spec's §Scope ("`aria-current="page"` marks the final crumb regardless of
whether it happens to carry a `to`") and the acceptance ("the last crumb is not
a link") all say the same thing, but the orchestrator brief's shorthand — *"links
for every item that has `to`"* — reads as contradicting them for a trail whose
final node carries a route. Resolved in favour of the spec and the stated
acceptance:

| position | has `to` | renders |
|---|---|---|
| last | yes **or** no | `<span aria-current="page">` |
| not last | yes | `<NuxtLink>` |
| not last | no | `<span>`, **no** `aria-current` |

A link to the page you are on is a link to nowhere, and a trail has one current
page, not several. `wfBreadcrumb` conflates the two questions by answering both
with `v-if="c.to"`, so a trail whose last node carries a route renders there
with no current item at all. Probe 28's `last-linked` and `middle-unlinked`
trails assert both halves.

### D-28.2 — the separator carries empty alternative text

Moving the slash out of the DOM is **not** sufficient on its own. Generated
content is concatenated into the accessible-name computation in Chrome, so
`content: "/"` on a `::before` reproduces the exact defect this component
exists to fix, somewhere a reviewer is far less likely to look.

The declaration is therefore `content: "/" / ""` — the alt-text form: the
string to paint, then the alternative text to expose, which is none. Exposed as
`--_bf-breadcrumb-separator` so the two halves travel together and an
overriding consumer sees that they must.

Probe 28 asserts the resolved value from the **live CSSOM**
(`getComputedStyle(li, '::before').content === '"/" / ""'`, whitespace
stripped), not from the source, so a build step that drops the alt half fails
the run instead of silently shipping a slash into every screen reader.

### D-28.3 — a local `interface Props`, not a `BreadcrumbProps` in contracts

A deliberate divergence from the `XProps`-in-`bf-contracts.ts` shape of the
fourteen atoms before this one. BRIEF §5 rule 11 forbids a component declaring a
**shared** type inline; the shared type here is `Crumb`, which is imported from
contracts rather than redeclared — precisely what `wfBreadcrumb` gets wrong.
`Props` is unexported and unimportable, so it is shared with nobody, and this
spec both designs the props that way and greps this file for `Crumb[]`.

`src/types/bf-contracts.ts` is therefore **not edited by this issue** — `Crumb`
(line 315) already had the right shape from issue 02 / gh#11.

### D-28.4 — an empty trail renders nothing

`items: []` produces no element at all, not an empty `<nav aria-label="Breadcrumb">`.
A landmark is announced by its name before its contents are read, so an empty
one costs a screen-reader user an announcement and a navigation to discover
there was nothing there. Same reasoning as `bfTime`'s absent-date branch
(gh#27).

### D-28.5 — `role="list"` on the `<ol>`

`list-style: none` strips list semantics in Safari/VoiceOver, which would lose
the "list, 4 items" announcement that is the whole reason for upgrading the
wireframe's bare inline nodes to a list. Redundant in every other engine,
harmless everywhere.

### D-28.6 — separator colour token

`--_bf-breadcrumb-separator-color: var(--color-neutral-tint-60)`, an existing
semantic shade token from `tokens/semantic-colors-shades-and-tints.css`. No new
colour, no literal, and not a primitive (BRIEF §5 rule 2). `--color-light` was
rejected: it resolves to `--color-base-tint-02`, 2% base on white, which is
invisible.

### D-28.7 — acceptance substituted for the named `npm run typecheck`

Two substitutions, both per standing orchestrator decisions:

1. **`npm run typecheck` → the no-new-errors gate.** `dev` carries 178
   pre-existing `error TS` (residual #71), so a green run is impossible.
   Measured before and after: **178 → 178**, with **0** errors matching
   `src/(components/bf|types|composables/bf)|content\.config`.
2. **The spec's `.output/public` greps → the gh#109 probe harness.** Both greps
   still pass (1 hit each), but the load-bearing assertions run on mount and a
   prerendered-HTML grep cannot see them. Acceptance is
   `npx tsx scripts/check-probes.ts --only 28` (**67/67 rows**) plus the full
   suite (**20 probes, 904 rows, 0 failures**). The vitest harness on `dev` is
   broken and pre-existing (residual #86) and was not touched.

### D-28.8 — comment prose kept clear of the epic's own mechanical scans

The component's doc comment originally contained the literal strings
`interface WfCrumb` and `:not()` while describing what it deliberately does
*not* do. Both would false-positive this spec's `interface.*Crumb` check and the
D-20.5 negation-pseudo-class scan. Reworded — the gh#115 lesson that a check run
over an unstripped file is a check on the comments, not on the code, applied in
the other direction: prose should not make a correct file look wrong either.
