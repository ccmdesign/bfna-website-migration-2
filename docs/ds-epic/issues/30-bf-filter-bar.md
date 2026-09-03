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

### D-30.1 — the selected values are `Filter['key']`, not `value`

The Scope section's prose says a click toggles "its `value`" in and out of
`modelValue`. The shared `Filter` contract this issue is required to import
(issue 02) declares `{ key: string; label: string }` — there is no `value`
field. The contract wins (BRIEF §5 rule 11), so `modelValue` is
`Array<Filter['key']>`.

Typed as `Filter['key']` rather than a bare `string[]`, so renaming
`Filter.key` re-types every consumer of the array with it. It is still
assignable from `string`, so a page reading its facets out of a route query
needs no cast.

### D-30.2 — `FilterBarProps` lives in `bf-contracts.ts`

The spec sketches `interface Props` inside the SFC. BRIEF §5 rule 11 says no
component declares a shared type inline, and every atom before this one
(`ChipProps`, `ButtonProps`, `BylineProps`, …) keeps its props interface in
`src/types/bf-contracts.ts`. This one does too. The sketch's shape is
unchanged; only its address is.

### D-30.3 — the group label defaults to `"Filters"`

The exact default the spec asked to be recorded: `label?: string` defaults to
the literal `Filters`.

It is the right answer for a bar that is alone on its page and the wrong one
for the call site this component exists for — the search page renders a
programme facet and a format facet together, and two groups sharing one
accessible name is a worse outcome than no name at all. The default is
therefore documented at the prop as a fallback, not as an invitation: both
facets in the probe pass `Program` and `Format`, and issues 49/54/55 must do
the same. A consumer that prefers to point at a visible caption can pass
`aria-labelledby`, which wins over `aria-label` by ARIA's own name computation
and falls through `$attrs` untouched.

### D-30.4 — Home and End are implemented alongside the arrow keys

The spec names arrow keys only. `Home`/`End` are part of the same ARIA pattern
it points at, cost two `case` labels, and are what a user who has learnt the
arrows on a group next reaches for. Added deliberately rather than silently;
the probe drives both through real input.

`ArrowRight` = "next" is an LTR assumption, left in place and documented at the
call site in `FilterBar.vue`. Every route in this epic is LTR; a `dir`-aware
mapping would be untested code.

### D-30.5 — the roving index is derived, not stored

`focusedIndex` (written by the chips' own `focus` events) is read through an
`activeIndex` computed that falls back to *first selected, else first chip* and
clamps to `filters.length`. The obvious alternative — a `rovingIndex` ref kept
in step by a watcher — has a reachable failure state: when `filters` shrinks
under a focused chip, the stored index points past the end of the array, no
chip carries `tabindex="0"`, and the group becomes unreachable by keyboard.
Deriving it makes that state impossible. Probe § 5 truncates a bar's `filters`
under a focused chip and asserts the tab stop survives, clamped.

### D-30.6 — additions append to the caller's array, in click order

Toggling emits a **new** array: removal filters, addition spreads and appends.
It is not rebuilt from `filters`, which would look tidier and would silently
drop any selected key that is not currently rendered — the state of a page
whose facet list narrows with its query. The page owns its filter vocabulary;
this component adds and removes one key at a time and disturbs nothing else.
Asserted in probe § 4 with a real out-of-vocabulary format value.

### D-30.7 — acceptance is the probe, not vitest (residual #86)

The spec's acceptance block runs `npm run typecheck`, `npx nuxt generate` and
three greps, and then says the multi-select emit and the arrow-key roving focus
"are verified interactively … since prerendered HTML cannot assert live
keyboard behaviour". Since the #109 harness that is no longer true, and the
vitest harness on `dev` is broken and pre-existing, so the substitution is:

| Spec asks for | Ran instead |
|---|---|
| `npm run typecheck` | `npx nuxt typecheck`, against the epic's **no-new-errors** gate: 178 `error TS` before and after, 0 of them in `src/components/bf`, `src/types` or `src/composables/bf`. `npm run typecheck` cannot be green on `dev` and is not the gate. |
| `grep -Lq ":style="` on the source | `grep -c ':style='` over the **comment-stripped** source (= 0), the #115 rule: run over the whole file it is a check on the docblock, which discusses the wireframe's `:style` hack by name. Backed at runtime by two probe rows asserting no rendered group or chip carries a `style` attribute at all. |
| "verified interactively" (multi-select emit, arrow-key focus) | `npx tsx scripts/check-probes.ts --only 30` — 48 rows, including a four-step `v-model` round trip asserted by value plus both array-identity facts, and a six-key sequence dispatched as **trusted CDP input** asserting the focused chip at every step, `preventDefault` on the five consumed keys and not on `Tab`. The full suite (22 probes, 1026 rows) also passes. |

`npx nuxt generate` and the `role="group"` grep on the prerendered HTML ran as
written.

### D-30.8 — the probe harness learned six keys

`scripts/check-probes.ts`'s `KEYS` map gained `ArrowLeft`, `ArrowUp`,
`ArrowRight`, `ArrowDown`, `Home` and `End`. Purely additive — the map already
rejects unknown names loudly, and no existing probe's sequence changes.
`docs/decisions/probe-harness.md` is amended with the new names and with the
sequential-focus-navigation-starting-point trap that cost this probe its first
run.
