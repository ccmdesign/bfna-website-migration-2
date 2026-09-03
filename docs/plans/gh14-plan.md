# Plan — gh#14 / issue 05 `data-measure` universal rule

Spec (authoritative): [`docs/ds-epic/issues/05-composition-data-measure.md`](../ds-epic/issues/05-composition-data-measure.md)
Issue: ccmdesign/bfna-website-migration-2#14 · Epic: BF-217 · Base: `dev` · Branch: `feature/gh14-data-measure-universal-rule`

## Approach

`center.css` maps `data-measure` onto a 4-step scale (`60ch / 75ch / 90ch /
100%`) but only through `.center[data-measure="…"]`, which writes
`--_center-measure` — a variable consumed exclusively by the `.center` rule.
Every `data-measure` attribute that is **not** on an element carrying the
`center` class is therefore inert. Verified in this checkout
(`grep -rn data-measure src/`): 8 call sites, 1 working
(`wfSection.vue:19`, same `div` as `center`), 7 inert
(`wfHero.vue:13`, `wfCtaSection.vue:28`, `wfPageHeader.vue:28`,
`archive.vue:9`, `projects/[slug].vue:57,66,74`).

The fix is additive: a universal `[data-measure]` block in the same
`@layer composition` block of `center.css`, reusing the identical four values
through a new private variable `--_measure`. No new value, no new token, no
new colour.

### Rule placement — the block goes **before** `.center`, not after

This is the one real design decision and it is a cascade question, not a
style question.

* `.center { max-inline-size: var(--_center-measure); }` has specificity
  **(0,1,0)**.
* The new `[data-measure] { max-inline-size: var(--_measure); }` also has
  specificity **(0,1,0)**.
* The four `.center[data-measure="…"]` rules are (0,2,0) but they only write
  `--_center-measure` — they do **not** declare `max-inline-size`, so they
  cannot break the tie on that property.

At equal specificity source order decides. Declaring the universal block
**after** `.center` would let it win on every `.center[data-measure]`
element, taking over a property the spec puts explicitly out of scope
("Changing `.center`'s own `data-measure` behaviour"). For the four known
values the resolved length happens to be identical, but for any value outside
the scale (`data-measure="foo"`, or a future 5th step added to only one of the
two blocks) `.center` would silently switch from its `1100px` default to
`75ch`. Declaring the universal block **first** makes `.center` win on
`.center` elements by construction, in every case, which is exactly the
"left as-is / additive only" outcome the spec asks for. Bare elements are
unaffected by the ordering because nothing else matches them.

`center.css` contains no `data-gap`/`data-space` blocks, so **D-03.1 does not
apply to this file** — there is no `--_*-space` precedence pair to invert.

### Inheritance guard

`--_measure` is a custom property and therefore inherits. A `[data-measure]`
element nested inside another `[data-measure]` element would inherit the
ancestor's value if the base rule relied only on a `var()` fallback. The base
rule therefore *declares* `--_measure: 75ch` (specificity (0,1,0)), which the
four value rules (0,2,0) override on the element itself. The `var()` fallback
is kept as belt-and-braces.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/public/css/composition/center.css` | add the universal `[data-measure]` block + 4 value rules at the top of `@layer composition`, above `.center`; add a short comment documenting the scale, the placement rationale and the `--_center-measure` / `--_measure` split |
| `bfna-website-nuxt/src/pages/bf-probe/03-composition-gap-api.vue` | additive: one new `<section>` with a bare `<p data-measure="narrow">`, a bare `<div data-measure="wide">` and a bare `<li data-measure="normal">` in a plain `<ul>`, each with long placeholder text, plus a `data-measure` (unset) control row; new `data-testid` hooks only |
| `docs/ds-epic/issues/05-composition-data-measure.md` | append the Decisions section (D-05.1 …) |
| `docs/plans/gh14-plan.md` | this file |

**Not touched:** anything under `src/pages/wireframes/`,
`src/components/wireframe/`, `src/layouts/wireframe.vue`,
`src/public/css/wireframe.css`, `src/composables/useWfContent.ts`,
`src/assets/wireframe-data/`. The 7 inert call sites start working with zero
edits — that is the point of the issue.

## Test strategy

Run from `bfna-website-nuxt/`:

1. `grep -n '^\s*\[data-measure\]' src/public/css/composition/center.css`
   → exactly 1 match, outside the `.center` block (spec's own acceptance
   command; exits 1 today).
2. **Typecheck gate — no new errors.** Baseline on `dev` is **178**
   (`npx nuxt typecheck 2>&1 | grep -cE 'error TS'`). After the change the
   count must be ≤ 178, and the scoped count
   (`… | grep -E 'src/(components/bf|types|composables/bf)|content\.config' | wc -l`)
   must stay **0**. A CSS-and-probe change should move neither.
3. `npx nuxt generate` exits 0 (never `npm run generate` — it runs the
   Directus importer).
4. **DoD-4, cumulative:**
   `git diff --stat f757a64 HEAD -- src/pages/wireframes src/components/wireframe src/layouts/wireframe.vue src/public/css/wireframe.css`
   (repo-root paths) must print nothing.
5. **Probe, read back not eyeballed.** Serve `.output/public`, open
   `/bf-probe/03-composition-gap-api`, and read
   `getComputedStyle(el).maxInlineSize` / `getBoundingClientRect().width` on
   the three new elements. Expected: `p` → 60ch-equivalent, `div` → 90ch,
   `li` → 75ch, strictly increasing, and all three strictly narrower than the
   unset control. Also re-run the issue 03/04 assertions on the same page
   (`*-gap-*`, `*-both`, `grid-min-width-*`) as a regression check — this
   change adds a rule to a stylesheet those cases share.
6. **Non-regression on `.center`:** on the same generated build read back
   `max-inline-size` for a `.center[data-measure="narrow"]` element (present
   at `/wireframes/insights/<slug>` via `wfSection measure="narrow"`) and for
   a plain `.center` — must be `60ch` and `1100px` respectively, unchanged.

## Risks

| Risk | Mitigation |
|---|---|
| Universal rule hijacks `.center`'s `max-inline-size` | block declared **before** `.center`; verified by test 6 |
| `--_measure` leaks into a nested `[data-measure]` | base rule declares `--_measure: 75ch` rather than relying on a `var()` fallback |
| `/wireframes/*` renders visibly narrower in 7 places | expected and explicitly permitted by DoD-4 (rendered output may change; **source** must not). Recorded as a decision. |
| Probe 03 regression while extending it | change is purely additive; existing `data-testid`s re-asserted in step 5 |
| A bare `[data-measure]` inside a flex/grid track behaving unexpectedly | `max-inline-size` on a flex item is respected; probe covers `p`, `div` and `li` in normal flow, which is what all 8 call sites are |
