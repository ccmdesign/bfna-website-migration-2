# Plan — gh#24 / issue 15: `bfButton`

Spec: [`docs/ds-epic/issues/15-bf-button.md`](../ds-epic/issues/15-bf-button.md) ·
Epic brief: [`docs/ds-epic/BRIEF.md`](../ds-epic/BRIEF.md) ·
Branch: `feature/gh24-bfbutton` off `dev` @ `42b88a1`.

## Approach

One presentational atom, `src/components/bf/Button.vue` (`<bfButton>`), that
resolves its own element from props and gets every colour from an existing
semantic token. It follows the file/probe/verify-script shape gh#23 (`bfLogo`)
established, because later issues regression-check against it.

**Element resolution** — the same three-way branch `wfChip.vue` already
demonstrates, plus one extra rule the chip does not need:

| props | element |
|---|---|
| `disabled` (whatever else is set) | `<button type="button" disabled>` |
| `to` | `<NuxtLink :to="to">` |
| `href` (no `to`) | `<a :href="href" :data-external="external \|\| undefined">` |
| neither | `<button type="button">` |

`disabled` outranks `to`/`href` deliberately: neither `<a>` nor `NuxtLink`
supports a native `disabled`, and a disabled-*looking* but still-clickable,
still-focusable link is the failure mode the spec names by hand. Rendering a
real `<button disabled>` is the only branch that is genuinely non-interactive
**and** non-focusable, which is the stated acceptance.

**Styling** — `@layer components` inside a `<style scoped>` block. The
cascade-layers polyfill that used to flatten that wrapper was switched off in
gh#101 (`postcss-preset-env` `features['cascade-layers']: false`), so the
`@layer` must survive into the built CSS; that is asserted, not assumed.

Box metrics are matched to `.wf-button` (`public/css/wireframe.css:262-276`)
rather than reinvented: `padding: 0.4em 1.2em`, `border: 2px solid`
(→ `--border-width-medium`, an existing token whose value is `2px`). Because
the padding is in `em`, a size change is a font-size change and the box scales
with it — no per-size padding table.

**Colour**, per BRIEF §5 rule 2 (no new colour, semantic tokens only, never a
primitive):

| | wireframe literal | `bfButton` token |
|---|---|---|
| default fill | `#fff` | *no fill* — `--_bf-button-bg: none` |
| default text + border | `#222` | `--color-text` |
| primary fill | `#222` | `--color-primary` |
| primary text | `#fff` | `--color-text-inverse` (added in gh#101) |

`--color-primary` is what the spec's Styling section names first, and it is the
"button-appropriate semantic token"; `--color-text-inverse` is the semantic
alias gh#101 added precisely so a `bf-*` component would stop reaching for the
`--color-white` primitive. Contrast of `--color-text-inverse` on
`--color-primary` (`hsl(208 50% 38%)`) is ≈6.2:1 — WCAG 2.1 AA at any size.

The default variant paints **no** background rather than a white one: the
semantic layer has no `--color-surface`, the only white-ish semantic name is
`--color-text-inverse` (whose meaning is text, not ground), and `--color-white`
is a primitive rule 2 forbids. `background: var(--_bf-button-bg)` with a
default of `none` renders identically to the wireframe's `#fff` on the white
page ground, keeps the button usable on a dark panel, and introduces no colour
literal — `verify-bf-logo.ts`'s colour-literal regex counts a bare
`transparent` as one, so `none` is also the value that keeps the shared
convention green.

**Focus** — `:focus-visible` gets both an `outline` in `currentColor` (which is
the variant's own text colour, so it is visible on either ground and survives
forced-colors mode, where `box-shadow` does not) and the existing
`--outline-focus` token as the halo. The token is reused, not reinvented, per
the spec.

**`cssVars`** — a computed bound to `:style`, per BRIEF §5.4 and the repo's own
Standard 5 ("only set overrides when necessary", as `ccmButton` does). It emits
`--_bf-button-bg` / `--_bf-button-color` / `--_bf-button-border` for
`variant="primary"` and `--_bf-button-font-size` for a recognised `size`;
defaults live in the stylesheet where a consumer can outrank them.
`v-bind="$attrs"` is placed **after** `:style="cssVars"` so a caller's own
`style` wins the merge — the same escape hatch the `bfLogo` probe uses.

**Sizes** — `size?: string` (the spec's own type; deliberately open). `s` / `m`
/ `l` map onto the existing Utopia type steps `--size--1` / `--size-0` /
`--size-1`. Omitting `size` inherits the surrounding font size, which is what
`.wf-button`'s `font: inherit` does — so the default render is wireframe-exact
and the sizes are opt-in. An unrecognised string emits no variable and
degrades to that same base.

## Files

| File | Change |
|---|---|
| `src/types/bf-contracts.ts` | add `ButtonVariant`, `ButtonProps` (BRIEF §5 rule 11 — shared types live here and nowhere else) |
| `src/components/bf/Button.vue` | **new** — the component |
| `src/pages/bf-probe/15-bf-button.vue` | **new** — probe, kept (only issue 59 removes `bf-probe/`) |
| `scripts/verify-bf-button.ts` | **new** — the acceptance check |
| `docs/ds-epic/issues/15-bf-button.md` | append to Decisions |
| `docs/plans/gh24-plan.md` | this file |

Nothing else. In particular nothing under `pages/wireframes/`,
`components/wireframe/`, `layouts/wireframe.vue` or `public/css/wireframe.css`.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the gh#20–gh#23 substitution: a probe page plus an
`npx tsx` script, recorded in the spec's Decisions.

1. **Probe** `/bf-probe/15-bf-button` renders the **full matrix** — 3 element
   types (`to` / `href` / `button`) × 2 variants × 4 sizes (base, s, m, l) = 24
   live instances, plus a disabled row for each element type. Client-side
   assertions read the live DOM and publish a
   `data-testid="probe-15-verdict"` PASS/FAIL cell, exactly as probe 14 does.
   The assertions worth having are relational, not tautological:
   - each of the three element types actually rendered as `a[href]` /
     `a` from NuxtLink / `button` — read as `tagName` + attributes;
   - **box metrics equal `.wf-button`'s**: the probe links
     `/css/wireframe.css` and measures a hidden
     `.wireframe .wf-button` against a `bf-button`, comparing computed
     `padding` and `border-width`. This is the "read computed values, don't
     guess" check, and it fails if either side drifts.
   - `disabled` → `tabIndex === -1`-equivalent (a native disabled button is
     not in the tab order) and `disabled` present, for all three prop shapes;
   - every non-disabled instance is keyboard-reachable: walk
     `document.querySelectorAll('.bf-button')` and assert each is matched by
     the focusable set, then `focus()` it and assert
     `document.activeElement` is it;
   - a visible focus state exists: `:focus-visible` styles resolve to a
     non-`none` outline (checked through `CSS.supports` + a real focus);
   - primary resolves to `--color-primary` / `--color-text-inverse` and the
     two variants differ;
   - `.bf-button` rules sit inside `@layer components` **in the live CSSOM**
     (the gh#101 guard, reusing probe 14's `CSSLayerBlockRule` walk);
   - `$attrs` fallthrough lands on the resolved root element.
2. **`scripts/verify-bf-button.ts`** runs the spec's five literal `grep`/`test`
   acceptance expressions as written, asserts no colour literal in the
   component or the probe, asserts the padding/border values are the ones
   `wireframe.css` actually declares (parsed out of that file, not hard-coded
   twice), asserts `@layer components` survives into `.output/public/_nuxt/*.css`,
   and reads the prerendered probe HTML for the 24-instance matrix. Skips
   count as failures, per the gh#23 exit contract.
3. **Gates**: typecheck no-new-errors (baseline 178, scoped-path count 0);
   `npx nuxt generate` exits 0; wireframe-source diff prints nothing.
4. **Browser** (STEP 6): serve `.output/public` and drive
   `/bf-probe/15-bf-button` headlessly; the verdict cell must read PASS, and
   a Tab-walk must reach every enabled instance and skip every disabled one.

## Risks

| Risk | Mitigation |
|---|---|
| `@layer components` flattened again by a build change | asserted in the built CSS by the verify script *and* in the live CSSOM by the probe |
| `disabled` on a `to`/`href` button silently producing a focusable link | the element-resolution branch puts `disabled` first; the probe asserts all three disabled shapes are `<button disabled>` |
| Reaching for `--color-white` / a new token for the default ground | default variant paints no ground at all (`--_bf-button-bg: none`); colour-literal scan in the verify script |
| Inline `cssVars` outranking a consumer's own style | `v-bind="$attrs"` placed after `:style`, so the caller's style wins the merge; asserted on the probe |
| Drift from `.wf-button` metrics | measured against the real `.wf-button` at runtime and parsed out of `wireframe.css` statically — never typed twice |
| Touching a frozen wireframe file | `git diff --stat` over the four frozen paths, against the pre-epic base SHA, run before the PR opens |
