# 31 — `bfAccordion` — styled skin over native `<details>`

One-line objective: new molecule `bfAccordion`, a styled skin over native
`<details>`/`<summary>`, replacing the hand-rolled `<details>` per year in
`archive.vue`.

## Context

Depends on 02 (`bf-scaffold`). Builds from raw `<details>` in
`src/pages/wireframes/archive.vue:14-23` (one per year, `:open="y ===
years[0]"`, `<summary><strong>{{ y.year }}</strong> ({{ y.items.length
}})</summary>`). Consumed by 55 (`/archive` template, one accordion per
year). Provenance: BF-211.

## Scope

- File: `src/components/bf/Accordion.vue` → `<bfAccordion>`.
- Props:
  ```ts
  interface Props {
    label: string     // summary text
    open?: boolean     // initial open state, maps to <details open>
  }
  ```
- Root: `<details class="bf-accordion" :open="open"><summary>{{ label
  }}</summary><div class="bf-accordion__body"><slot /></div></details>` —
  **native** semantics only, no custom ARIA disclosure re-implementation
  (`aria-expanded`, `role="button"`, etc. are all handled for free by the
  browser's own `<details>`/`<summary>` behaviour and must not be
  duplicated by hand).
- Styling is purely cosmetic (marker glyph, spacing, border) via CSS on
  `summary::marker` or a custom marker if the design calls for one — never
  by replacing `<summary>`'s default disclosure behaviour with a `<button>`
  + `v-show`.
- `label` is a plain string prop, not a slot — matches the wf source's
  `<summary><strong>{{ y.year }}</strong> ({{ y.items.length
  }})</summary>` closely enough that the caller (issue 55) can compose the
  "Year (count)" string before passing it in as `label`. If a richer
  summary (e.g. a count badge with its own markup) turns out to be needed,
  add a `summary` slot as a **second** occurrence per the rule-of-three —
  do not add it speculatively here.

## Out of scope

- Exclusive/single-open accordion-group behaviour (each `<details>` is
  independent — matches the wireframe, which allows multiple years open
  at once).
- Animating `height` on open/close (no wireframe evidence, adds
  complexity for a first version).
- Editing the hand-rolled `<details>` blocks in `archive.vue` (D2 — frozen;
  issue 55 builds the new page that uses `bfAccordion` instead).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variables `--_bf-accordion-marker-color`, `--_bf-accordion-gap`
  (Utopia space token). No new colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Accordion.vue
grep -q "<details" src/components/bf/Accordion.vue
grep -Lq "aria-expanded" src/components/bf/Accordion.vue
```
Probe page `src/pages/bf-probe/31-bf-accordion.vue` renders one open and one
closed accordion, nested inside a `bfSection` (issue 39) to prove no layout
breakage:
```bash
grep -q "<summary" .output/public/bf-probe/31-bf-accordion/index.html
```
Opens/closes by mouse and keyboard (native `<details>` guarantees this);
content is reachable in the tab order only when open (native behaviour).
Fails today (no `bf/Accordion.vue`), passes once done.

## Decisions

_Runner appends here._
