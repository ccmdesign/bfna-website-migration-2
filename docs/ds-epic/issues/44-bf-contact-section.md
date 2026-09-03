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

### D-44.1 — keep-vs-decompose, resolved: **one component, form composed from the field molecules**

*This is the decision `component-inventory-v2.md` §5 / §4 E4 left open and this
issue exists to close, and its text is the acceptance line "the decision is
written to `docs/ds-epic/issues/44-bf-contact-section.md`". Recorded verbatim.*

> **`bfContactSection` is kept as one component — matching the as-built reality
> the inventory documents — with the contact form composed internally from
> `bfFormField`/`bfFormGroup` rather than hardcoded `<label><input>` pairs.**
>
> The two options the inventory names are not in tension once the question is
> asked at the right altitude. "Decompose into `bfSection` + `bfFormField`" was
> never a request to delete this band; it was a request that the *form* stop
> being three hand-rolled, near-identical `<label class="stack">` blocks with an
> implicit association and nowhere to put a hint or an error. Composing
> `bfFormGroup` + three `bfFormField` **inside** a component that still exists
> satisfies that request in full, and it satisfies the "keep" half at the same
> time. So the decision is not a compromise between the two readings; it is the
> only shape that honours both, which is why the spec's own Scope section
> pre-selected it.
>
> Three things decide it in favour of keeping the band:
>
> 1. **The composition is not incidental.** A form beside a visit-us block, in a
>    `switcher` that stacks under its threshold, with the band label and the
>    two-`<h2>` outline the wireframe was approved at, is a *layout decision*
>    with an answer. Decomposing pushes that answer into every page that wants a
>    contact band — today `/about#contact` (issue 53), tomorrow whatever else —
>    and the second copy is where the two drift.
> 2. **The state has to live somewhere, and it should live once.**
>    `bfFormField` is controlled by design: `modelValue` in,
>    `update:modelValue` out, never holding the string itself. A decomposed
>    version makes every consuming page declare three refs and three handlers
>    for a form that submits nowhere. One band declares them once.
> 3. **It is what was built, and the wireframe is the specification** (BRIEF §1).
>    `wfContactSection.vue` is a standalone component; the inventory's own note
>    is that it "was actually built as a standalone component, not decomposed as
>    v1 expected". Reversing that needs evidence from the prototype, and the
>    prototype says the opposite.
>
> What is **not** kept from the wireframe is the form's internals: the three
> `<label class="stack" data-gap="2xs">Name<input></label>` idioms are gone,
> replaced by `bfFormField`, whose explicit `for`/`id` association survives
> anything being added between the label and the control and gives a hint and an
> error somewhere to attach. That is the decomposition half, and it is real.

Consequence for issue 53 (`/about`): the page mounts `<bfContactSection>` and
passes copy. It does not assemble a form.

### D-44.2 — one prop for the address and its `mailto:`, one for the heading and its `<legend>`

The spec lists four props. Two of them each serve two places, deliberately:

- `email` is both the `mailto:` target and the link's visible text. Splitting
  them would let an anchor say one address and send mail to another — a defect
  no reader can see.
- `heading` is both the form column's `<h2>` and the `<fieldset>`'s `<legend>`.
  The spec's own example writes `<bfFormGroup legend="Contact">` under a
  `Contact` heading, so the rendered output is the spec's literal; binding them
  to one prop is what stops them drifting. The two names do read the same, which
  is redundant rather than wrong: the `<h2>` names the column in the document
  outline and the `<legend>` names the same controls in the accessibility tree,
  and a group whose name *contradicts* the heading above it would be worse than
  one that repeats it. A caller that wants them to differ wants a fifth prop,
  and can have one when a caller actually does.

The organisation's name (`Bertelsmann Foundation North America`) stays a
literal. The spec names `email` and `address` as the two placeholder strings
"until the Directus contact singleton exists"; the foundation's own name is not
pending content, and making it a prop would offer a caller a decision with no
second answer.

### D-44.3 — the three refs are UI state, not data (D8 holds)

`bfContactSection` declares `ref('')` three times, one per control. D8 forbids a
`bf-*` component **reading content** — `queryCollection`, a data composable, a
store — and this component reads nothing. The refs are the transient contents of
three text boxes: they have no meaning outside the band, no source outside the
keyboard, and no consumer at all while there is no endpoint. Every word of
*copy* still arrives as a prop. (The alternative — hoisting them to the page —
is the decomposition D-44.1 declined, for reason 2 above.)

### D-44.4 — residual #155 is neutralised locally, not fixed in `base/forms.css`

`base/forms.css` gives **every** `<fieldset>` a `margin-bottom: var(--space-m)`
in `@layer defaults` ([#155](https://github.com/ccmdesign/bfna-website-migration-2/issues/155),
raised by gh#43 and still open). Inside this band that margin lands below the
field group and above the submit row, so the form column carries a gap the
`.stack` did not ask for and `gap="l"` is no longer the only rhythm on the page.

It is neutralised **here**, with one declaration in `@layer components`:

```css
@layer components {
  .bf-contact-section fieldset { margin-block-end: 0; }
}
```

and **not** fixed in `forms.css`, for the reason the residual itself gives:
`forms.css` is a defaults-layer file serving every `<fieldset>` in the app,
including those still rendered under `layouts/legacy-base.vue`, so changing it
is a defaults-layer decision that wants a sweep of those pages first — out of
scope for a component issue, exactly as gh#43 concluded. **Residual #155 stays
open.**

Two details: `margin-block-end` rather than `margin-bottom`, because the
component's stylesheet is logical-property throughout and the logical and
physical longhands cascade together (one computed value, resolved by layer
order — `components` outranks `defaults`); and the probe **measures** the
fieldset's computed `margin-bottom` against a bare reference `<fieldset>` on the
same page that still carries the defaults margin, so the row proves the local
rule is doing work rather than that the defaults rule has quietly vanished.

### D-44.5 — no new CSS variable, and the stylesheet is unscoped

The spec asks for "no new CSS variables beyond `bfSection`'s/`bfFormField`'s/
`bfFormGroup`'s existing hooks". The one rule above declares a literal `0` and
introduces no `--_bf-contact-section-*` hook: a hook whose only sensible value
is zero is a variable nobody would set. No colour of any kind is declared
(BRIEF §5 rule 2, DoD-6), and no `:not()` appears at all (D-20.5).

The `<style>` block is **unscoped**, the `bfCard` (gh#41) / `bfFormGroup`
(gh#43) precedent. Vue's scoped CSS does stamp a child component's *root*
element with the parent's scope id, so a `scoped` rule would match the
`<fieldset>` today — but only for as long as the `<fieldset>` stays
`bfFormGroup`'s root element, which is a fact about another component's template
that this file cannot hold still. Every rule is anchored on
`.bf-contact-section`, so going global costs nothing.

### D-44.6 — the vitest substitution, and the axe gap

**Vitest.** The harness on `dev` is broken and pre-existing
([#86](https://github.com/ccmdesign/bfna-website-migration-2/issues/86)); this
issue does not fix it and does not depend on it. The equivalent-strength
substitute is the probe page under the #109 harness:

```bash
cd bfna-website-nuxt
npx nuxt typecheck                        # gate: no NEW errors (baseline 178, residual #71)
npx nuxt generate                         # never `npm run generate`
npx tsx scripts/check-probes.ts --only 44 # 33 rows, exit 0
npx tsx scripts/check-probes.ts           # 36 probes, 1571 rows, exit 0
```

**Typecheck.** `npm run typecheck` in the spec's acceptance block cannot pass on
`dev` (~178 legacy errors, residual #71). The gate applied instead is the epic's:
the total is unchanged at **178**, and **0** of them are under
`src/components/bf`, `src/types`, `src/composables/bf` or `content.config`.

**axe.** No axe tooling is wired into this repo, unchanged since issue 34, and
adding it would be a tooling change smuggled into a component issue. The probe
encodes the checks axe would actually run against this page instead — every
`<label>` resolved to one of its band's own controls through
`HTMLLabelElement.control` (the browser's own resolution of `for`/`id`, not a
string comparison of two attributes that could both be wrong in the same way),
every id on the page unique across all five bands, and the control group named
by a real `<legend>`. The gap is recorded here rather than papered over, per
issue 34's own note.

### D-44.7 — what the typing row can and cannot prove

`bfFormField` is controlled and this component holds the three strings in refs
of its own, so the model is **not reachable from the probe page**. A DOM-only
assertion therefore cannot separate a correctly wired `v-model` from a field
bound to a constant whose emit is dropped: neither re-renders after a silent
write, so the typed text survives either way. The probe asserts the two things
it can, which between them cover the defect shapes that actually occur — the
typed value survives the tick on all three controls, and typing into one control
leaves the other two empty (which a single shared ref behind all three fields
would fail). The decisive model round trip is proven one level down, at the
`bfFormField` boundary, by probe 34, whose model lives in its page. Stated in
the probe's own header rather than left for a reader to discover.

### D-44.8 — `Props` is declared in the component, not in `bf-contracts.ts`

BRIEF §5 rule 11 governs **shared** types. Nothing outside
`components/bf/ContactSection.vue` names this shape — issue 53's page passes
strings — so the interface is local, the same call `bfCtaSection` (gh#49),
`bfPageHeader` (gh#47), `bfBreadcrumb` and the six card wrappers already make,
and the shape the spec itself writes (`interface Props`). If a second consumer
ever needs the type, it moves to `src/types/bf-contracts.ts` and nowhere else.

Two of the three internal refs are named `nameValue` / `emailValue` /
`messageValue` rather than `name` / `email` / `message`: a bare `const email` in
`<script setup>` shadows the `email` **prop** of the same name for the whole
template, so `{{ email }}` in the `mailto:` link would have rendered the empty
contents of the input.
