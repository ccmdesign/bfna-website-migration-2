# Plan — gh#39 / issue 30 · `bfFilterBar`

**Spec:** [`docs/ds-epic/issues/30-bf-filter-bar.md`](../ds-epic/issues/30-bf-filter-bar.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Blocked-by:** gh#25 (`bfChip`, toggle mode), gh#117 (its a11y fixes)

## Approach

A presentational filter row that **composes `bfChip[toggle]` and re-decides
nothing about a chip**. The whole value of the issue is deletion: the search
wireframe hand-rolls the selected state twice with an inline `:style` hack, and
`insights/index.vue` hand-rolls a third, link-based mechanism. `bfChip` already
owns the selected paint, the non-colour cue and `aria-pressed`; this component
owns exactly two things the chip cannot know about — **group semantics** and
**arrow-key roving focus across the group**.

Four decisions to settle while writing it:

1. **`Filter` says `key`, not `value`.** The spec's prose says "adds/removes its
   `value`"; the shared contract (issue 02) declares `{ key, label }`. The
   contract wins — BRIEF §5 rule 11 — so `modelValue` holds `Filter['key']`
   strings. Recorded in the spec's Decisions.
2. **Props interface goes in `bf-contracts.ts`** as `FilterBarProps`, not inline
   in the SFC, matching `ChipProps`/`ButtonProps`/`BylineProps` (rule 11).
3. **Roving index is derived, not stored-and-watched.** A `focusedIndex` ref
   (set by the chips' own `focus` events and by the arrow handler) falls back to
   the first selected chip, else 0, and is clamped against `filters.length` —
   so a changing `filters` array cannot strand the tab stop on a chip that no
   longer exists, with no watcher to keep in sync.
4. **The new array is emitted, never mutated.** Removal filters; addition
   appends, preserving the caller's incoming order rather than re-deriving it
   from `filters` (a value not present in `filters` must survive a round trip).

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/types/bf-contracts.ts` | **add** `FilterBarProps` |
| `bfna-website-nuxt/src/components/bf/FilterBar.vue` | **new** — the component |
| `bfna-website-nuxt/src/pages/bf-probe/30-bf-filter-bar.vue` | **new** — the probe |
| `bfna-website-nuxt/scripts/check-probes.ts` | **add** ArrowLeft/Right/Up/Down, Home, End to `KEYS` |
| `docs/ds-epic/issues/30-bf-filter-bar.md` | append Decisions |

Nothing else. No wireframe file is read into, imported from, or edited.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe under the #109 harness, per the gh#20–#38 precedent:

- `npx tsx scripts/check-probes.ts --only 30` and the **full** run exit 0.
- The probe renders the **real** facets — the three programme names from
  `content/bf/programs/` and the four formats from the frozen `search.vue`'s
  `FORMATS` — plus edge cases (empty `filters`, a selected value absent from
  `filters`, a single-chip bar).
- **v-model round trip**: a real `v-model` binding whose emitted arrays are
  recorded; clicking asserts the exact array after each of a four-step sequence,
  that the prop array object is never mutated in place, and that no `:style`
  drives any active state.
- **Keyboard row**: driven by real CDP input via `data-probe-keys`, which needs
  the arrow keys the harness does not yet know — one additive edit to its `KEYS`
  map. Tab in, then ArrowRight / ArrowLeft / Home / End, asserting which element
  holds focus at each step and that exactly one chip has `tabindex="0"`.

Plus the epic gates: typecheck **no new errors** against the 178-error baseline
on `dev` and zero errors in `src/components/bf|src/types|src/composables/bf`;
`npx nuxt generate` exits 0; the wireframe-source diff prints nothing.

## Risks

- **Arrow keys are new to the probe harness.** Additive to a `Record` that
  already rejects unknown names loudly; no existing probe's sequence changes.
- **Roving tabindex vs `bfChip`'s `$attrs` order.** `aria-pressed` is bound
  *after* `$attrs` in `Chip.vue` (residual #115) — `tabindex` is not, so it
  falls through cleanly. Asserted in the probe rather than assumed.
- **RTL.** `ArrowRight` = next is a writing-mode assumption. Left as-is (every
  route in the epic is LTR) and recorded, not silently taken.
- **Group naming.** Defaulting `label` to `"Filters"` makes two bars on one page
  share an accessible name. The default is the spec's instruction; the probe
  and the eventual call sites pass a real facet name, and the docblock says so.
