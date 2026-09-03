# Plan — gh#43 / issue 34: `bfFormField` + `bfFormGroup`

**Spec:** [`docs/ds-epic/issues/34-bf-form-field.md`](../ds-epic/issues/34-bf-form-field.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Branch:** `feature/gh43-bfformfield-bfformgroup` off `dev`

Written inline by the item-runner (the `ce-plan` fallback the runner template
allows) — the shape is fully determined by the spec, so the plan's job here is
to record the four decisions that are *not* determined by it before any code is
written.

## Approach

Two presentational molecules, one file each, one probe page, demoed together —
the interdependent-components exception BRIEF §5 rule 5 names by hand.

### `bfFormField`

`src/components/bf/FormField.vue` → `<bfFormField>`.

- Props from `FormFieldProps` in `src/types/bf-contracts.ts` (BRIEF §5 rule 11):
  `label`, `modelValue`, `type?` (default `'text'`), `required?`, `hint?`,
  `error?`. Emits `update:modelValue`.
- One `useId()` call yields the base id; the hint and error ids are derived from
  it, so the three are stable across SSR and hydration and cannot collide
  between two instances on a page.
- `<label :for>` — **explicit** association, replacing the wireframe's implicit
  wrapping label. `aria-describedby` is the space-separated join of the hint id
  and the error id, present ids only, `undefined` when neither is set (never an
  empty attribute pointing at nothing). `aria-invalid="true"` only when `error`
  is a non-empty string.
- `type === 'textarea'` renders `<textarea>`; everything else renders
  `<input :type="type">`. Two branches, not a dynamic `<component :is>`: a
  `<textarea>`'s value is its content, not an attribute, and the branch is
  what keeps that difference honest.

### `bfFormGroup`

`src/components/bf/FormGroup.vue` → `<bfFormGroup>`. One prop, `legend`; renders
`<fieldset class="bf-form-group | stack" data-gap="s"><legend>…</legend><slot /></fieldset>`.

## Files

| File | Change |
|---|---|
| `src/types/bf-contracts.ts` | add `FormFieldProps`, `FormGroupProps` |
| `src/components/bf/FormField.vue` | new |
| `src/components/bf/FormGroup.vue` | new |
| `src/pages/bf-probe/34-bf-form-field.vue` | new probe, `bf-probe` layout |
| `docs/ds-epic/issues/34-bf-form-field.md` | Decisions appended |

Nothing under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue`
or `public/css/wireframe.css` is read-write; `wfContactSection.vue` is read for
parity and left byte-identical (D2).

## The four decisions this plan settles

1. **Gap hook vs. the composition layer.** `.stack` spaces its children with
   `margin-block-start` on `* + *` in `@layer composition`, and
   `@layer components` outranks it wholesale. A flat
   `--_bf-form-group-gap: var(--space-s)` consumed by a components-layer rule
   would therefore make the documented `data-gap` API inert on this component —
   the trap `bfByline` (gh#29) and `bfFilterBar` (gh#30) each recorded. So the
   hook **chains through** the composition layer:
   `--_bf-form-group-gap: var(--_stack-space, var(--space-s))`, consumed by a
   `.bf-form-group > * + *` rule. `data-gap` from a consumer flows in; a
   consumer setting `--_bf-form-group-gap` directly still wins.
2. **Which error token.** `semantic-colors.css` declares both
   `--color-fail: var(--color-red)` and `--color-error: var(--color-fail)`,
   in that order — issue 06's ordering fix put the referent before the alias.
   Both survived. `--_bf-form-field-error-color` reads `--color-error`: it is
   the semantic name for this intent, and it resolves to the same paint. No new
   colour (BRIEF §5 rule 2, DoD-6).
3. **The focus ring is local, not global.** The global `:focus-visible` rule for
   form controls (#146) has not landed on `dev`. `base/forms.css`'s existing
   `:focus` rule writes `outline: none` and draws the ring with `box-shadow`
   alone, which forced-colors mode drops. So this component declares its own
   `:focus-visible` with a real `outline` plus the `--outline-focus` halo,
   coloured through `--_bf-form-field-focus-color` — the gh#24 hook pattern,
   for the gh#24-P2-1 reason (a ring painted in `currentcolor` on a control
   whose own colour is the light one is invisible).
4. **`required` is conveyed by the attribute; the asterisk is decoration.**
   The native `required` attribute is what reaches the accessibility tree; the
   `*` is `aria-hidden="true"` so it is not read as punctuation inside the
   label's accessible name.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe under the #109 harness, per the gh#20–#42 precedent.

`src/pages/bf-probe/34-bf-form-field.vue` — `bf-probe` layout,
`[data-probe-verdict]` root, `[data-probe-row][data-ok]` rows — mounts
text/email/textarea fields in default, required, hint, error and hint+error
states, **all inside one `bfFormGroup`**, and asserts:

- `<fieldset>` and `<legend>` are present, and the legend carries the prop;
- every control resolves to a label through `for`/`id`
  (`label.control === control`, the browser's own association, not a string
  compare), and every id on the page is unique;
- the hint+error case yields a **two-id** `aria-describedby`, in hint-then-error
  order, both ids resolving to elements that exist and carry the right text;
- `aria-invalid="true"` appears only on the erroring controls;
- typing round-trips: dispatching `input` updates the bound model, and the model
  reaches the control's value — `<textarea>` included;
- `type` maps to `<input type>` / `<textarea>`;
- the control shows a visible focus ring under `:focus-visible` (a real
  `outline-style`, not `none`);
- the group is a flex column, `data-gap` flows through the composition layer,
  and `--_bf-form-group-gap` overrides it from the call site;
- `.bf-form-field` / `.bf-form-group` rules live in `@layer components` in the
  live CSSOM, no `bf-*` rule uses `:not()` with a complex selector (D-20.5), and
  neither component emits an inline `style` of its own.

Gates, all run in `bfna-website-nuxt/`:

```bash
npx nuxt typecheck   # ≤ 178 total, 0 in src/components/bf|src/types|src/composables/bf
npx nuxt generate
npx tsx scripts/check-probes.ts --only 34
npx tsx scripts/check-probes.ts
grep -q "<fieldset" .output/public/bf-probe/34-bf-form-field/index.html
grep -q "<legend"   .output/public/bf-probe/34-bf-form-field/index.html
```

plus the cumulative wireframe byte-identity diff, which must print nothing.

## Risks

| Risk | Handling |
|---|---|
| `<fieldset>` as a flex container — historically not supported | Chrome ≥ 83, Firefox and Safari all support it now; the probe **measures** `display`/`flex-direction` on the live element rather than assuming it. A rendered `<legend>` is not a flex item in any engine, which is why the gap rule is `> * + *` (the legend is the first child, so it never receives a top margin). |
| `useId()` collides or drifts between SSR and hydration | Nuxt's own `useId()` is SSR-stable. The probe asserts id uniqueness across the whole page and `label.control === control` **after hydration**, so a drift fails the run. |
| `aria-describedby` written as an empty string when neither hint nor error is set | The binding resolves to `undefined`, not `''`; the probe asserts the attribute is *absent* on the plain cases. |
| `base/forms.css` gives every `fieldset` a `margin-bottom` in `@layer defaults` | Out of scope for this issue and not this component's to unset — recorded in Decisions rather than silently overridden. |
| axe cannot run — no axe tooling in this repo | The spec anticipates it. The probe encodes the label-association and `aria-describedby`/`aria-invalid` assertions axe would make; the gap is recorded in Decisions. |
