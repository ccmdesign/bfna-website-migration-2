# 20 — `bfCard` — slot-based card base

One-line objective: evolve `wfCard.vue` into the public `bfCard` shell — the
inheritance root for all seven typed card wrappers — adding the `span="full"`
grid-slot modifier.

## Context

Depends on 02 (`components/bf/` scaffold, `bf-contracts.ts`), 03 (`data-gap`
honoured on `.cluster`, used by the chips slot). Builds from
`src/components/wireframe/wfCard.vue` (base + typed-wrapper pattern, as-built
A). Descends to: 21–27 (`bfCard*` wrappers all render this as their root),
42 (`bfGridInsights`/`bfGridProjects` grids consume `span="full"` via
`bfCardProduct`). Provenance: BF-190; D8 §1a. As-built confirms `wfCard` is
slot-only with **no props today** — `span` is new (D4), previously set only
by `wfCardProduct` writing the raw attribute `data-span="full"` by hand.

## Scope

- File: `src/components/bf/Card.vue` (auto-imports as `<bfCard>`).
- Root element: `<li class="bf-card">` — cards are list items; every card
  group is rendered inside a `<ul>` by its caller.
- Props:
  ```ts
  interface CardBaseProps {
    span?: 'full'
  }
  ```
  `span` sets `data-span="full"` on the root `<li>` when present, nothing
  otherwise. This is the **only** prop — everything else is `$attrs`
  fallthrough (no `inheritAttrs: false` here; this is the base, not a
  wrapper).
- Slots: `default` (card body — heading first per `wfCard.vue`'s own
  comment), `chips`, `media`. Same slot names and order as `wfCard.vue`.
- Visual order: chips render after body in the slot but are pulled to
  `order: -1`, media to `order: -2`, via CSS — never by reordering markup
  (matches `.wf-card__chips`/`.wf-card__media` in `wireframe.css`).
- `$attrs` (class, style, `data-*`) forwarded to the root `<li>` — this is
  what lets `bfCardInsight` etc. compose `class="bf-card | stack"` etc. from
  outside without `bfCard` knowing about it.
- No entity props, no data access, no `queryCollection`.

## Out of scope

- Any entity-specific markup or typed prop (issues 21–27 own that).
- No edits under `pages/wireframes/` or `components/wireframe/` — touching
  either fails the epic (D2).
- Grid-column pinning: `bfCard` sets `grid-column: 1 / -1` for `span="full"`
  via CSS keyed off `[data-span="full"]` — it never writes an inline
  `grid-template-columns` or `grid-column` style attribute.

## Styling

- CSS variables: `--_bf-card-{property}` (e.g. `--_bf-card-padding`,
  `--_bf-card-border`) bound via a computed `cssVars`, sourced from existing
  semantic tokens (`--color-surface`, `--color-border`, Utopia space scale)
  — no new colour.
- `@layer components` for `.bf-card` base rules; `[data-span="full"]` rule
  lives alongside it in the same layer.
- Composition primitives used internally: `.cluster` with `data-gap="xs"` on
  the chips wrapper (matches `wfCard.vue`'s own `wf-card__chips | cluster`).
- Layer order: `reset, defaults, tokens, themes, components, utils,
  overrides` (no change to the declared order).

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Card.vue
grep -q "span" src/components/bf/Card.vue
grep -Lq "grid-template-columns" src/components/bf/Card.vue
```
Plus a hand-authored probe page at `src/pages/bf-probe/20-bf-card.vue`
(outside `pages/wireframes`, not touching `components/wireframe`) that
renders `<bfCard>` with all three slots filled inside a `.grid[data-min-width]`
alongside one `<bfCard span="full">`; after `npx nuxt generate`:
```bash
grep -q 'data-span="full"' .output/public/bf-probe/20-bf-card/index.html
```
All commands fail today (no `src/components/bf/` directory exists yet) and
must pass once the issue is done.

## Decisions

_Runner appends here._
