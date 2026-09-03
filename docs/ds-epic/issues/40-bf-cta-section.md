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

_Runner appends here._
