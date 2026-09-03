# 44 — `bfContactSection` — contact section (resolves keep-vs-decompose)

One-line objective: evolve `wfContactSection.vue` into `bfContactSection`,
composing `bfSection[layout=switcher]`, with the form built from
`bfFormField`/`bfFormGroup`, and resolve the open keep-vs-decompose
decision in this spec.

## Context

Depends on 39 (`bfSection`), 34 (`bfFormField`/`bfFormGroup`), 15
(`bfButton`, the submit action). Builds from
`src/components/wireframe/wfContactSection.vue` (as-built: form + visit-us
block, composes `wfSection` internally — "was actually built as a
standalone component, not decomposed as v1 expected"). Consumed by 53
(`/about` `#contact`). Provenance: v2 §4 E4, no Plane BF-id (proposed add).
**Open decision to resolve here** (component-inventory-v2 §5, §4 E4): keep
`bfContactSection` as one component (matching the as-built reality) vs.
decompose into `bfSection` + `bfFormField` per v1's original plan.

## Scope

- File: `src/components/bf/ContactSection.vue` → `<bfContactSection>`.
- **Decision (record verbatim in this file's Decisions section)**: keep
  it as **one component** — matching the as-built reality the inventory
  documents — with the contact **form composed internally from
  `bfFormField`/`bfFormGroup`** rather than hardcoded `<label><input>`
  pairs. This satisfies both halves of the open call: "keep as one
  component" (as-built) *and* "form composed from field molecules" (v1's
  original intent) simultaneously, per the issue's own acceptance line in
  `issues.md` ("the decision is written to
  `docs/ds-epic/issues/44-bf-contact-section.md`"). Write the rationale
  into Decisions, not just this default.
- Props (real content pending — placeholders per D5/BRIEF §5.10 until
  content lands):
  ```ts
  interface Props {
    email?: string           // default 'info@bfna.org', placeholder until real copy
    heading?: string          // default 'Contact'
    visitHeading?: string     // default 'Visit us'
    address?: string          // placeholder text until Directus contact singleton exists
  }
  ```
- Composes `<bfSection label="Contact" layout="switcher" gap="l">`
  internally. Left column: `<bfFormGroup legend="Contact">` containing
  three `<bfFormField>` instances (Name/text, Email/email, Message/
  textarea) plus a `<bfButton type="submit">Send message</bfButton>` —
  **no** `@submit` handler beyond `.prevent` (no endpoint exists yet, per
  Out of scope). Right column: visit-us block (`heading` + `address`
  placeholder), matching the wf source's static text.
- Copy supplied by props rather than hardcoded — the `email`/`address`
  placeholders replace the wf source's literal `info@bfna.org` and
  `[street address — Directus contact singleton]` strings.

## Out of scope

- Form submission, an endpoint, spam protection (no backend exists; this
  is presentational only, `@submit.prevent`).
- Real contact copy — props take placeholders until content lands (D5).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables beyond `bfSection`'s/`bfFormField`'s/`bfFormGroup`'s
  existing hooks.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/ContactSection.vue
grep -q "bfFormField\|BfFormField" src/components/bf/ContactSection.vue
grep -q "bfFormGroup\|BfFormGroup" src/components/bf/ContactSection.vue
```
Probe page `src/pages/bf-probe/44-bf-contact-section.vue` renders the
section from props alone:
```bash
grep -q "<fieldset" .output/public/bf-probe/44-bf-contact-section/index.html
```
Every field is label-associated (via `bfFormField`'s own `id`/`for` wiring,
verified transitively) and axe-clean (documented as manual/CI-gap per issue
34's own note if axe tooling is unavailable). The keep-vs-decompose
decision is written into this file's Decisions section. Fails today (no
`bf/ContactSection.vue`), passes once done.

## Decisions

_Runner appends here._
