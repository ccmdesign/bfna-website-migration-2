# Plan — gh#48 / issue 39 · `bfSection`

**Spec:** [`docs/ds-epic/issues/39-bf-section.md`](../ds-epic/issues/39-bf-section.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Branch:** `feature/gh48-bfsection` off `dev`

Written inline by the item-runner rather than by `ce-plan`: the runner template
allows this fallback, and the whole input (spec, `wfSection.vue`, the
composition layer, the probe-harness convention, probes 31 and 37) was already
read in-turn. Nothing was detached.

## Approach

`bfSection` is the base band. It keeps `wfSection.vue`'s structure element for
element — a `<section>` wrapping one `center | <layout>` box with `data-gap`,
`data-measure`, an optional `<h2>` and the default slot — and changes exactly
three things:

1. the wireframe skin class (`wf-slot`) becomes `bf-section` and the band's own
   geometry moves out of the frozen `public/css/wireframe.css` into this
   component's `@layer components` block (the `bfHero`/gh#46 precedent: the
   **values** are ported, never the class name, and the frozen file is read,
   never edited);
2. **defect 1 — `fullWidth` is a no-op upstream.** It gets a real break-out rule
   (`width: 100vw` + `margin-inline: calc(50% - 50vw)`, behind
   `--_bf-section-full-width`), so a full-width band is measurably wider than
   its container instead of silently identical to a normal one;
3. **defect 2 — props leak onto the DOM.** `inheritAttrs: false` plus an
   explicit `v-bind` of a **filtered** `$attrs` on the root: `class`, `style`,
   `id`, `role`, `title`, `hidden`, `tabindex`, every `data-*` / `aria-*` and
   every listener compose from outside (BRIEF §5 rule 4, ADR-1), while a
   prop-shaped junk attribute such as `image-left` — the exact leak the spec
   names — is dropped rather than rendered. The typed props themselves never
   reach `$attrs` at all, because they are declared.

`padded` becomes a modifier class reading `--_bf-section-padding-block`, never
the wf source's inline `style="padding-block: …"` — that inline style *is* the
"junk on the DOM" pattern this issue retires.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/types/bf-contracts.ts` | add `SectionLayout` + `SectionProps` (BRIEF §5 rule 11 — shared types live here and nowhere else) |
| `bfna-website-nuxt/src/components/bf/Section.vue` | **new** — `<bfSection>` |
| `bfna-website-nuxt/src/pages/bf-probe/39-bf-section.vue` | **new** — probe 39 |
| `docs/ds-epic/issues/39-bf-section.md` | append to **Decisions** only |
| `docs/plans/gh48-plan.md` | this file |

Nothing under `pages/wireframes/`, `components/wireframe/`,
`layouts/wireframe.vue` or `public/css/wireframe.css` is touched (D2).

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe under the #109 harness, per the gh#20–#46 precedent:

```bash
cd bfna-website-nuxt
npx nuxt typecheck        # gate is NO NEW ERRORS vs the 178-error dev baseline
npx nuxt generate
npx tsx scripts/check-probes.ts --only 39
npx tsx scripts/check-probes.ts          # full run, no regressions
```

Probe 39 (`/bf-probe/39-bf-section`) renders, inside a deliberately narrow
frame so break-out is measurable:

- **every `layout` value** — `stack`, `switcher`, `cluster`, `plain` — asserting
  the inner box's class list, its `data-gap` (present for three, **absent** for
  `plain`, matching the wf source) and its computed `display`/`flex-direction`;
- a **`fullWidth` on/off pair**, asserting the on-case's bounding width is
  greater than its parent's content width and the off-case's is not;
- a **`padded`** case, asserting a non-zero `padding-block` that resolves to
  `--_bf-section-padding-block` and that it comes from a rule rather than an
  inline style;
- one instance given `data-testid` **and** a bogus `image-left` attribute:
  `data-testid` must be on the `<section>`, `image-left` must appear nowhere;
- a `bfAccordion` nested in a band — the follow-up D-31.1 left for this issue;
- the standing epic rows: `@layer components` membership in the live CSSOM, no
  `:not()` with a complex selector (D-20.5), no colour declared.

The spec's own two static greps are **defective** — `grep -Lq` never prints and
`-L`/`-q` contradict, and the prerendered probe HTML is one line — so verified
equivalents are used and the substitution is recorded in the spec's Decisions,
the same way D-37.5 recorded it for issue 37.

## Risks

- **`100vw` and the scrollbar.** On a page with a vertical scrollbar, `100vw`
  is wider than the layout viewport, so a broken-out band adds a horizontal
  scrollbar. Accepted, hooked (`--_bf-section-full-width`), documented in
  Decisions — the alternative primitives (`100cqw`, `100dvw`) either need a
  container the band does not have or have the same behaviour.
- **Filtering `$attrs` is stricter than plain fallthrough.** A caller passing a
  genuinely-needed non-listed attribute would see it dropped. Mitigated by an
  allowlist built from prefixes (`data-`, `aria-`, `on*`) plus the global
  attributes a band can plausibly want; the alternative — forwarding
  everything — cannot satisfy the acceptance line, which is that `image-left`
  does not reach the DOM.
- **No split/video `layout` values are invented.** The spec permits recording
  that `switcher` already covers the media-beside-text variant if no wf-*
  evidence of distinct markup exists; that evidence is checked and the finding
  recorded in Decisions rather than guessed at.
