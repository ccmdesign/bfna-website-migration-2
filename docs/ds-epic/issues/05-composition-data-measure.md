# 05 — composition-data-measure

Make `data-measure` a universal CSS rule instead of a `.center`-only one, so
the 7 stray `<p data-measure>` call sites (which sit outside any `.center`
element) stop being inert.

## Context

Depends on 03 (composition layer touched in sequence, not concurrently).
Blocks nothing downstream directly, but every organism that copies the
`wfHero`/`wfPageHeader`/`wfCtaSection` `data-measure` pattern (37, 38, 40)
relies on it actually working. Builds from
`bfna-website-nuxt/src/public/css/composition/center.css`. Provenance:
BF-177; v2 §2 Level 0 row 3.

**Verified today** (`grep -rn "data-measure" src/components/wireframe
src/pages/wireframes`): 8 call sites total. `wfSection.vue:19` binds
`:data-measure="measure"` on the same `div` that carries the `center` class
(line 17) — this one **works** via `.center[data-measure="…"]`
(`center.css:17-20`). The other 7 are bare `<p data-measure="…">` /
`<p data-measure="narrow">` with no `.center` ancestor class on the element
itself: `archive.vue:9`, `wfHero.vue:13`, `wfCtaSection.vue:28`,
`wfPageHeader.vue:28`, `projects/[slug].vue:57`, `:66`, `:74` — all **inert**
today (the `data-measure` attribute is present in the rendered HTML but no
selector in scope matches a bare `[data-measure]`).

## Scope

- `bfna-website-nuxt/src/public/css/composition/center.css` — add a
  universal rule outside the `.center` selector, in the same `@layer
  composition` block:
  ```css
  [data-measure] { max-inline-size: var(--_measure, 75ch); }
  [data-measure="narrow"] { --_measure: 60ch; }
  [data-measure="normal"] { --_measure: 75ch; }
  [data-measure="wide"] { --_measure: 90ch; }
  [data-measure="full"] { --_measure: 100%; }
  ```
  Same four token values already used by `.center[data-measure="…"]`
  (lines 17–20: `60ch/75ch/90ch/100%`) — no new value, this generalises the
  existing scale to any element, not only `.center`.
- Confirm `.center[data-measure="…"]` (lines 17–20, sets
  `--_center-measure`) is left as-is — it is a separate, more specific rule
  that continues to govern `.center`'s own `max-inline-size` via
  `--_center-measure`; the new universal rule does not touch that variable
  or that selector.
- Probe page (extend issues 03/04's probe): a bare `<p data-measure="narrow">`,
  a bare `<div data-measure="wide">`, and a bare `<li data-measure="normal">`
  (inside a plain `<ul>`, no `.center`/`.stack` ancestor needed), each with
  long placeholder text, confirming the max-width caps visibly differ.

## Out of scope

- Changing `.center`'s own `data-measure` behaviour or its `--_center-measure`
  variable — untouched, only additive.
- Editing any of the 8 `wf-*` call sites listed above (D2 freezes them) —
  they start rendering correctly once this issue lands, with zero wireframe
  edits.
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

Tokens: reuses the existing 4-step measure scale (`60ch/75ch/90ch/100%`),
no new value. Primitive touched: adds a universal `[data-measure]` rule to
`center.css`, `@layer composition`. No `--_bf-*` hook — substrate.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
grep -n '^\s*\[data-measure\]' src/public/css/composition/center.css
# today: no match (grep exits 1); after: 1 match, outside the .center block
git diff --stat -- src/pages/wireframes src/components/wireframe   # must be empty
```
Plus the probe page: `data-measure` caps line length on a bare `<p>`, `<div>`,
and `<li>` (per the issues.md `verify` column). Per BRIEF DoD-4, the `wf-*`
**source files** stay byte-identical (the `git diff --stat` above is the
gate) while the **rendered output** of `/wireframes/*` may change as a
side-effect — the 8 existing call sites' rendered widths may now visibly
shrink to their measure cap; this is the intended fix, not a regression.

## Decisions

_Runner appends here._
