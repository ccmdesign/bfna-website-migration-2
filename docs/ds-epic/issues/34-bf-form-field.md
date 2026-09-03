# 34 — `bfFormField` + `bfFormGroup` — form molecules (build together)

One-line objective: new molecules `bfFormField` and `bfFormGroup`, built and
demoed together, consolidating the three hardcoded form idioms in the
wireframe contact section.

## Context

Depends on 02 (`bf-scaffold`). Builds from the three hand-rolled label/input
idioms in `src/components/wireframe/wfContactSection.vue:8-10`: `<label
class="stack" data-gap="2xs">Name<input type="text"></label>` (and Email,
Message/textarea — three near-identical, non-label-for-associated
patterns). Consumed by 44 (`bfContactSection`, composes both). Provenance:
BF-207. **Interdependent-components rule (BRIEF §5, digest A)**: these two
components are the one explicitly named exception allowing a bundled issue
— build and demo both together, in one file each, on one demo page.

## Scope

- Files: `src/components/bf/FormField.vue` → `<bfFormField>`,
  `src/components/bf/FormGroup.vue` → `<bfFormGroup>`.
- `bfFormField` props:
  ```ts
  interface Props {
    label: string
    modelValue: string
    type?: string        // 'text' | 'email' | 'textarea' | ... — default 'text'
    required?: boolean
    hint?: string
    error?: string
  }
  // emits
  (e: 'update:modelValue', value: string): void
  ```
  Generates a stable `id` (e.g. `useId()`) linking: `<label :for="id">` to
  the control, the control's `aria-describedby` to the hint element's id
  (when `hint` is set), the control's `aria-invalid="true"` plus a second
  `aria-describedby` reference to the error element's id (when `error` is
  set) — both hint and error ids are appended to `aria-describedby` when
  both are present (space-separated per the ARIA spec, not either/or).
  Renders `<textarea>` when `type === 'textarea'`, `<input :type="type">`
  otherwise.
- `bfFormGroup` props:
  ```ts
  interface Props {
    legend: string
  }
  ```
  Renders `<fieldset class="bf-form-group | stack" :data-gap="...">
  <legend>{{ legend }}</legend><slot /></fieldset>` — stacked spacing from
  `data-gap` (issue 03's fix), default slot for `bfFormField` instances.

## Out of scope

- Validation logic (no wireframe evidence of client-side validation rules
  — `error`/`hint` are caller-supplied strings, not computed here).
- Submission (no `@submit` handling, no `form` element — that belongs to
  the organism composing these, issue 44).
- A form organism itself (issue 44 owns assembling `bfFormField`/
  `bfFormGroup` into `bfContactSection`).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variables `--_bf-form-field-border-color`, `--_bf-form-field-error-
  color` (sourced from existing semantic error token — check `token-hygiene`
  issue 06's `error→fail` ordering fix before naming this; do not introduce
  a new error colour), `--_bf-form-group-gap`. No new colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/FormField.vue
test -f src/components/bf/FormGroup.vue
grep -q "aria-describedby" src/components/bf/FormField.vue
grep -q "aria-invalid" src/components/bf/FormField.vue
```
Demo page `src/pages/bf-probe/34-bf-form-field.vue` shows text/email/
textarea fields in default, required, hint and error states, **all inside
one `bfFormGroup`** (interdependent-components demo requirement):
```bash
grep -q "<fieldset" .output/public/bf-probe/34-bf-form-field/index.html
grep -q "<legend" .output/public/bf-probe/34-bf-form-field/index.html
```
axe reports no violations against the demo page (documented as a manual/CI
check — no axe tooling wired into this repo yet per the digest's "Known
Gaps"; note that gap in Decisions if axe cannot actually run). Fails today
(no `bf/FormField.vue`/`bf/FormGroup.vue`), passes once done.

## Decisions

_Runner appends here._
