# 39 — `bfSection` — base band (fixes two known defects)

One-line objective: evolve `wfSection.vue` into `bfSection`, the base band
every template composes, fixing the `fullWidth` no-op and the prop-leak
defect.

## Context

Depends on 02 (`bf-scaffold`), 03 (`data-gap` on every primitive), 05
(`data-measure` universal rule). Builds from
`src/components/wireframe/wfSection.vue` (as-built A: 12 files/26
conceptual uses — the most-reused wf-* component). Consumed by 40, 44
(compose it), 47–56 (every template). Provenance: BF-168. **Two known
defects fixed here** (component-inventory-v2 §2 Level 3, digest B): (1)
`fullWidth` prop has no CSS behind it today (`ccmSection`'s documented bug,
same shape carried into `wfSection`) — `bfSection` gives it real CSS; (2)
props leak onto the DOM as junk attributes (e.g. `image-left` rendered
literally on `<section>`) — `bfSection` stops that via `inheritAttrs: false`
plus explicit `v-bind` of only the intended pass-through attrs.

## Scope

- File: `src/components/bf/Section.vue` → `<bfSection>`.
- Props:
  ```ts
  interface Props {
    label?: string
    heading?: string
    gap?: string           // default 'm'
    layout?: 'stack' | 'switcher' | 'cluster' | 'plain'   // default 'stack'
    measure?: string
    padded?: boolean
    fullWidth?: boolean    // NEW — real CSS behind it, was a no-op upstream
  }
  ```
  Default slot only.
- Root: `<section class="bf-section" :data-label="label">` with an inner
  wrapper `:class="layout === 'plain' ? 'center' : \`center | ${layout}\`"`,
  `:data-gap` (omitted when `layout === 'plain'`, matching the wf source),
  `:data-measure="measure"` (now universally honoured per issue 05, not
  just through `.center`), padding-block applied via a CSS class/variable
  when `padded` is true (never an inline `style="padding-block: ..."` —
  the wf source's inline style is exactly the "junk on the DOM" pattern
  this issue retires).
- `fullWidth` fix: when true, the section breaks out of its container to
  the viewport edge (real CSS — e.g. a `width: 100vw; margin-inline:
  calc(50% - 50vw)` break-out rule or the composition layer's own
  break-out primitive if one exists) — must be visibly different from
  `fullWidth=false` in the probe.
- Prop-leak fix: `inheritAttrs: false` on the component; `$attrs` is
  forwarded **only** to the root `<section>` via an explicit `v-bind=
  "$attrs"` (so `class`/`data-*`/`id` still compose from outside per the
  ADR-1 attrs-fallthrough contract), while none of the typed props above
  ever appear as raw DOM attributes.
- Absorbs "split section" and "video section" variants as **`layout`
  options**, not separate components (per BRIEF/inventory: "Absorbs the
  split and video section variants as layout options rather than separate
  components") — if no wf-* evidence of a distinct split/video markup
  exists beyond `switcher` (media-beside-text), treat `switcher` as already
  covering it and record that finding in Decisions rather than inventing
  new layout values.

## Out of scope

- CTA, contact and page-header specialisations (issues 40, 44, 38 — those
  compose `bfSection`, they are not folded into it).
- The `data-compact` band chrome (that's `wfSection`'s sibling
  `.wf-slot[data-compact]` pattern used raw in `index.vue`'s Announcement
  band — out of scope here, addressed if/when that band gets its own
  component).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variables `--_bf-section-gap`, `--_bf-section-padding-block`,
  `--_bf-section-measure`. `fullWidth`'s break-out rule lives in
  `@layer components`. No new colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Section.vue
grep -q "inheritAttrs: false" src/components/bf/Section.vue
grep -q "fullWidth" src/components/bf/Section.vue
```
Probe page `src/pages/bf-probe/39-bf-section.vue` renders every `layout`
value plus a `fullWidth` on/off pair with a custom `data-testid` attr and a
bogus prop-like attribute to prove it does NOT leak:
```bash
grep -q 'width: 100vw\|break-out' src/components/bf/Section.vue
grep -Lq 'data-image-left\|image-left=' .output/public/bf-probe/39-bf-section/index.html
```
The rendered `<section>` carries no stray prop attributes. Fails today (no
`bf/Section.vue`), passes once done.

## Decisions

_Runner appends here._
