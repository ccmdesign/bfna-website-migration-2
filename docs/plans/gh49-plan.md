# Plan — gh#49 / issue 40 · `bfCtaSection`

**Spec:** [`docs/ds-epic/issues/40-bf-cta-section.md`](../ds-epic/issues/40-bf-cta-section.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Branch:** `feature/gh49-bfctasection` · **Base:** `dev`

## Objective

Evolve `components/wireframe/wfCtaSection.vue` (frozen, D2 — read, never edited) into
`src/components/bf/CtaSection.vue` → `<bfCtaSection>`, composing `bfSection` (gh#48) and
rendering one `bfButton` (gh#24) per CTA. **D2 kills the email-capture/subscribe variant
outright**: no `form` prop, no `<form>`, no `<input type="email">`, and — because the spec's
own acceptance greps the *file* for the string `form` — the word must not appear anywhere in
the source, comments included.

## Approach

1. **Types.** `Cta` already exists in `src/types/bf-contracts.ts` (line 601) with exactly the
   shape the spec names: `{ label, to?, href?, external?, primary? }`. Nothing to add. The
   component imports it as a type and **never** redeclares it (unlike the wf source's own
   `export interface WfCta`).
2. **Component.** `src/components/bf/CtaSection.vue`:
   - Local `interface Props { label?, heading?, message?, ctas? }` — the `bfPageHeader`
     precedent (gh#47): the *shared* shapes live in `bf-contracts.ts`, a component's own
     four-field prop bag does not.
   - `withDefaults(…, { label: 'CTA', ctas: () => [] })` — the wf source's defaults, kept.
   - Template: `<bfSection :label="label" gap="s" :heading="heading">` (prop names read from
     `Section.vue` as built, not assumed) → conditional `<p data-measure="normal">` →
     `<div v-if="ctas.length" class="cluster" data-gap="s">` of `<bfButton>`.
   - `isPrimary(c, idx)` ported: the condition `c.primary ?? idx === 0` is verbatim; only the
     return value changes from `'primary' | undefined` (a raw `data-variant` binding) to a
     `ButtonVariant` (`'primary' | 'default'`), because `bfButton` takes a typed `variant`
     prop rather than the attribute directly.
   - `to` / `href` / `external` are handed to `bfButton` and it resolves the element — the
     three-way branch is stated once, there, not re-decided here.
   - **No `<style>` block.** Same as `bfPageHeader`: the spec forbids new CSS variables, and
     shipping no stylesheet is the strongest available statement of that. The probe asserts
     no rule anywhere selects `bf-cta-section`.
3. **Probe.** `src/pages/bf-probe/40-bf-cta-section.vue`, `layout: 'bf-probe'`, harness DOM
   convention (`[data-probe-verdict]` root, `[data-probe-row][data-ok]` rows) per
   `docs/decisions/probe-harness.md`. Fixtures = the three real call-site shapes from
   `pages/wireframes/projects/[slug].vue` (Microsite CTA; Participation path ×2), plus a
   fourth mixed case that exercises an internal `to` CTA and a `primary` override — the two
   contract branches the three real shapes happen not to cover.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/components/bf/CtaSection.vue` | new |
| `bfna-website-nuxt/src/pages/bf-probe/40-bf-cta-section.vue` | new |
| `bfna-website-nuxt/src/types/bf-contracts.ts` | none — `Cta` already present |
| `docs/ds-epic/issues/40-bf-cta-section.md` | Decisions appended |
| `docs/plans/gh49-plan.md` | this file |

Nothing under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue` or
`public/css/wireframe.css` is touched.

## Test strategy

Runtime assertions on the probe (the harness runs them headlessly — `check-probes.ts`),
because the vitest harness on `dev` is broken and pre-existing (residual #86, not this
issue's to fix). The spec's `grep -Lq` lines are **not** used as written: `grep -L` prints
filenames and always exits 0 when the file is readable, so `grep -Lq "form" file` passes
whether or not the word is there — it cannot fail (D-37.5). Substituted with `grep -c` /
`grep -q` assertions of the right polarity, run inline and recorded.

Probe rows, in order of what the acceptance actually asks:

- **no `<form>`, no `type="email"`, anywhere on the page** — asserted on the live DOM
  (`querySelectorAll('form, input[type=email]').length === 0`) *and* on the serialised
  `documentElement.outerHTML`, which is what the prerendered file the spec greps contains.
- **first CTA is primary unless `primary` overrides** — `data-variant` read off each rendered
  `bfButton`, per case.
- **external CTA** renders `<a>` with `[data-external]` **and** the `↗` affordance —
  `getComputedStyle(el, '::after').content`, i.e. the marker really paints, not just that
  the attribute is present.
- **internal CTA** renders an `<a href="/…">` (NuxtLink) rather than a `<button>`.
- composition: root is `bfSection`'s `<section class="bf-cta-section bf-section">` with
  `data-label`, inner box `center | stack` with `data-gap="s"`, `<h2>` from `heading`.
- `message` → exactly one `<p data-measure="normal">`; absent → none.
- no prop name leaks onto the DOM as an attribute (`bfSection`'s `$attrs` allow-list).
- no `:not()` with a complex selector anywhere in `bf-*` CSS (D-20.5).
- no rule anywhere selects `bf-cta-section`.

Gates, all run in `bfna-website-nuxt/`:

```bash
npx nuxt typecheck   # ≤ 178 total (baseline), and 0 in src/components/bf|src/types|composables/bf|content.config
npx nuxt generate    # exit 0
npx tsx scripts/check-probes.ts --only 40
npx tsx scripts/check-probes.ts          # full suite, no regression in probes 03–39
git diff --stat <pre-epic-base> HEAD -- …/pages/wireframes …/components/wireframe …/layouts/wireframe.vue …/public/css/wireframe.css   # prints nothing
```

## Risks

1. **The `form` substring.** `platform`, `information`, `perform`, `transform`, `formal`,
   `conform` all contain it, and this component's natural prose ("the subscribe variant is
   gone") invites every one of them. Mitigated by a `grep -c form` on the finished file as a
   hard gate, and by writing the deletion rationale with vocabulary that avoids the stem.
2. **Label-only CTAs.** Both Participation-path call sites pass `{ label }` with neither `to`
   nor `href`. The wf source rendered those as `<a href="#">`; `bfButton` resolves them to
   `<button type="button">`. That is a real behaviour change and it is the better one — a
   link to `#` is a control that announces itself as a link and goes nowhere. Not papered
   over with a synthetic `href`; recorded in the spec's Decisions and asserted by the probe.
3. **`bfSection` prop names.** Read from `Section.vue` as built (`label`, `gap`, `heading`,
   `layout`, `measure`, `padded`, `fullWidth`) rather than from the spec's prose. `padded` is
   deliberately **not** passed — the wf source does not pass it either.
4. **Probe visibility** (D-31.6) — not applicable here; this probe has no `<details>` and
   asserts no shown/hidden state.
