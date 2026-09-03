# 37 — `bfHero` — homepage hero

One-line objective: evolve `wfHero.vue` into `bfHero`, the full-bleed
homepage hero band.

## Context

Depends on 02 (`bf-scaffold`), 15 (`bfButton`, likely used inside the
default/actions slot by callers — not by this component itself). Builds
from `src/components/wireframe/wfHero.vue`. Consumed by 47 (home template).
Provenance: BF-166.

## Scope

- File: `src/components/bf/Hero.vue` → `<bfHero>`.
- Props:
  ```ts
  interface Props {
    heading?: string | null
    description?: string | null
  }
  ```
  Default slot for action buttons (the part that varies per the wf source's
  own comment).
- Root: `<section class="bf-hero">` with the same taller minimum height the
  wireframe uses (`min-height: 60svh` in `wireframe.css`'s `.wf-hero` — port
  the value, not the class name, into `--_bf-hero-min-height`).
- Renders `<h1>{{ heading }}</h1>` (this **is** the page h1 — no `level`
  prop, not configurable away, matching the wf source's implicit "hero
  owns the h1" contract and the acceptance line "heading level is the
  page h1 and is not configurable away"), conditional `<p data-measure=
  "normal">{{ description }}</p>`, and a `.cluster` wrapping the default
  slot only when `$slots.default` is present (matches `wfHero.vue`'s
  `v-if="$slots.default"` guard).
- Composition classes (`.center | .stack`, `data-gap="s"`) drive internal
  spacing; sizing comes from the Utopia type scale, not a bespoke
  `font-size`.

## Out of scope

- Background imagery or art direction (D5 — no art direction in this
  epic).
- Carousels (no wireframe evidence).
- Inner-page headers — that is `bfPageHeader` (issue 38), a separate
  component, not a variant of this one.
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variable `--_bf-hero-min-height` (`60svh`, ported from `.wf-hero`).
  No new colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Hero.vue
grep -q "<h1" src/components/bf/Hero.vue
grep -Lq "level" src/components/bf/Hero.vue
```
Probe page `src/pages/bf-probe/37-bf-hero.vue` renders heading-only,
heading+description, and heading+description+actions forms:
```bash
[ "$(grep -c '<h1' .output/public/bf-probe/37-bf-hero/index.html)" = "3" ]
grep -Lq "background-image\|--color-.*:.*#" src/components/bf/Hero.vue
```
Fails today (no `bf/Hero.vue`), passes once done.

## Decisions

_Runner appends here._
