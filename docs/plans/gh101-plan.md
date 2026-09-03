# gh#101 — 14b Foundation: keep `@layer` in SFC CSS + semantic inverse tokens

Promoted from residuals [#98](https://github.com/ccmdesign/bfna-website-migration-2/issues/98)
and [#99](https://github.com/ccmdesign/bfna-website-migration-2/issues/99) of the epic's first
`bf-*` component ([#23](https://github.com/ccmdesign/bfna-website-migration-2/pull/97)).
Runs before any further component so every later `bf-*` stylesheet lands in the right cascade
layer and every inverted colourway has a semantic token to reach for.

**Spec:** the issue body ([#101](https://github.com/ccmdesign/bfna-website-migration-2/issues/101)) —
there is no `docs/ds-epic/issues/` file for this one.
**Epic:** https://app.plane.so/ccm-design/browse/BF-217/

---

## Approach

Two independent one-line-ish changes plus the verification that proves each one.

### 1. Keep `@layer` in the built SFC CSS

`bfna-website-nuxt/src/nuxt.config.ts` runs `postcss-preset-env` at `stage: 1`. Stage 1 enables
the **cascade-layers polyfill**, which processes each SFC stylesheet in isolation. It cannot see
the layer-order statement in `public/css/styles.css` (`@layer reset, defaults, tokens, themes,
composition, components, utils, overrides;`), so it flattens the single `@layer components { … }`
block each `bf-*` component ships into unlayered rules.

Fix: add `'cascade-layers': false` alongside the existing `'nesting-rules': true`, leaving
`stage: 1` and every other feature exactly where it is. Native `@layer` is supported by every
browser in the target matrix, so no polyfill is wanted.

Nothing else in the build changes: `public/css/**` is served through `<link>` and is never
touched by Vite/PostCSS, so the wireframe stylesheet is unaffected by construction.

### 2. Semantic inverse tokens

`bfna-website-nuxt/src/public/css/tokens/semantic-colors.css` has no white and no inverse surface,
so `bf/Logo.vue`'s white colourway reaches straight for the `--color-white` **primitive** —
which BRIEF §5 rule 2 forbids. Resolution is #99's option 1, the narrow one: add two **aliases of
existing primitives** under the existing "Text & Neutral Colors" group.

```css
--color-text-inverse: var(--color-white);
--color-surface-inverse: var(--color-black);
```

`--color-black` is the darkest existing neutral primitive (`hsl(0, 0%, 3%)` — `primitive-colors.css:31`).
Both are `var()` references in the same `var(--color-…)` form every other line of the file uses;
**no new hex / hsl / oklch value is introduced anywhere**, so DoD-6 ("no new colour") holds on the
value axis. Then repoint `bf/Logo.vue`'s `[data-variant='white']` rule from `var(--color-white)` to
`var(--color-text-inverse)`.

### 3. Verification catches up

- `scripts/verify-bf-logo.ts` §4 asserts the white colourway reads `--color-white`; repoint it to
  `--color-text-inverse`, and add a check that the primitive is no longer referenced directly.
- The same script's §7 currently prints `@layer components in the compiled CSS: ABSENT` as an
  **`info` disclosure**. Promote it to a real `check()` — with the polyfill off it must be
  `present`, and it must be present in a stylesheet that also carries `.bf-logo`.
- Probe 14 (`src/pages/bf-probe/14-bf-logo.vue`) gets its `white variant resolves to --color-white`
  assertion repointed to `--color-text-inverse`, per the issue's item 3.

## Files touched

| File | Change |
|---|---|
| `bfna-website-nuxt/src/nuxt.config.ts` | `features: { 'cascade-layers': false }` |
| `bfna-website-nuxt/src/public/css/tokens/semantic-colors.css` | two `var()` aliases of existing primitives |
| `bfna-website-nuxt/src/components/bf/Logo.vue` | white variant → `--color-text-inverse` (+ comment) |
| `bfna-website-nuxt/src/pages/bf-probe/14-bf-logo.vue` | one assertion repointed |
| `bfna-website-nuxt/scripts/verify-bf-logo.ts` | token assertion repointed; `@layer` info → check |
| `docs/plans/gh101-plan.md` | this file |

Nothing under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue`,
`composables/useWfContent.ts`, `public/css/wireframe.css` or `assets/wireframe-data/`.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86); acceptance does **not**
depend on it (gh#20–#23 precedent). Instead:

1. `npx nuxt generate` in `bfna-website-nuxt/` exits 0. **Not** `npm run generate` — that runs the
   Directus importer, which needs secrets not in the checkout.
2. `grep -rl '@layer' .output/public/_nuxt/*.css` finds the bfLogo stylesheet, and the compiled
   `.bf-logo[data-v-…]` rules sit **inside** `@layer components` (checked by brace-matching the
   layer block, not just co-occurrence in the file).
3. `npx tsx scripts/verify-bf-logo.ts` → PASS (probe 14's static half + the new `@layer` check).
4. Typecheck gate: `npx nuxt typecheck 2>&1 | grep -cE 'error TS'` ≤ baseline **178**, and 0 errors
   matching `src/(components/bf|types|composables/bf)|content\.config`.
5. Wireframe byte-identity vs the pre-epic base `f757a64` prints nothing.
6. Browser: serve `.output/public`, drive `/bf-probe/14-bf-logo` headlessly — the verdict cell must
   read PASS, and `/wireframes` must render unchanged.

## Risks

- **Layer order for SFC CSS.** With the polyfill off, an `@layer components` block in an SFC joins
  the layer already named by `styles.css`'s order statement *if* that statement has been parsed
  first. If Nuxt injects the SFC `<style>` ahead of the `<link>`, `components` gets created early
  and the order is wrong. Mitigation: the probe's computed-colour assertions are the ground truth —
  if the white variant still resolves to white, the token wins from wherever it sits. Watched in
  step 6.
- **Layered CSS now loses to unlayered CSS.** This is the *point* of the change (a `utils` or
  `overrides` rule can finally outrank a component), but it is a real specificity shift for any
  page already relying on `bf-*` rules winning outright. Only one `bf-*` component exists today
  (`bfLogo`, used only on its probe), so the blast radius is a single dev-only route.
- **Two new `--color-*` names.** DoD-6's letter is "no new colour literal **or** `--color-*` token".
  These add no colour, only two names for colours already in the file's `var()` graph — the exact
  carve-out #99 asked a human to rule on, and #101 is that ruling. Recorded as a decision below.

## Decisions

**D101.1 — #99 resolved as option 1, with the names `--color-text-inverse` /
`--color-surface-inverse`, not `--color-inverse`.** Residual #99 offered three options; the issue
body picks option 1 (a semantic alias). Two tokens rather than #99's single `--color-inverse`,
because the semantic layer already separates the *role* of a colour from its value
(`--color-text` vs `--color-primary`), and an inverted card needs a surface as well as a text
colour. `--color-surface-inverse` aliases `--color-black`, the darkest existing neutral primitive.
Naming follows the file's existing `--color-{role}[-{modifier}]` shape.

**D101.2 — this supersedes D14.10 of `14-bf-logo.md`'s residual list.** `bf/Logo.vue`'s white
colourway no longer reads a primitive; the BRIEF §5 rule-2 exception recorded in gh#23 is closed.

**D101.3 — DoD-6 carve-out, scoped.** A `--color-*` token whose value is *only* a `var()`
reference to an existing token, introducing no new hex/hsl/oklch value, is not "a new colour" for
DoD-6. Verified mechanically: `git diff dev...HEAD -- '*.css' '*.vue'` must add no line containing
a colour literal.

**D101.4 — acceptance substitutes for vitest (residual #86).** Per the epic's standing decision,
`scripts/verify-bf-logo.ts` + the probe page carry acceptance. Both are extended here rather than a
new harness being introduced.

**D101.5 — the `@layer` disclosure becomes a gate.** `verify-bf-logo.ts` §7 printed the missing
layer as `info` because it was known-broken and out of scope. With the cause fixed, an `info` line
nobody reads is worse than useless — it is promoted to a hard `check()` so any future config change
that re-enables the polyfill fails the script instead of silently regressing every `bf-*`
component.
