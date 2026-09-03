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

**D-34.1 — explicit `for`/`id` replaces the wireframe's implicit wrapping
label, and that is the only structural change.** `wfContactSection.vue:8-10`
writes `<label class="stack" data-gap="2xs">Name<input type="text"></label>` —
the control is a *descendant* of the label, which is valid HTML and a real
association. It is replaced here for three reasons, none of them cosmetic.
(1) Text inside `<label>` is part of the control's accessible **name**, so a
hint concatenated into it reads as *"Email We never share this"* and an error
reads as *"Email Enter a valid email address"* — and the name is announced on
every focus, so the error is repeated for ever rather than described once.
`aria-describedby` is the property for supporting text, and it needs ids, which
needs the control out of the label. (2) Implicit association holds only while
the control is a descendant: the first time anything wraps it — a character
counter, a clear button, a prefix row — the label still *looks* right and names
nothing. (3) A `<legend>` plus an implicit label is ambiguous about which text
is the group's and which is the field's, in exactly the composition
`bfFormGroup` exists to make. The `.stack | data-gap="2xs"` composition and its
value are kept verbatim from the wireframe.

**D-34.2 — `aria-describedby` is a join, never a choice.** When both `hint` and
`error` are set the attribute carries **both** ids, space-separated and hint
first (reading order, and the order a screen reader announces them in). The
failure this rules out is the common one: `error ? errorId : hintId` drops the
hint from the accessible description at precisely the moment a user is failing
to fill the field in. When neither is set the binding resolves to `undefined`,
not `''` — an empty `aria-describedby` is a reference to nothing, which some
assistive technology reports as a broken relationship rather than an absent
one. `aria-invalid` is `"true"` or absent, never `"false"`.

**D-34.3 — the error colour is `--color-error`, and both names survived issue
06.** `tokens/semantic-colors.css:72-73` now declares `--color-fail:
var(--color-red)` and then `--color-error: var(--color-fail)` — issue 06's
ordering fix put the referent ahead of the alias rather than removing either
name. `--_bf-form-field-error-color` reads `--color-error`: it is the semantic
name for *this* intent and resolves to the same paint, so nothing new enters
the colour graph (DoD-6). The probe measures the resolved `color` of the error
text against a reference element rather than string-matching the token.

**D-34.4 — the focus ring is declared locally, because the global one has not
landed.** `base/forms.css` (`@layer defaults`) styles form controls and their
`:focus` state by writing `outline: none` and drawing the ring with a
`box-shadow` alone — which forced-colors mode drops, leaving no focus indicator
at all (WCAG 2.4.7). The global `:focus-visible` rule for form controls
(gh#146) is **not** on `dev` at the time of this issue, so `bfFormField`
declares its own `:focus-visible` in `@layer components`: a real `outline` plus
the `--outline-focus` halo, coloured through `--_bf-form-field-focus-color`.
That hook resolves to `--color-text`, not `currentcolor` — the gh#24-P2-1
finding: the ring is painted outside the control, on the page ground, so a
control whose own colour is the light one would otherwise paint a light ring on
a light page (WCAG 1.4.11). When #146 lands, this rule becomes redundant rather
than wrong; removing it is a one-line follow-up, not a migration.

**D-34.5 — `--_bf-form-group-gap` chains *through* the composition layer.**
`.stack` spaces its children with `margin-block-start` on `> * + *` in
`@layer composition`, and `@layer components` outranks that wholesale. A flat
`--_bf-form-group-gap: var(--space-s)` would therefore have beaten
`.stack[data-gap="…"]` and made the documented `data-gap` API inert on this
component — including the `data-gap="s"` in its own template. The hook is
`var(--_stack-space, var(--space-s))` instead, consumed by
`.bf-form-group > * + *`: `data-gap`/`data-space` from a consumer flows in
through the composition layer, and a consumer setting `--_bf-form-group-gap`
directly still overrides it. This is the gh#29 (`bfByline`) and gh#30
(`bfFilterBar`) lesson restated for `.stack`, whose mechanism is a margin
rather than a `gap` — which is also why the rule *replaces* the sibling margin
instead of adding a `gap` that would have compounded with it. Probe 34 measures
all three states (`data-gap="s"`, `data-gap="l"`, and a call-site override to
`0px`) against reference elements.

**D-34.6 — `FormGroup.vue`'s style block is unscoped; `FormField.vue`'s is
scoped.** Slot content is compiled in the *parent's* scope and carries the
parent's `data-v-…` id. A `scoped` block in `FormGroup.vue` would have emitted
`.bf-form-group > * + *[data-v-formgroup]` — a selector that cannot match a
single field the caller passed in — and the gap hook would have shipped doing
nothing at all. Unscoped, on the `bfCard`/gh#41 precedent; every selector in
the file is already `.bf-form-group`-prefixed. (`:slotted()` does reach direct
slot children, but it takes a compound selector and the rule that needs it is
an adjacent-sibling one — `:slotted(* + *)` is not a selector.) `FormField.vue`
styles only elements it renders itself, so it stays `scoped`.

**D-34.7 — `$attrs` is split: the control gets it, the wrapper gets
`class`/`style`.** `inheritAttrs: false`, with `$attrs` minus `class`/`style`
bound on the `<input>`/`<textarea>`. Every attribute a caller would actually
pass to a form field — `autocomplete`, `placeholder`, `rows`, `maxlength`,
`inputmode`, `name`, `disabled` — belongs on the control, and the root here is
a layout wrapper nobody has a reason to address; `class` and `style` are the
exception, because that is where a caller's layout class means something. This
is also why the wireframe's `rows="4"` needs no prop. The omission is done by a
plain function taking the template's `$attrs`, **not** a `computed` over
`useAttrs()`: property reads on the instance's `attrs` object are only tracked
as a reactive dependency in development builds, so a `computed` over it can
serve a stale value in production when a caller changes an attribute.

**D-34.8 — acceptance is the probe, not vitest, and axe still cannot run.**
Two substitutions, both forced by the state of `dev` rather than chosen:

- The vitest harness on `dev` is broken and pre-existing (residual #86), so
  acceptance is `src/pages/bf-probe/34-bf-form-field.vue` under
  `npx tsx scripts/check-probes.ts --only 34` (37 rows) plus the full run
  (26 probes, 1189 rows) — the gh#20–#42 precedent and the #109 harness
  decision.
- **The spec's "axe reports no violations" could not be executed.** No axe
  tooling is wired into this repo — the digest's own "Known Gaps" anticipated
  this — and adding it here would be a tooling change smuggled into a component
  issue. What the probe encodes instead is the set of checks axe would have run
  against this page: label association resolved through
  `HTMLLabelElement.control` (the browser's own resolution, not a string
  comparison of two attributes that could both be wrong the same way), every
  `aria-describedby` token resolving to an element that exists, `aria-invalid`
  carrying only valid values and only where an error is set, id uniqueness
  across the whole document, and a **measured** visible focus indicator. This
  is narrower than axe in coverage and stronger than axe on the four things
  this component is actually about. **The gap stands and is recorded here**;
  wiring axe is a repo-level task for a tooling issue, not for this one.

**D-34.9 — the demo mounts every field inside one `bfFormGroup`, and the probe
has no case switcher.** The spec's demo requirement is literal, and it is the
interdependent-components rule (BRIEF §5 rule 5) doing its job: the pair was
allowed to be one issue on the argument that neither half can be demonstrated
alone. A consequence worth stating is that the page holds exactly **one**
`<fieldset>` and **one** `<legend>`, which is what makes the spec's own
`grep -q "<fieldset"` / `grep -q "<legend"` checks statements about the
component rather than about the probe's chrome — so probe 33's `<fieldset>` of
radio buttons is deliberately not reused here. All seven states are mounted at
once instead, which they can be: unlike `bfEmptyState`, nothing here renders an
`<h1>`.

**D-34.10 — noticed but not touched: `base/forms.css` gives every `<fieldset>`
a `margin-bottom: var(--space-m)`** in `@layer defaults`. That is layout
leaking out of a component-agnostic default, and it means a `bfFormGroup`
arrives with a bottom margin its caller did not ask for. It is not overridden
here: unsetting it would change the rendering of every other fieldset the
defaults layer serves, which is out of scope for a component issue, and the
frozen wireframe skin is not affected either way. Raised as a residual rather
than fixed in place.

**D-34.11 — typecheck gate.** Baseline on `dev` before any edit: **178**
`error TS` lines. After: **178** — no new errors — and **0** in
`src/components/bf`, `src/types`, `src/composables/bf`, `content.config` (and
0 in `src/pages/bf-probe`). `npx nuxt generate` exits 0 over 917 routes.
`npm run generate` was never used (it invokes the Directus importer).
