# 40 — `bfCtaSection` — CTA band (subscribe variant scope-narrowed)

One-line objective: evolve `wfCtaSection.vue` into `bfCtaSection`, composing
`bfSection`, dropping the email-capture/subscribe variant entirely per D2.

## Context

Depends on 39 (`bfSection`, composed internally), 15 (`bfButton`, renders
the CTAs). Builds from `src/components/wireframe/wfCtaSection.vue` (as-built
A: 3 call sites, all non-subscribe — Microsite CTA + Participation path ×2
in `projects/[slug].vue`). Consumed by 52 (project-detail template, all 3
call sites). Provenance: BF-169; D2. **Scope-narrowed by D2** (issues.md
verbatim): "the email-capture/subscribe variant is dead — the `form` prop
does not exist in `bfCtaSection`, and no subscribe band is built anywhere
in this epic."

## Scope

- File: `src/components/bf/CtaSection.vue` → `<bfCtaSection>`.
- Props:
  ```ts
  interface Props {
    label?: string
    heading?: string
    message?: string
    ctas?: Cta[]   // from src/types/bf-contracts.ts (issue 02) — NOT the wf source's locally-declared WfCta
  }
  ```
  **No `form` prop.** This is a hard, checked deletion relative to the wf
  source, not an oversight.
- Composes `<bfSection :label="label" gap="s" :heading="heading">`
  internally. Renders conditional `<p data-measure="normal">{{ message
  }}</p>`, then a `.cluster` of `<bfButton>` per `ctas` entry — `to` →
  `NuxtLink`-backed button, `href` → external anchor-backed button with the
  `[data-external]` marker, first CTA `primary` unless `c.primary`
  overrides (`isPrimary` logic ported verbatim from the wf source).
- `Cta` type: `{ label: string, to?: string, href?: string, external?:
  boolean, primary?: boolean }` — imported from `bf-contracts.ts`, not
  redeclared locally (unlike the wf source's own `export interface WfCta`).

## Out of scope

- Any form, any email capture, the global subscribe band, the nav
  Subscribe button — all D2-killed, none exist anywhere in this
  component's source.
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables beyond `bfSection`'s and `bfButton`'s existing
  hooks.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/CtaSection.vue
grep -Lq "form" src/components/bf/CtaSection.vue
grep -Lq "<form" src/components/bf/CtaSection.vue
grep -q "Cta\[\]" src/components/bf/CtaSection.vue
```
Probe page `src/pages/bf-probe/40-bf-cta-section.vue` renders the three
real wireframe call sites' worth of props (Microsite CTA shape, Participation
path shape ×2) from fixtures alone:
```bash
grep -Lq "<form\|type=\"email\"" .output/public/bf-probe/40-bf-cta-section/index.html
```
The component source contains no `form` element and no `form` prop. Fails
today (no `bf/CtaSection.vue`), passes once done.

## Decisions

**D-40.1 — a label-only CTA renders `<button>`, not `<a href="#">`.**
Both Participation-path call sites pass `{ label }` alone
(`participation.ctas.map(label => ({ label }))`) — neither `to` nor `href`. The
wf source renders those as `<a :href="c.href ?? '#'">`: an element that
announces itself as a link, takes the tab order as a link, and then navigates to
the top of the page. `bfButton`'s own three-way branch (gh#24) resolves
"neither" to `<button type="button">`, and that is kept rather than papered over
with a synthetic `'#'`. It is the honest render of an action whose target has
not been decided yet, and the dataset can grow a `to` into it without the markup
changing shape. Probe 40 asserts the branch each of the three real call-site
shapes lands on.

**D-40.2 — `isPrimary` returns a `ButtonVariant`, not a raw attribute value.**
The condition is the wf source's, verbatim: `c.primary ?? idx === 0`, `??` and
not `||` so an explicit `primary: false` on the first entry really demotes it.
Only the return value changed — `bfButton` takes a typed `variant` prop where
the wf source wrote `:data-variant` directly, so this returns `'default'` where
upstream returned `undefined`. Identical render. The rule stays *per entry*
rather than "exactly one primary": a list whose second entry sets `primary` gets
two filled buttons, because the first entry's default is unconditional. That is
upstream's behaviour and narrowing it here would be a change nobody asked for.

**D-40.3 — no `<style>` block at all.**
The spec asks for "no new CSS variables beyond `bfSection`'s and `bfButton`'s
existing hooks". Shipping no stylesheet is the strongest available statement of
that — it is satisfied by construction rather than by inspection — and it
follows `bfPageHeader` (gh#47). Probe 40 asserts that no rule anywhere in the
loaded CSS selects `bf-cta-section`, so a stylesheet appearing later fails the
harness. D-20.5 is satisfied vacuously and still asserted across all `bf-*` CSS.

**D-40.4 — `padded` is not passed to `bfSection`.**
The wf source does not pass it either. A CTA band inherits the page's own band
rhythm; `bfPageHeader` is the one that asks for its own padding, and it does so
because its wf source does.

**D-40.5 (test-harness substitution, per the epic's residual #86 rule) — the
spec's `grep -Lq` acceptance lines cannot fail, and were replaced.**
The spec's acceptance block writes:

```bash
grep -Lq "form" src/components/bf/CtaSection.vue
grep -Lq "<form" src/components/bf/CtaSection.vue
grep -Lq "<form\|type=\"email\"" .output/public/bf-probe/40-bf-cta-section/index.html
```

`grep -L` prints the names of files *without* a match and exits `0` whenever the
file is readable — so each of those passes whether or not the string is present.
They are inert in both directions (D-37.5). Substituted with correct-polarity
checks, all run and recorded on the PR:

```bash
[ "$(grep -o -i form src/components/bf/CtaSection.vue | wc -l)" -eq 0 ]     # → 0
[ "$(grep -c '<form' .output/public/bf-probe/40-bf-cta-section/index.html)" -eq 0 ]
[ "$(grep -c 'type=.email.' .output/public/bf-probe/40-bf-cta-section/index.html)" -eq 0 ]
grep -q 'Cta\[\]' src/components/bf/CtaSection.vue
```

plus three runtime rows on probe 40 that read the live DOM
(`querySelectorAll('form, input[type=email]').length === 0`), the serialised
`documentElement.outerHTML`, and the absence of any `[type="submit"]` inside a
band. `npm run typecheck` in the spec is likewise the epic's no-new-errors gate
(`npx nuxt typecheck`, baseline 178 → 178, 0 in `src/components/bf|src/types`).

**D-40.6 — the probe never writes the literals it hunts for.**
A probe row's label is rendered into the page it then reads, so writing `<form`
or `type="email"` into a label would plant the very string the next row greps
for. `report()` happens to snapshot `outerHTML` before assigning `checks.value`,
so it would not actually have failed — but a check that depends on that ordering
is one refactor away from lying. The three literals are assembled from fragments
in `40-bf-cta-section.vue` and never appear in a rendered string.

