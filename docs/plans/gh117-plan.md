# Plan — gh#117: `bfChip` a11y follow-ups (promoted residuals #111, #112)

**Issue:** [gh#117](https://github.com/ccmdesign/bfna-website-migration-2/issues/117) ·
**Evidence:** [#111](https://github.com/ccmdesign/bfna-website-migration-2/issues/111),
[#112](https://github.com/ccmdesign/bfna-website-migration-2/issues/112) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Base:** `dev` @ `a54eceb` · **Branch:** `feature/gh117-16b-bfchip-a11y-follow`

The issue body is the spec (no `docs/ds-epic/issues/<nn>` file exists for it). Two fixes in
one component, plus the probe rows that hold them.

## Approach

### 1 — #111: an uncontrolled toggle must flip its own state

`withDefaults` currently pins `modelValue: false`, so `props.modelValue` is `false` whether
or not the caller bound it, `pressed` is permanently `false`, and `emit('update:modelValue',
!props.modelValue)` sends `true` on every activation. `<bfChip toggle>` therefore announces
`aria-pressed="false"` forever.

Take option 1 from #111 (internal fallback ref), not option 2 (discriminated union):

- `modelValue` default becomes `undefined`. With a Boolean-typed prop, an *explicit*
  `default: undefined` is what stops Vue's boolean casting from rewriting an absent prop to
  `false` — that cast only fires when the prop is absent **and** has no default — so
  `props.modelValue === undefined` becomes a reliable "not bound" signal.
- An internal `ref(false)` holds the state only while the prop is undefined.
- `onToggle` computes `next` from the **effective** state, writes it to the internal ref when
  uncontrolled, and emits `update:modelValue` **either way** — a controlled parent still owns
  the state and can veto (the desync objection in #111 is answered: when `modelValue` is
  bound, the internal ref is never read).

Deliberately unchanged: `active` stays ignored in toggle mode. #111 mentions
`<bfChip toggle active>` only as the mistake that makes the bug visible; seeding the internal
ref from `active` would introduce a second, undocumented state owner and contradict the
component's stated contract (and probe 16's `active is ignored in toggle mode` row).

### 2 — #112: the passive `active` state must not be colour alone

Two halves, matching the issue's two WCAG citations.

- **1.4.1 (colour alone), every branch.** A new hook `--_bf-chip-text-decoration`, default
  `none` in `.bf-chip`, re-pointed to `underline` by the existing `.bf-chip[data-active]`
  rule, with `text-decoration-thickness: var(--border-width-thin)` and a small
  `text-underline-offset` stated once on the base. No new colour, no new token, no new
  literal — the decoration paints in `currentcolor`.

  Underline rather than a `::before` check glyph, for three reasons: it is **layout-neutral**
  (a leading glyph widens the chip, and "selecting a chip changes no metric" is a contract
  this component already states and probe 16 asserts); it survives **forced-colors** mode,
  where the fill is repainted by the system but text decoration is kept; and it puts no
  CSS-generated text into the accessibility tree.

- **1.3.1 (state not announced), where the chip is interactive.** The link and anchor
  branches gain `aria-current="true"` when selected, bound **before** `v-bind="$attrs"` so a
  consumer can still override it with `'page'`. Emitted through a `v-bind` of a computed
  object that omits the key entirely when not selected — a bound `:aria-current="undefined"`
  would `mergeProps`-override and *erase* the `aria-current="page"` `NuxtLink` sets on the
  link branch when the route matches. The toggle branch keeps `aria-pressed` and gets no
  `aria-current`; the `<span>` branch is not interactive, gets no ARIA, and its gap is
  documented rather than papered over with an invented role.

### 3 — probe 16 and `verify-bf-chip.ts`

Probe 16 gains two sections and their rows (`§ 13` uncontrolled toggle, `§ 14` non-colour
cue), and two new chip instances: one uncontrolled toggle and one anchor carrying
`aria-current="page"` for the override row. Every other new assertion reuses instances that
already exist in the mode gallery. Two pinned counts in the probe move with them (toggles
7 → 8, interactive chips 13 → 15).

`verify-bf-chip.ts` §3 pins `emit('update:modelValue', !props.modelValue)` verbatim; that
line no longer exists, so the check is rewritten to assert the new, stronger contract
(negation of the *effective* state, plus the internal fallback and the unconditional emit).

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/components/bf/Chip.vue` | both fixes + docblock |
| `bfna-website-nuxt/src/types/bf-contracts.ts` | `ChipProps.modelValue` doc comment (uncontrolled is now supported) |
| `bfna-website-nuxt/src/pages/bf-probe/16-bf-chip.vue` | 2 instances, 2 sections, ~12 rows, 2 counts |
| `bfna-website-nuxt/scripts/verify-bf-chip.ts` | §3 emit checks rewritten; new source-level rows for both fixes |
| `docs/decisions/probe-harness.md` | untouched |
| `docs/plans/gh117-plan.md` | this file |

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so acceptance is the
probe plus the two scripts, per the gh#20–gh#25 precedent:

1. `npx tsx scripts/check-probes.ts --only 16` → exit 0, including the new rows.
2. `npx tsx scripts/check-probes.ts` (all probes) → exit 0 — regression cover for 03/09/11–15.
3. `npx tsx scripts/verify-bf-chip.ts` → exit 0.
4. `npx nuxt generate` → exit 0.
5. Typecheck gate: total `error TS` count ≤ baseline **178**, and 0 in
   `src/components/bf|src/types|src/composables/bf|content.config`.
6. Wireframe byte-identity vs `f757a64` → empty.
7. Browser step: drive `/bf-probe/16-bf-chip` headlessly, including a real Enter/Space in the
   keyboard lab.

## Risks

| Risk | Mitigation |
|---|---|
| Vue's Boolean prop casting rewrites an absent `modelValue` to `false`, silently defeating fix 1 | The probe's uncontrolled rows fail loudly if it does; `default: undefined` is explicit, which is the documented escape from the cast |
| The `aria-current` binding erases `NuxtLink`'s own `aria-current="page"` | Bound as an object with the key omitted when not selected, and a probe row asserts a resting anchor carries none while a consumer's `'page'` still wins |
| Underline reads as a link on the anchor/link branches | The base rule sets `text-decoration: none` on every branch, so an underline is unambiguous *within* this component: it means selected, in all four modes |
| New probe instances break pinned counts | Both pinned counts updated; `verify-bf-chip.ts` §8 is already bounds-based (residual #115) |
