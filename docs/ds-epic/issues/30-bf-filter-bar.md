# 30 — `bfFilterBar` — filter chip row

One-line objective: rebuild the filter chip row as `bfFilterBar`, composing
`bfChip[toggle]`, replacing four hand-rolled call sites.

## Context

Depends on 16 (`bfChip` toggle variant — hard dependency, this component
cannot exist before `bfChip`'s `toggle` mode ships). Builds from raw
`.wf-chip` toggle buttons duplicated across four pages (as-built D.3):
`search.vue:23-27` (program facet, inline `:style` active hack),
`search.vue:31-35` (format facet, same hack again), `archive.vue` (implicit
via per-year chip lists — actually static, see note below),
`insights/index.vue:14,18` (`wf-chip :to :active` — a different,
link-based active pattern, not a button toggle), `projects/[slug].vue:76`
(a static, non-interactive `wf-chip href="#"` cohort list — not a filter).
Consumed by 43 (`bfSearchShell` facet row). Provenance: BF-209; as-built
D.3. Note the actual call sites use **two divergent mechanisms** — link-
based (`insights/index.vue`, via `NuxtLink`/query-param) and button-based
(`search.vue`, via `:style` inline hack) — `bfFilterBar` standardises on the
button/toggle mechanism from `bfChip[toggle]`; pages that filter via URL
query (issue 49) adapt to it by mapping toggles to router-query patches,
not by keeping the link-chip mechanism inside this component.

## Scope

- File: `src/components/bf/FilterBar.vue` → `<bfFilterBar>`.
- Props/emits:
  ```ts
  import type { Filter } from '~/types/bf-contracts'   // issue 02 — not declared inline
  interface Props {
    filters: Filter[]
    modelValue: string[]   // currently-selected values (multi-select)
  }
  // emits
  (e: 'update:modelValue', value: string[]): void
  ```
- Root: `<div role="group" :aria-label="groupLabel">` (an accessible group
  label prop, e.g. `label?: string`, defaulting to a generic
  "Filters" — record the exact default chosen in Decisions) wrapping a
  `.cluster` of `<bfChip toggle :model-value="..." @update:modelValue="...">`
  — one per `filters` entry, toggling membership in `modelValue` on click.
- Keyboard: **roving tabindex** across the chip group — only the active/
  first chip is in the natural tab order; arrow keys (Left/Right or Up/Down)
  move focus between chips within the group, matching a standard ARIA
  toolbar/radiogroup-adjacent pattern (this is multi-select, so it is a
  group of toggle buttons, not a radiogroup — use `role="group"`, not
  `role="radiogroup"`).
- Multi-select toggling: clicking a chip adds/removes its `value` from the
  `modelValue` array and emits the full new array (never mutates the prop
  array in place).

## Out of scope

- Applying filters to data — the page/template owns the actual filter
  logic (issues 49, 54, 55); this component only tracks selection state
  and emits it.
- Editing the four wireframe call sites (D2) — they are frozen; their bf-*
  successors (issues 49, 54, 55) are new pages that use this component.
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).
- No inline `style` binding for the active state anywhere in this component
  — active is a CSS class driven by `bfChip[toggle]`'s own `aria-pressed`
  styling (issue 16), never a `:style` hack like the wf source's.

## Styling

- CSS variable `--_bf-filter-bar-gap` (Utopia space token, `xs` by default).
  No new colour — active-chip styling is entirely `bfChip`'s responsibility.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/FilterBar.vue
grep -q "toggle" src/components/bf/FilterBar.vue
grep -Lq ":style=" src/components/bf/FilterBar.vue
```
Probe page `src/pages/bf-probe/30-bf-filter-bar.vue` renders a 4-filter bar,
toggles two on:
```bash
grep -q 'role="group"' .output/public/bf-probe/30-bf-filter-bar/index.html
```
Multi-select emits the expected array and arrow-key roving focus are
verified interactively (documented as a manual browser check in the demo,
since prerendered HTML cannot assert live keyboard behaviour). Fails today
(no `bf/FilterBar.vue`), passes once done.

## Decisions

_Runner appends here._
