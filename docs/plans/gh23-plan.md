# Plan — gh#23 / issue 14: `bfLogo`

**Spec (authoritative):** [`docs/ds-epic/issues/14-bf-logo.md`](../ds-epic/issues/14-bf-logo.md)
**Brief:** [`docs/ds-epic/BRIEF.md`](../ds-epic/BRIEF.md) · **Epic:** BF-217
**Branch:** `feature/gh23-bflogo` off `dev` · **Mode:** `ce-plan` pipeline mode, Durable contract.

This is the **first real `bf-*` component** of the epic (`src/components/bf/` holds
only `.gitkeep` today). The shape it lands in is the shape the next ~45 components
copy, so the plan is deliberately explicit about the house pattern.

---

## 1. Research findings (read, not assumed)

| Question | Evidence | Answer |
|---|---|---|
| Does a `.st0` rule exist? | `grep -rn '\.st0' src/public src/assets public` → no hits | No. `class="st0"` is inert. |
| Then what colours the legacy mark? | `src/public/css-legacy/global.css:1305-1315` — `.bfna-logo { width: 100%; fill: #222 }`, `.bfna-logo--white { fill: #fff }` | The **root `<svg>`** carries the fill and the unstyled `.st0` children inherit it. The spec's "renders at the SVG default (black)" is close but not exact: the real legacy colour is `#222` / `#fff`. |
| Nearest existing semantic token to `#222`? | `tokens/semantic-colors.css` → `--color-text: var(--color-base)`; `tokens/primitive-colors.css` → `--hsl-base: var(--hsl-black)` = `0 0% 3%` | `--color-text`. White variant → `--color-white` (already primitive, named by the spec). No new token, no literal. |
| What is `.wf-nav__logo`'s size? | `public/css/wireframe.css:170-175` — `.wireframe .wf-nav__logo { font-size: 1.25rem; text-decoration:none; color:inherit; margin-inline-end:auto }`; `wfNav.vue:6-8` renders `<NuxtLink class="wf-nav__logo"><strong>BFNA</strong></NuxtLink>` | The wireframe logo is **text**, not an SVG: its only size is `font-size: 1.25rem`. Default `--_bf-logo-size: 1.25rem`, mapped to `block-size`, so the mark occupies the same vertical band as the wireframe's logo text. Width follows from `aspect-ratio: 695.1 / 266.6`. Read, not guessed — recorded in the spec's Decisions. |
| Existing accessible name for the mark? | Only two call sites — `legacy/organisms/Header.vue:4` and `legacy/organisms/MainNav.vue:4`, both bare `<LegacyAtomsLogoWhite />` inside `div.main-nav__logo` with no `alt`/`aria-label`/`title` | The legacy mark has **no accessible name today** (an a11y defect this issue fixes). The spec's copy is corroborated verbatim elsewhere in the repo — `wfFooter.vue:10` and `wfContactSection.vue:15` both render `Bertelsmann Foundation North America` — so it is existing copy, not invented. |
| Is `<bfLogo>` auto-import wired? | `src/nuxt.config.ts:143-148` — `{ path: components/bf, pathPrefix: false, prefix: 'bf' }` | Yes (issue 02). `components/bf/Logo.vue` → `<bfLogo>`. |
| Typecheck baseline | `npx nuxt typecheck 2>&1 \| grep -cE 'error TS'` on clean `dev` | **178** (legacy, pre-existing). Gate = no new errors. |

## 2. Approach

One SFC, no second SVG. `variant` only switches a CSS custom property.

- **Markup.** The 13 `<path>`/`<polygon>`/`<rect>` elements from
  `legacy/atoms/Logo.vue`, path data byte-for-byte, wrapped in a single
  `<g fill="currentColor">`. `class="st0"` and the legacy
  `style="enable-background:…"` / `x`/`y` / `xml:space` / `version` /
  `xmlns:xlink` cruft are dropped (inert, non-rendering).
- **Colour.** `.bf-logo { color: var(--_bf-logo-color) }`, with
  `--_bf-logo-color` defaulting to `var(--color-text)` and
  `[data-variant='white']` overriding to `var(--color-white)`. Children paint
  `currentColor`. Zero colour literals in the file — grep-asserted.
- **Size.** `--_bf-logo-size` (default `1.25rem`) drives `block-size`;
  `inline-size: auto` + `aspect-ratio` from the viewBox keeps the lockup
  proportional. Consumers override the variable, not the rule.
- **`cssVars` computed** per BRIEF §5.4 rule 4, bound with `:style`, emitting
  only the keys the caller actually set (so the stylesheet default wins when a
  prop is absent).
- **A11y.** `role="img"` + `<title :id>` + `aria-labelledby` pointing at it
  (`role="img"` alone does not reliably expose a child `<title>` in every AT;
  `aria-labelledby` does). `useId()` for the title id so SSR and client agree.
  A `title` prop lets a consumer relabel (e.g. "BFNA — home") without a second
  component, defaulting to the org name.
- **`$attrs`** falls through to the root `<svg>` — no `inheritAttrs: false`
  (this is a base, not a wrapper), so `class`/`style`/`data-*`/`aria-hidden`
  from the caller land on the root and merge with the component's own.
- **Types.** `LogoVariant` and `LogoProps` go in `src/types/bf-contracts.ts`
  (BRIEF §5 rule 11 — a `bf-*` component may not declare a shared type inline).

## 3. Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/components/bf/Logo.vue` | **new** — the component. |
| `bfna-website-nuxt/src/types/bf-contracts.ts` | **edit** — add `LogoVariant`, `LogoProps`. |
| `bfna-website-nuxt/src/pages/bf-probe/14-bf-logo.vue` | **new** — probe: both variants × three sizes, plus an assertion table. Committed and kept (only issue 58/59 removes `bf-probe/`). |
| `bfna-website-nuxt/scripts/verify-bf-logo.ts` | **new** — `npx tsx` acceptance script (vitest harness on `dev` is broken, residual #86). |
| `docs/ds-epic/issues/14-bf-logo.md` | **edit** — append to **Decisions** only. |
| `docs/plans/gh23-plan.md` | this file. |

Nothing else. In particular **nothing** under `pages/wireframes/`,
`components/wireframe/`, `layouts/wireframe.vue`, `public/css/wireframe.css`,
and **no** edit or deletion of `legacy/atoms/Logo*.vue` (issue 58 owns that).

## 4. Test strategy

`vitest` is out (broken on `dev`, residual #86). Substitute, equal strength:

1. **`npx tsx scripts/verify-bf-logo.ts`** — static assertions over the SFC
   source and the generated HTML:
   - file exists; contains `variant`, `role="img"`, `<title>`, `$attrs`;
   - **no colour literal**: `/#[0-9a-fA-F]{3,8}\b|hsl\(|rgb\(|oklch\(/` on the
     `<style>` + template minus the `viewBox`/path-data (path `d` strings
     contain no `#`, so a plain grep is already safe — the script asserts the
     spec's exact `grep -c` expression returns 0);
   - both `--color-text` and `--color-white` referenced, and neither
     `--color-*` token is newly defined anywhere in the diff (DoD-6);
   - `viewBox` matches the legacy `0 0 695.1 266.6` and the count of drawable
     elements is 13 — i.e. the path data was transplanted, not redrawn.
2. **Probe page** `/bf-probe/14-bf-logo` — 6 live renders (2 variants × 3
   sizes) plus a runtime check table with a `data-testid="probe-14-verdict"`
   PASS/FAIL cell, asserted post-`nuxt generate` against the emitted HTML by
   the same script and re-checked in the browser step.
3. **Gates:** typecheck ≤ 178 with 0 errors in `src/components/bf|types|composables/bf`;
   `npx nuxt generate` exit 0; wireframe-source diff empty.

## 5. Risks

| Risk | Mitigation |
|---|---|
| The bottom half of the mark is an **inverted block** (`M0,122.5v144.1h695.1V122.5H0z` with knocked-out counters), so `variant="white"` paints a white slab with transparent letters. Correct on dark grounds, invisible on light. | Faithful to legacy `.bfna-logo--white` — same behaviour, not a regression. The probe renders the white variant **on a dark panel** so it is legible and the constraint is documented on the page and in Decisions. |
| `--_bf-logo-size` semantics (height vs width) is a contract ~45 later components may lean on. | Fixed here as **block-size**, derived from the only measurable wireframe value, and stated in Decisions so later issues inherit it rather than re-decide. |
| `role="img"` + child `<title>` alone is inconsistently announced. | `aria-labelledby` → `<title id>`, id from `useId()`. |
| Dropping legacy `<svg>` attributes changes rendering. | Only inert attrs dropped (`version`, `xmlns:xlink`, `x`/`y`, `xml:space`, `style="enable-background"`, `class="st0"`); `viewBox` and every `d`/`points` string preserved verbatim. Element count asserted. |
| A colour literal creeping in via the probe page. | The verify script greps the probe too. |

## 6. Sequence

1. Types → `bf-contracts.ts`.
2. `components/bf/Logo.vue`.
3. `pages/bf-probe/14-bf-logo.vue`.
4. `scripts/verify-bf-logo.ts`.
5. Gates: typecheck count, `npx nuxt generate`, verify script, wireframe diff.
6. Append Decisions to the spec; commit; PR.

## 7. Confidence

**High.** The spec is unusually complete, every open value in it was resolvable
by reading the repo (no guesses left), the surface is one presentational SFC
with no data access, and the acceptance is mechanically checkable. The single
judgement call — `--_bf-logo-size` meaning block-size, defaulting to the
wireframe's `1.25rem` type size — is recorded in Decisions for later issues.

_Document review: `ce-doc-review` non-interactive; pipeline mode, no synchronous user._
