# gh#218 — the reduced-motion floor (a11y row 93, DoD-A8)

Issue: https://github.com/ccmdesign/bfna-website-migration-2/issues/218
Epic: https://app.plane.so/ccm-design/browse/BF-219/
Brief: [`docs/a11y-epic/BRIEF.md`](../a11y-epic/BRIEF.md) — §4 D23/D32, §5, DoD-A8.

## What is wrong today

`src/public/css/base/reset.css` declares motion for every visitor with no way out:

- `:11-13` — `@view-transition { navigation: auto }`, unguarded. Every same-document
  navigation cross-fades, including for a visitor who has asked the OS for less motion.
- `:8` — `transition-behavior: allow-discrete` on `*, *::before, *::after`, which *widens*
  what is allowed to animate (`display`, `content-visibility`, `overlay`) rather than narrowing it.

The repo has exactly two `prefers-reduced-motion` blocks today —
`src/components/ds/molecules/ccmTabs.vue:626` and `src/components/bf/Accordion.vue:238` — and
neither is in `public/css/**`. Every other motion declaration is unguarded: 27 `transition`
declarations across `ccmChip`, `ccmFormField`, `ccmButton`, `ccmSection`, the two docs
components, `bf/Accordion` and `public/css/base/forms.css`. Guarding them one by one is the
wrong shape (D24: fix it once, in the CSS floor).

WCAG 2.3.3 (AAA) is in scope for this row by explicit exception — brief §7, last bullet.

## Approach

One block appended to the `@layer reset` body in `src/public/css/base/reset.css`, immediately
after the existing `@view-transition` rule so the two sit in the same nesting context:

```css
@media (prefers-reduced-motion: reduce) {
  @view-transition { navigation: none; }

  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-behavior: normal !important;
  }
}
```

Four decisions, each with a reason:

1. **Same nesting context as the rule it overrides.** The existing `@view-transition` lives
   *inside* `@layer reset`. Whatever a browser does with a layer-nested `@view-transition`, it
   does with both, and the later one (`navigation: none`) wins by document order. Hoisting the
   existing rule out of the layer to "make it valid" would be a behaviour change — it could
   switch view transitions *on* where they are currently being dropped — and that is not this
   row's job.
2. **`!important`, and it has to be.** `@layer reset` is the *first* layer in
   `public/css/styles.css:2`, so a normal declaration there loses to every component rule. For
   **important** declarations the layer order reverses: important-in-`reset` outranks
   important-in-`components` and outranks unlayered author styles too. That is exactly the
   position a floor needs.
3. **`0.01ms`, not `none`.** A duration of zero-ish still fires `transitionend`/`animationend`;
   `transition: none` does not, and any JS waiting on those events would hang. Nothing in the bf
   stack does today, but the floor is written to survive whatever pass 2 adds.
4. **`transition-behavior: normal`** answers `reset.css:8`. `allow-discrete` is the reason a
   discrete property (`display`, `overlay`) can animate at all; with the duration capped it is
   already inert, and resetting it says so rather than relying on the cap.
   `animation-iteration-count: 1` is the guard against the one thing a duration cap makes
   *worse*: an `infinite` animation at `0.01ms` per iteration is a strobe. There is no
   `infinite` animation on a served route today (`css-legacy/` is unserved, `nuxt.config.ts:192`),
   which is why this is future-proofing, not a fix.

Not included, deliberately: `scroll-behavior: auto`. The canonical floor carries it; this
codebase sets `scroll-behavior` nowhere (grep, `src/**`), so the browser default is already
`auto` and the line would assert nothing.

## D23 / D32 compliance

The diff contains no colour value, font face, size, weight, letter-spacing, line-height, radius
or shadow — only `animation-duration`, `animation-iteration-count`, `transition-duration`,
`transition-behavior` and a `navigation` descriptor. Nothing changes for a visitor who has not
asked for reduced motion; D32 names this row as the archetype of a pass-1 CSS change.

## The check-routes assertion (brief §5)

A new whole-build gate in `scripts/check-routes.ts`, in the shape of the DoD-A9 `langRows()`
gate it sits beside: read the **served** stylesheet at `.output/public/css/base/reset.css` —
build output, not source, so a broken copy step or a stripped `@media` is caught — and assert
that it contains a `prefers-reduced-motion: reduce` block, that the block neutralises
`@view-transition` (`navigation: none`), and that it caps both `transition-duration` and
`animation-duration`. A source-file grep would go green on a build that never shipped the file.

## Verification

1. `npx nuxt generate` then `npx tsx scripts/check-routes.ts` — the new DoD-A8 rows green.
2. Browser, via CDP `Emulation.setEmulatedMedia`:
   - **With** `prefers-reduced-motion: reduce`: `getComputedStyle` on an element that carries a
     transition reports `transition-duration: 0.01ms`; navigating between two prerendered routes
     runs no view transition (no `::view-transition` pseudo tree / no
     `document.startViewTransition` cross-fade observed).
   - **Without** it: the same element still reports its authored duration (`0.2s`), proving the
     floor did not disable motion for everyone.
3. `npm ci` + typecheck signature gate + `check-links.ts` via CI.

## Risks

- **A layer-nested `@view-transition` may be ignored by the browser entirely.** Then the
  `navigation: auto` at `:11` never applied either, and the acceptance ("emulating the query
  produces no view transition") holds trivially. Measured in step 6 and recorded either way
  rather than assumed.
- **The `!important` floor is broad by design.** A future essential animation (a progress
  indicator) would be capped with everything else. That is the correct default; the escape hatch
  is an explicit `@media (prefers-reduced-motion: reduce)` opt-back-in at the component, which is
  a decision a component author has to make deliberately.
- **Out of bounds, untouched:** `/wireframes/**`, `src/layouts/wireframe.vue`,
  `src/components/wireframe/**`, `public/css/wireframe.css`, `src/assets/wireframe-data` —
  site-epic DoD-4 byte-guards them against `f757a64`.
