# 16 — bf-chip

Evolve `wfChip` into `bfChip` with a fourth mode — `toggle` — closing the
duplicated inline active-style hack in `search.vue`.

## Context

Depends on 02, 06. Blocks 21 (`bfCardInsight`), 22 (`bfCardProject`), 26
(`bfCardProduct`), 27 (`bfCardRow`), 28 (`bfBreadcrumb` — no, breadcrumb
doesn't use chip; still: 30 `bfFilterBar` depends on this directly, per
BF-209's noted dependency on BF-157). Builds from
`bfna-website-nuxt/src/components/wireframe/wfChip.vue` (4 lines of
template: `NuxtLink`/`a`/`span` branch, `active` styled via inline `style`
attribute, line 12). Provenance: BF-157; as-built-wireframe-inventory.md
§D.3.

**Verified today**: `wfChip.vue:12`'s `active` prop only ever drives an
inline `:style="active ? 'background:#222;color:#fff' : undefined"` on the
`NuxtLink` branch — no click/button variant exists. `search.vue:23-27` and
`:31-35` each hand-roll `<button class="wf-chip" :style="… ?
'background:#222;color:#fff;cursor:pointer' : …">` for the program/format
facets — the exact same active-style logic, duplicated twice in one file,
because `wfChip` has no button variant to reuse.

## Scope

- New `bfna-website-nuxt/src/components/bf/Chip.vue` (`<bfChip>`), four
  modes:
  - **span** (default, no `to`/`href`/`toggle`) — `<span class="…">`.
  - **link** (`to` set) — `<NuxtLink :to="to">`.
  - **anchor** (`href` set, no `to`) — `<a :href="href">` with
    `[data-external]` when `external` is true.
  - **toggle** (**new**, `toggle: true` prop) — `<button type="button"
    :aria-pressed="modelValue">`, emits `update:modelValue` on click (and
    on Space/Enter — native `<button>` already fires `click` for both, no
    extra keydown handler needed).
- Props: `to?: string | Record<string, unknown>`, `href?: string`,
  `external?: boolean`, `active?: boolean` (span/link/anchor modes —
  visual-only, no emit), `toggle?: boolean`, `modelValue?: boolean` (toggle
  mode only).
- Active-state styling is a **CSS class** (`[data-active]` or an
  `--_bf-chip-*` variable driven by `active`/`modelValue`), never an inline
  `style` binding — this replaces `wfChip.vue:12`'s inline-style pattern
  and the two `search.vue` hand-rolled duplicates.
- Slot: `default`.

## Out of scope

- Filter-row layout or multi-select orchestration — that's `bfFilterBar`
  (issue 30), which composes `bfChip[toggle]` internally; this issue ships
  the chip only.
- Editing `wfChip.vue` or `search.vue` — both frozen (D2); the duplicated
  hack in `search.vue` stays exactly as-is until the template issue that
  owns that page (54, `page-search`) swaps it for `bfFilterBar`/`bfChip`.
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).
- Any new colour — active state reuses whatever semantic token the
  `#222`/`#fff` inline styles are standing in for (dark-fill/light-text
  pairing — likely `--color-text`/`--color-surface` inverted, or a
  dedicated "selected" semantic token if one already exists; do not invent
  a new literal).

## Styling

CSS-variable hooks: `--_bf-chip-bg`, `--_bf-chip-color`,
`--_bf-chip-border` — bound via computed `cssVars`, toggled by `[data-active]`
or an `active`/`modelValue`-driven class, never inline `style`. `@layer
components`. Semantic tokens over primitives per BRIEF §5.2.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Chip.vue   # today: fails
grep -c "toggle" src/components/bf/Chip.vue         # after: >=1
grep -c "aria-pressed" src/components/bf/Chip.vue   # after: >=1
grep -c ":style=" src/components/bf/Chip.vue        # after: 0 — no inline active-style
git diff --stat -- src/components/wireframe/wfChip.vue src/pages/wireframes/search.vue   # must be empty
```
Plus: all four modes render on a probe page, the toggle mode emits
`update:modelValue` on click and on Space/Enter, and `aria-pressed` tracks
state (per the issues.md `verify` column — manual check).

## Decisions

_Runner appends here._
