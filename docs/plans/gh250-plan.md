# gh#250 — the contrast gate (`scripts/check-contrast.ts`)

Subtask of the BF-220 design phase, wave 1. Parent plan:
[`docs/plans/bf220-design-phase-wave-1-plan.md`](bf220-design-phase-wave-1-plan.md),
Phase 1 § "The gate — this is what makes the tiers real".

## Context

#249 retired the ds-epic BRIEF's D5 / §5 rule 2 — "add no colour". The replacement
rule stated there is "add no colour that **fails its measured floor**". That rule is
currently unenforceable: there is no contrast function and no colour utility anywhere
in the repository. Every ratio in the codebase is a hand-written comment
(`src/components/Button.vue:61`, `docs/ds-epic/issues/41-bf-notice.md:141-143`) that
nothing recomputes, so a palette edit cannot be caught.

This change adds the measuring instrument. It does **not** fix the palette — the
programme tokens and the amber repair land in #251. The gate exists first, on purpose,
so #251's fix is verified by something that was written before the answer was known.

## What already exists that this must mirror

`bfna-website-nuxt/scripts/validate-tokens.ts` is the house form for a token gate:
a class with a `parseTokenFiles()` regex pass, per-check methods that push into
`errors[]` / `warnings[]`, a `console.log` section per check, and a `main()` that
prints a boxed summary and `process.exit(0|1)`. `check-contrast.ts` follows the same
shape, the same emoji-prefixed reporting, and the same exit-code discipline.

## The colour model

Token files: `bfna-website-nuxt/src/public/css/tokens/{primitive-colors,
primitive-colors-shades-and-tints,semantic-colors,semantic-colors-shades-and-tints}.css`.

Four value forms have to resolve, and the resolver must handle all four plus
indirection through `var()`:

| form | example | note |
|---|---|---|
| bare HSL triplet | `--hsl-navy: 201, 100%, 18%` | the storage form; **not** a colour on its own |
| `hsl()` wrapper | `--color-navy: hsl(var(--hsl-navy))` | the consumable form |
| `hsl()` + alpha | `--color-primary-alpha-40: hsl(var(--hsl-primary), 0.4)` | needs a backdrop to composite over |
| `color-mix` | `color-mix(in srgb, var(--color-base) 73%, white 27%)` | gamma-encoded sRGB lerp, per spec |

Plus `var(--x)` pure aliasing (`--color-primary: var(--color-blue)`), the `white` /
`black` keywords that appear inside `color-mix`, and hex literals for the pairs that
are asserted against a fixed colour rather than a token.

**No `oklch`.** It is forbidden by the brief; the resolver rejects it rather than
supporting it, so a smuggled `oklch()` value fails the gate loudly.

**No colour library.** sRGB → relative luminance → WCAG ratio is ~20 lines written
inline, per the acceptance criteria.

### Scope-aware parsing

`validate-tokens.ts` flattens every declaration into one `Map`, which is fine for its
checks. It is **not** fine here: #251 introduces `--hsl-program` three times over, once
per `[data-program="…"]` block, plus a `:root` default. A flat map would keep only the
last one and silently assert the wrong programme.

So the parser tracks the selector each declaration sits under (brace-walking through
the `@layer tokens { … }` wrapper, comments stripped first) and stores declarations
keyed by `selector` → `name` → `value`. Resolution takes a scope chain — e.g.
`['[data-program="democracy"]', ':root']` — and takes the first hit. That makes the
gate correct for #251 the day #251 lands, with no second edit here.

## The assertion table

A declarative list, one row per pair: foreground, background, floor, label, and an
`optional` flag for tokens that do not exist yet.

| # | foreground | background | floor | today |
|---|---|---|---|---|
| 1 | `--color-text` | `--color-surface-page` | 4.5 | passes (near-black on white) |
| 2 | `--color-text-inverse` | `--color-surface-inverse` | 4.5 | passes |
| 3 | `--color-link` | `--color-surface-page` | 4.5 | measured, reported |
| 4 | `#FFFFFF` | `--color-green` (teal `#027A8D`) | 4.5 | **5.03 PASS** |
| 5 | `#FFFFFF` | `--color-red` (`#D0495B`) | 4.5 | **4.39 FAIL** |
| 6 | `#FFFFFF` | `--color-yellow` (amber `#EEAC49`) | 4.5 | **1.98 FAIL** — the chip case |
| 7 | `--color-program-on-light` | `--color-surface-page` | 4.5 | *not yet defined* (#251) |
| 8 | `--color-program-on-dark` | `--color-scrim` over `--color-surface-page` | 4.5 | *not yet defined* (#251) |
| 9 | `#FFFFFF` | `--color-scrim` over `#FFFFFF` | 4.5 | *not yet defined* (#251) |

Rows 4-6 are the acceptance baseline and are verified by hand-computed arithmetic
before a line of code is written: 5.035, 4.388, 1.975 respectively.

Rows 7-9 reference tokens #251 creates. They report **`not yet defined — #251`** as a
notice, not a failure. When #251 lands they become live with no edit to the table.

Row 9's background is a translucent scrim composited over an opaque ground — the
resolver's alpha-compositing path, exercised by the pair table rather than only by
the self-check.

## The CI question, and the choice

The gate **fails on today's palette**. That is the point: rows 5 and 6 are real,
shipped, and wrong. But a red required check on `dev` would block #251 — the PR that
fixes them — from merging.

**Decision: a dated known-failing allowlist, not report-only.** Recorded in
`docs/decisions/gh250-contrast-gate-known-failures.md`.

- The default invocation — `npm run check:contrast` — is **strict**. It ignores the
  allowlist and exits non-zero today, reporting `red 4.39` and `amber 1.98`. This is
  what the issue's acceptance criterion measures.
- CI runs `npm run check:contrast:ci`, which passes `--allow-known`. Allowlisted pairs
  are printed as `KNOWN FAIL (#251)` and do not set the exit code. Everything outside
  the allowlist fails hard from day one.
- The allowlist is a **ratchet**: an entry whose pair now *passes* is itself an error
  ("stale allowlist entry — remove it"). #251 cannot fix amber without deleting its
  entry in the same PR, and cannot delete an entry without fixing the colour.

Report-only-on-dev was rejected: it makes the gate decorative, gives no signal when a
*new* pair regresses, and has no mechanism that forces it back on.

## Proving the gate bites

`--self-check` is a mode of the same script, wired as
`npm run check:contrast:self-check`. Three assertions:

1. **Maths against reference values.** `#000` on `#FFF` = 21.00, `#FFF` on `#FFF` =
   1.00, `#777777` on `#FFF` = 4.48 — published WCAG figures, so a broken luminance
   formula is caught independently of the palette.
2. **Baseline is exactly what the issue claims.** teal 5.03, red 4.39, amber 1.98.
   Locks the resolver as well as the maths: any of hsl→rgb, `var()` following, or
   rounding going wrong moves these.
3. **It fails when a value is edited below its floor.** Copies the token directory to
   a temp dir, rewrites `--hsl-black` to a light value so `--color-text` vs
   `--color-surface-page` collapses, re-runs the full pipeline against the copy via a
   `--tokens-dir` override, and asserts the run reports a failure. If the mutated
   palette still comes back clean, the self-check exits non-zero.

The `--tokens-dir` override is what makes (3) possible without mutating the real tree.

## Files

| file | change |
|---|---|
| `bfna-website-nuxt/scripts/check-contrast.ts` | new — the gate |
| `bfna-website-nuxt/package.json` | new `check:contrast`, `check:contrast:ci`, `check:contrast:self-check` scripts |
| `.github/workflows/verify.yml` | new step running the CI variant |
| `docs/decisions/gh250-contrast-gate-known-failures.md` | new — the allowlist decision |
| `docs/plans/gh250-plan.md` | this file |

## Constraints

- `tsconfig.scripts.json` runs `strict: true` over `scripts/**/*.ts` and the CI
  typecheck gate compares against a 37-row baseline. The new script must add **zero**
  new diagnostics — no implicit `any`, every array index access guarded.
- No new dependency. `fs`, `path`, `os` only.
- Node 24, run under `tsx`, ESM.
- The issue text says "add to `verify.yml` alongside the existing `validate:tokens`".
  `validate:tokens` is **not** in `verify.yml` today — the workflow runs typecheck,
  build, `check-routes` and `check-links` only. Adding `validate:tokens` is out of
  scope for this issue; flagged as a residual rather than fixed here.

## Verification

1. `npm run check:contrast` → non-zero, reports teal 5.03 PASS / red 4.39 FAIL /
   amber 1.98 FAIL, and rows 7-9 as `not yet defined — #251`.
2. `npm run check:contrast:ci` → exit 0, the two known failures printed as
   `KNOWN FAIL (#251)`.
3. `npm run check:contrast:self-check` → exit 0.
4. `npm run typecheck:scripts` → no new diagnostics vs baseline.
5. `node .github/typecheck-gate.mjs` → passes.
