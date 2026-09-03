# Plan — gh#53 / issue 44 · `bfContactSection`

**Spec:** [`docs/ds-epic/issues/44-bf-contact-section.md`](../ds-epic/issues/44-bf-contact-section.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Branch:** `feature/gh53-bfcontactsection` off `dev`

## Approach

One component, `src/components/bf/ContactSection.vue` → `<bfContactSection>`, composing
`bfSection[layout=switcher]` with two columns:

- **left** — `<form @submit.prevent>` wrapping `<bfFormGroup legend>` with three
  `<bfFormField>` (Name/text, Email/email, Message/textarea) plus
  `<bfButton type="submit">`;
- **right** — the visit-us block (`visitHeading` + organisation line + `address`).

The keep-vs-decompose decision the spec leaves open is **resolved as "keep as one
component, with the form composed internally from the field molecules"** and written
verbatim into the spec's Decisions section — that is half of this issue's acceptance.

Field values are three page-local `ref<string>`s inside the component. That is UI state,
not data: `bfFormField` is a controlled component (`modelValue` in, `update:modelValue`
out) and something must hold the string. It reads no collection and no composable, so D8
(presentational-only) holds.

`@submit.prevent` and nothing else — no endpoint, no handler, no validation, no spam
protection (spec § Out of scope).

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/components/bf/ContactSection.vue` | **new** — the component |
| `bfna-website-nuxt/src/types/bf-contracts.ts` | **new interface** `ContactSectionProps` (BRIEF §5 rule 11 — shared types live only here) |
| `bfna-website-nuxt/src/pages/bf-probe/44-bf-contact-section.vue` | **new** — the probe, `layout: 'bf-probe'`, harness DOM convention |
| `docs/ds-epic/issues/44-bf-contact-section.md` | Decisions section appended |
| `docs/plans/gh53-plan.md` | this file |

Nothing under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue` or
`public/css/wireframe.css` is touched (D2). `base/forms.css` is **not** edited — see the
risk below.

## Props

```ts
interface ContactSectionProps {
  email?: string         // default 'info@bfna.org'
  heading?: string       // default 'Contact'
  visitHeading?: string  // default 'Visit us'
  address?: string       // placeholder until the Directus contact singleton exists
}
```

Every string the wf source hardcodes now arrives as a prop, with the wf literal as the
default so the band renders at parity from props alone.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so acceptance is
the probe page under the #109 harness, per the gh#20–#43 precedent:

```bash
cd bfna-website-nuxt
npx nuxt typecheck            # NO NEW ERRORS gate: baseline 178, none in src/components/bf
npx nuxt generate             # never `npm run generate`
npx tsx scripts/check-probes.ts --only 44
npx tsx scripts/check-probes.ts          # full regression run
```

Probe rows, from props alone:

1. the band is `bfSection` — one `<section class="bf-section bf-contact-section">`,
   `data-label="Contact"`, inner box `center | switcher`, `data-gap="l"`;
2. exactly one `<fieldset>` renders, with its `<legend>`;
3. **every control has a `for`-matched label**, resolved through
   `HTMLLabelElement.control` (the browser's own resolution, not a string compare of two
   attributes that could be wrong in the same way) — transitively via `bfFormField`;
   every id on the page is unique;
4. the three controls are `input[type=text]`, `input[type=email]`, `textarea`;
5. **typing into a field updates its value** — a real `input` event on each control, then
   the control's own `value` read back after a tick (the round trip through
   `update:modelValue` and back down through `:model-value`);
6. **submit does not navigate** — a real click on the submit button, then the document's
   URL and a `beforeunload`/`submit`-default sentinel are unchanged;
7. **two columns at 1200px, one at 400px** — the `.switcher` children's `offsetTop`
   compared in an isolated same-origin iframe at each width (the harness has one viewport,
   so the two widths are measured in frames rather than by resizing the page);
8. copy is prop-driven: a second instance with all four props overridden renders the
   overridden strings and no wf literal;
9. cascade hygiene — every `.bf-contact-section` rule is inside `@layer components`, and
   no `bf-*` rule uses `:not()` with a complex selector (D-20.5).

axe is still not wired into this repo (issue 34's own note). Rows 2–4 encode the checks
axe would actually run here — label association, id uniqueness, group naming — and the
gap is recorded in the spec's Decisions rather than papered over.

## Risks

1. **Residual #155 — `base/forms.css` gives every `<fieldset>` a `margin-bottom` in
   `@layer defaults`.** Inside a `.switcher` that margin adds to the column and fights the
   `gap="l"` this band asks for. `forms.css` is a defaults-layer file and out of scope for
   a component issue (the residual says so explicitly), so it is **neutralised locally**:
   one rule on `.bf-contact-section fieldset` in `@layer components`, noted in the source
   and in Decisions. The residual stays open.
2. **`bfButton` inside a form.** `bfButton` writes `type="button"` *before*
   `v-bind="$attrs"`, so a caller's `type="submit"` wins — verified by reading
   `Button.vue`, and asserted by a probe row rather than assumed.
3. **The switcher's two columns.** `.switcher > *` gets
   `flex-basis: calc((threshold - 100%) * 999)` with a 768px default threshold, so the
   break happens between 768px and the container width — the probe measures rather than
   pins a breakpoint.
4. **No new CSS variable** beyond the one `--_bf-contact-section-*` hook the fieldset
   neutralisation needs, and no new colour (DoD-6): the component paints nothing.
