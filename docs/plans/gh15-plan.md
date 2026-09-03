# Plan — gh#15 / issue 06 token hygiene + icon-utility decision

Spec (authoritative): [`docs/ds-epic/issues/06-token-hygiene.md`](../ds-epic/issues/06-token-hygiene.md)
Issue: ccmdesign/bfna-website-migration-2#15 · Epic: BF-217 · Base: `dev` · Branch: `feature/gh15-dead-token-cleanup-icon`

## Approach

Four independent deletions/repoints in the token and utility layers. Nothing
is added: no new colour literal, no new `--color-*` token, no new rule that
did not already exist somewhere. Every change is either value-preserving by
construction or provably unreachable from the two pages the acceptance
criterion names.

### 1. The dead `--colors-*` block (`css-legacy/global.css`)

Verified in this checkout — `grep -c -- '--colors-' src/public/css-legacy/global.css`
returns **13** matching lines (the spec's "11" undercounts; the target is 0
either way):

* **8 declarations**, lines 26–33, inside the first `:root`. Six of them
  (`--colors-default`, `--colors-orange`, `--colors-teal`, `--colors-yellow`,
  `--colors-red`) hold unresolved SCSS variables (`$black`, `$orange`, …)
  that never went through a Sass compiler, and two (`--colors-alt`,
  `--colors-black`) hold a bare `--colors-teal` / `--colors-default`
  token sequence with no `var()` wrapper. All eight are
  invalid-at-computed-value-time the moment they are substituted into a
  colour property. Only `--colors-white: #FFFFFF` is a real value.
* **5 usages**, lines 1535, 1637, 1714, 1736, 2278 — every one of them
  `var(--colors-white)`. The other seven declarations have **zero**
  consumers anywhere in the repo.

Delete the block; repoint the five usages to `var(--color-white)`.

**This is value-preserving, not merely "close enough".** `global.css`
declares its own `--color-white: hsla(var(--white-hsl), 1)` at line 259 with
`--white-hsl: 0, 0%, 100%` at line 247 — i.e. `hsla(0, 0%, 100%, 1)`, which
is exactly `#FFFFFF`. `global.css` is loaded standalone by
`layouts/legacy-base.vue` (`/global.css`, `/fixes.css`, `/v2updates.css`) and
never alongside `css/styles.css`, so the design-token `--color-white` in
`css/tokens/primitive-colors.css` is not in play on those pages and cannot
shadow or be shadowed. Custom properties resolve at use time, so the fact
that line 259 precedes the usages at 1535+ is immaterial.

### 2. The `--color-black` comma bug (`css-legacy/global.css:266`)

```css
--color-black: hsla(var(--black-hsl) 1);   /* every sibling has: ), 1) */
```

`--black-hsl` is `0, 0%, 15%`, so this expands to `hsla(0, 0%, 15% 1)` —
legacy comma syntax with a space before the alpha, which is not a valid
`hsla()` form. Add the missing comma to match all fourteen sibling
declarations in the same block.

**Zero render risk:** `grep 'var(--color-black)' src/public/css-legacy/global.css`
returns nothing — the legacy `--color-black` is declared and never consumed.
And because `global.css` and `css/styles.css` never co-load, the fix cannot
leak into the design-token `--color-black` either. This is a correctness fix
against a latent trap, not a visual change.

### 3. `semantic-colors.css` — duplicate and ordering

* Line 39 repeats `--color-neutral: var(--color-black);` verbatim from line
  29, inside the same `:root`. Delete line 39 (the one under
  "UI Feedback Colors", where it does not belong topically); keep line 29
  under "Text & Neutral Colors".
* Lines 35–36 declare `--color-error: var(--color-fail);` *before*
  `--color-fail: var(--color-red);`. Harmless today — custom properties
  resolve at use time, not declaration time — but it reads as a bug and
  breaks the moment anyone converts these to a build-time token pipeline.
  Swap the two lines. Resolved values are identical before and after.

### 4. The two conflicting `.icon` utilities

`css/styles.css` imports `utils/typography-utils.css` (line 47) then
`utils/utils.css` (line 48), both declaring into `@layer utils`. Within one
layer, source order breaks specificity ties, so `utils.css` already wins
today on the two properties both files set:

| property | typography-utils | utils.css | effective |
|---|---|---|---|
| `font-family` | `'Material Icons', sans-serif` | `"Material Symbols Outlined", sans-serif` | **Material Symbols** |
| `font-size` | `24px` | `1.8rem` | **1.8rem** |

Material Symbols Outlined is also the only icon stylesheet
`src/nuxt.config.ts` loads (`app.head.link`,
`fonts.googleapis.com/css2?family=Material+Symbols+Outlined`). The
`'Material Icons'` rule is therefore dead weight that only survives as a
source-order hazard. Delete the whole `.icon, .material-icons` rule from
`typography-utils.css` (lines 4–20) and record the decision.

**Deleting `.material-icons` is safe.** It has four call sites
(`components/legacy/molecules/PlatformNav.vue`,
`components/legacy/templates/PeopleSection.vue`,
`components/legacy/organisms/OffCanvas.vue`, `pages/index.vue:99`) — all on
`layouts/legacy-base.vue`, which does **not** load `css/styles.css` and
therefore never saw this rule. That layout preloads
`fonts.googleapis.com/icon?family=Material+Icons`, and Google's own hosted
stylesheet ships the canonical `.material-icons { font-family: 'Material Icons'; … }`
rule, which is where those four call sites actually get their font.

**Deleting the rest of the block is safe too.** Removing it drops
`font-weight`, `font-style`, `line-height`, `letter-spacing`,
`text-transform`, `display:inline-block`, `white-space`, `overflow-wrap`,
`direction`, `font-feature-settings` and `-webkit-font-smoothing` from
`.icon` — a real change in the abstract. But `css/styles.css` is loaded by
exactly two routes (`layouts/wireframe.vue:50` and
`pages/bf-probe/03-composition-gap-api.vue:36`), and `grep -rn icon
src/components/wireframe src/pages/wireframes src/layouts/wireframe.vue`
returns **nothing**. The only `class="icon"` consumer in the repo is
`components/ds/molecules/ccmBreadcrumb.vue`, used only by
`components/docs/demos/ccm-breadcrumb-demo.vue` — and `/docs`
(`layouts/docs-layout.vue`) loads no stylesheet at all. So the rule is
unreachable from both `/wireframes/index` and `/docs`, which is precisely
the acceptance surface.

### 5. The duplicated `global.css`

`bfna-website-nuxt/public/global.css` and
`bfna-website-nuxt/src/public/css-legacy/global.css` are byte-identical
(md5 `861a6156246f82d3b3b4f4a0b9909dd2`) and both git-tracked;
`public/global.css` is the copy actually served at `/global.css`. The
issue's own acceptance is "no `--colors-*` remains under `public/`", which
covers both paths. Apply changes 1 and 2 to **both** files and assert they
stay byte-identical afterwards.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/public/css-legacy/global.css` | delete `--colors-*` block (26–33); repoint 5 `var(--colors-white)`; comma fix at 266 |
| `bfna-website-nuxt/public/global.css` | identical edit (served duplicate) |
| `bfna-website-nuxt/src/public/css/tokens/semantic-colors.css` | drop duplicate `--color-neutral` (39); reorder `--color-fail` before `--color-error` |
| `bfna-website-nuxt/src/public/css/utils/typography-utils.css` | delete the `.icon, .material-icons` rule |
| `docs/ds-epic/issues/06-token-hygiene.md` | append Decisions section |
| `docs/plans/gh15-plan.md` | this file |

No `.vue` file is touched. No file under `pages/wireframes/`,
`components/wireframe/`, `layouts/wireframe.vue` or `public/css/wireframe.css`
is touched.

## Test strategy

```bash
cd bfna-website-nuxt
npx nuxt typecheck 2>&1 | grep -cE 'error TS'          # gate: <= 178 baseline
npx nuxt generate                                       # DoD-1, exit 0
npm run validate:tokens                                 # 0 errors
grep -c -- '--colors-' src/public/css-legacy/global.css # must be 0
grep -c -- '--colors-' public/global.css                # must be 0
grep -c -- '--color-neutral' src/public/css/tokens/semantic-colors.css  # must be 1
grep -c 'Material Icons' src/public/css/utils/typography-utils.css      # must be 0
md5 -q public/global.css src/public/css-legacy/global.css               # must match
```

Browser: serve `.output/public` and read back computed styles on
`/wireframes/index` (light + dark) and `/docs`, plus a regression pass on
probe `/bf-probe/03-composition-gap-api` (issues 03/04/05 assertions).
Because no `.icon`/`.material-icons` element exists on either acceptance
page, the expected diff is *no* visual change at all — which is the check.

## Risks

1. **Repointing to a differently-valued `--color-white`.** Mitigated by the
   arithmetic above (`hsla(0,0%,100%,1) === #FFFFFF`) and by the fact that
   `global.css` never co-loads with the design-token sheet. Verified by
   reading back computed `color` on a `.card__brow > span` if any legacy
   page is reachable in the generated output.
2. **Fixing the comma changes rendering.** Cannot: the token has no
   consumers. Grep-verified.
3. **Dropping `.material-icons` breaks legacy icons.** Cannot: those pages
   never loaded this sheet and get the class from Google's hosted CSS.
   Grep-verified across layouts.
4. **Editing the served `public/global.css` counts as scope creep.** It is
   the same file content under a second tracked path, and the issue's
   acceptance explicitly reads `public/`. Leaving it stale would both fail
   acceptance and desynchronise a duplicate. Recorded as a decision.
5. **`typography-utils.css` becomes an empty `@layer utils {}`.** Harmless;
   the file and its `styles.css` import are kept so the change stays a pure
   deletion. A comment records where `.icon` now lives.
