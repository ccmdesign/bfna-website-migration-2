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

### gh#25 — runner decisions

**D-16.1 — No style binding, and therefore no `cssVars`.** The Styling section
above asks for the `--_bf-chip-*` hooks "bound via computed `cssVars`", while
the acceptance block asks for `grep -c ":style=" src/components/bf/Chip.vue`
to be `0`. Those cannot both hold. Resolved in favour of the acceptance
expression, because it is the machine-checkable one *and* the one that carries
the issue's intent: the whole point is to stop expressing the selected state as
an inline declaration. The hooks are declared with their defaults in
`@layer components` and re-pointed by a single `.bf-chip[data-active]` rule in
the same layer.

This is a deliberate, narrow departure from BRIEF §5 rule 4. That rule governs
**prop-derived overrides** — the `variant`/`size` axes `bfButton` has, whose
values cannot be enumerated in a stylesheet. `bfChip` has no such axis: its
only variable input is a *state*, which CSS expresses natively and an inline
declaration expresses strictly worse, since an inline declaration cannot be
outranked by a consumer's rule. `$attrs` fallthrough (`inheritAttrs: false` +
`v-bind="$attrs"`, bound last) keeps the per-instance override path open, so
nothing the pattern exists to provide is lost.

**D-16.2 — `toggle` outranks `to`/`href`.** The counterpart of `bfButton`'s
`disabled` rule, on the same reasoning: only a real `<button>` can carry the
toggle contract. `NuxtLink` navigates when activated and a `<span>` cannot take
focus, so an `aria-pressed` state on either would advertise a control that
keyboard and screen-reader users cannot operate. The pairing is a caller
mistake; `to`/`href` are ignored rather than warned about.

**D-16.3 — Colour mapping.** `#222` → `--color-surface-inverse` and `#fff` →
`--color-text-inverse` (≈21:1). `--color-surface-inverse` rather than
`--color-text` for the ground is the semantic layer's own instruction: it names
"the ground an inverted block sits on", which is exactly what a selected chip
is. The frozen rule's `1px solid #666` border becomes
`--border-width-thin solid --color-text`: the lo-fi mid-grey has no semantic
name, and `bfButton` mapped its own border the same way. `--radius-pill`
resolves to the frozen `999px` exactly. No new colour, no primitive.

**D-16.4 — Type, not face.** The frozen rule's monospace face at a raw `0.7rem`
is lo-fi signalling. `bfChip` inherits the face and takes the `--size--2`
Utopia step, per BRIEF D5. The `em`-relative padding is carried over unchanged
and is compared **em-normalised** against the frozen rule, so the metrics check
is about the declaration rather than the inherited font size.

**D-16.5 — Focus ring.** `--_bf-chip-focus-color` mirrors gh#24's
`--_bf-button-focus-color`, which fixed a WCAG 1.4.11 defect. Default
`currentcolor`; `[data-active]` re-points it to `--color-text`, because on
`currentcolor` a selected chip would inherit its light label colour and paint a
white ring on a white page.

Probe 15's companion check — "the ring contrasts with the filled variant's own
ground" — is deliberately **not** carried over, and its replacement is a
correction rather than a relaxation. `bfButton`'s filled variant is
`--color-primary`, a different hue from its ring; `bfChip`'s selected fill is
`--color-surface-inverse` and its ring is `--color-text`, which resolve to the
same paint (`rgb(8,8,8)` today). The ring is drawn with a positive
`outline-offset`, i.e. wholly outside the border box, so the fill is never one
of its adjacent colours — WCAG 1.4.11 asks for contrast against what the
indicator actually touches, which is the page ground, and that check passes at
≈21:1. The probe instead asserts the geometry that premise rests on: a
positive, *resolved* offset.

**D-16.6 — Acceptance substitutes for vitest** (orchestrator decision after
#19, residual #86). The harness on `dev` is broken and pre-existing, so
acceptance is `npx tsx scripts/verify-bf-chip.ts` (exit `0` only when every
check ran *and* passed; a skip is `INCOMPLETE` and exits `1`) plus the probe at
`/bf-probe/16-bf-chip`, which is **kept** — only the final cutover issue
removes `bf-probe/`.

**D-16.7 — How keyboard activation is proven.** Space and Enter get no handler:
a native `<button>` fires `click` for both by HTML's activation behaviour, and
re-implementing that is the hand-rolling this issue removes. Proving it takes
two checks, because a synthetic `KeyboardEvent` produces no activation
behaviour in any browser — a check that dispatched one and waited for
`aria-pressed` to move would fail a correct component.

1. Deterministic, in the probe's own table: a
   `MouseEvent('click', { detail: 0 })` — exactly the event shape a user agent
   synthesises for a keyboard activation — flips `aria-pressed`; and the root
   really is `<button type="button">`, with the verify script asserting that no
   `keydown`/`keyup` handler, `tabindex` or `role` override exists to
   substitute for it.
2. Live, in a separate three-state panel (`data-testid="probe-16-keyboard"`)
   that reaches `pass` only once a real Enter **and** a real Space have arrived
   as `detail === 0` clicks with `aria-pressed` observed in both states. It is
   reported separately from the main verdict so that opening the probe without
   touching the keyboard reads `pending` rather than a misleading `FAIL`.
