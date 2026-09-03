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

**D-05.1 — the universal block is declared *before* `.center`, not after.** The
spec's Scope section says to add the block "outside the `.center` selector, in
the same `@layer composition` block" but does not fix its position, and the
position is load-bearing. `.center { max-inline-size: var(--_center-measure) }`
and the new `[data-measure] { max-inline-size: var(--_measure) }` are **both
specificity (0,1,0)**; the four `.center[data-measure="…"]` rules are (0,2,0)
but only write a *variable*, so they cannot break the tie on the
`max-inline-size` property itself. Source order decides. Appending the
universal block after `.center` would therefore hand it authority over
`.center`'s own `max-inline-size` — which the spec puts explicitly out of
scope. For the four in-scale values the resolved length is identical either
way, so this is invisible today; it bites on any value *outside* the scale
(`data-measure="foo"`, or a fifth step added to one block and not the other),
where `.center` must fall back to its `1100px` default and not to `75ch`.
Declared first, `.center` wins on `.center` elements by construction, in every
case, and bare elements are unaffected because nothing else matches them. A
header comment above `@layer composition` documents the scale, the
`--_measure` / `--_center-measure` split and this ordering constraint; the
`.center[data-measure="…"]` block carries a back-pointer to it.

**D-05.2 — `--_measure` is declared in the base rule, not left to a `var()`
fallback.** The spec's snippet reads `max-inline-size: var(--_measure, 75ch)`
with no default declaration. `--_measure` is a custom property and therefore
inherits, so a `[data-measure]` nested inside another `[data-measure]` would
resolve its *ancestor's* measure rather than the 75ch default. The base rule
declares `--_measure: 75ch` at (0,1,0); the four value rules at (0,2,0)
override it on the element itself. The `var()` fallback is kept as
belt-and-braces. No behavioural difference at any of the 8 current call sites
(all leaves), but the rule is now universal and will be nested eventually.

**D-05.3 — probe 03 was extended, no `05-*.vue` added.** Follows D-04.3 and
the spec's "extend issues 03/04's probe". Purely additive: one new `<section>`
plus one `measureText` constant and a docblock paragraph; every existing
`data-testid` and case in probe 03 is intact and its issue 03/04 assertions
were re-run as a regression check (gaps still `xs < l < 3xl`, `-space-l`
equals `-gap-l`, `-both` equals `3xl` on all four primitives,
`grid-min-width-*` resolves with no inline `style` and no horizontal
overflow). Six new hooks: `measure-p-narrow`, `measure-div-wide`,
`measure-li-normal`, `measure-control` (uncapped, the comparison baseline) and
the two `.center` non-regression rows `measure-center-narrow` /
`measure-center-default`. Per the epic ground rules the probe is kept; only the
final cutover issue removes `src/pages/bf-probe/`.

**D-05.4 — acceptance was read back, not eyeballed.** Computed
`max-inline-size` / `getBoundingClientRect().width` on the generated build
served from `.output/public` at a 1200px viewport: bare `<p data-measure=
"narrow">` **590.13px**, bare `<li data-measure="normal">` **737.67px**, bare
`<div data-measure="wide">` **800.86px**, uncapped `<p>` control **1140.94px**
(`max-inline-size: none`). Strictly increasing and all narrower than the
control, so the cap is real rather than incidental. The `ch` unit resolves
against each element's own font, which is why the three numbers are not in a
60/75/90 ratio to one another — the correct comparison is each element against
the uncapped control. Non-regression on `.center`:
`.center[data-measure="narrow"]` resolves **533.906px** via
`--_center-measure` and plain `.center` still resolves **1100px**.

**D-05.5 — wireframe rendering shift is expected (mirrors D-03.4).** The 7
previously-inert `<p data-measure="…">` call sites — `wfHero.vue:13`,
`wfCtaSection.vue:28`, `wfPageHeader.vue:28`, `archive.vue:9` and
`projects/[slug].vue:57,66,74` — start capping the moment this lands, so those
paragraphs render visibly narrower at wide viewports. No `wf-*` **source**
file is touched; the cumulative DoD-4 diff against the pre-epic SHA `f757a64`
is empty. DoD-4 and this issue's own spec explicitly permit the
rendered-output change; it is the fix, not a regression.

**D-05.6 — typecheck gate.** Per the orchestrator's standing decision the gate
is *no new errors*, not zero errors: `dev` carries 178 legacy `error TS`
lines. Before **178**, after **178**; scoped count over
`src/(components/bf|types|composables/bf)|content.config` is **0** before and
after. `npx nuxt generate` exits 0 (never `npm run generate` — it runs the
Directus importer).
