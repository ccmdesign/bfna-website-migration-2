# gh#251 — Programme colour tokens: three tiers behind `[data-program]`

Issue: <https://github.com/ccmdesign/bfna-website-migration-2/issues/251>
Epic: <https://app.plane.so/ccm-design/browse/BF-220/>
Parent plan: `docs/plans/bf220-design-phase-wave-1-plan.md` §Phase 1
Blocked-by: #250 (merged — the contrast gate)

Authored by hand rather than by `ce-plan`. The whole of this issue is one tightly
constrained decision — what the three tiers resolve to, given a ratchet that fails both
when a colour stays broken *and* when a colour is repaired without deleting its excuse —
and that decision needed the measurements below before a plan could say anything useful.
Recording it here is the plan.

---

## 1. Ground truth, measured before touching anything

`npm run check:contrast` on `dev@fb527ce`, and `node` re-implementations of the gate's own
`hslToRgba` / `relativeLuminance` / `contrastRatio` for the candidate sweep.

| pair | today | verdict |
| --- | --- | --- |
| `--color-text` on `--color-surface-page` | 20.03 | pass |
| `--color-text-inverse` on `--color-surface-inverse` | 20.03 | pass |
| `--color-link` on `--color-surface-page` | 6.25 | pass |
| white on `--color-green` (teal, `#027A8D`) | 5.03 | pass |
| white on `--color-red` (`#D0495B`) | **4.39** | KNOWN FAIL `[#251]` |
| white on `--color-yellow` (amber, `#EEAC49`) | **1.98** | KNOWN FAIL `[#251]` |

Ten further pairs are `⏳ not yet defined`: the nine programme pairs this issue creates,
plus `white-on-scrim`, which waits on the hero phase.

Other baselines on `dev`, so "unchanged and green" can be checked honestly:

- `npm run validate:tokens` — exit 0, 0 errors, **1 pre-existing warning** ("Layer order may
  not be optimal"). See §6.
- `npm run lint:css` — **exit 2 already**, 422 errors. **Zero** of them are in
  `tokens/primitive-colors.css` or `tokens/semantic-colors.css`. The acceptance this issue
  can honestly meet is *no new stylelint finding in the files it edits*, not a green run.
- `npm run check:contrast:self-check` — 14/14.

## 2. The nine pairs this issue switches on

`scripts/check-contrast.ts:706-741` already declares, per programme:

| id | assertion | floor |
| --- | --- | --- |
| `program-on-light--<slug>` | `--color-program-on-light` on `--color-surface-page` | 4.5 |
| `program-on-dark--<slug>` | `--color-program-on-dark` on `--color-scrim` over the page | 4.5 |
| `white-on-program--<slug>` | white on `--color-program` | 4.5 |

Two mechanics govern them:

- **`requireScoped`** (`check-contrast.ts:926-935`) — the token must resolve from a scope
  that is not `:root`. Declaring `--color-program*` under `:root, [data-program]` satisfies
  it: `record()` splits the selector list and files the declaration under **both** keys, and
  the lookup chain (`[data-program="<slug>"]` → `[data-program]` → `:root`) hits
  `[data-program]` first.
- **`pendingFrom: '#251'`** — a pair is excused only for a token **it names itself**. The
  three `program-on-dark--*` pairs name `--color-scrim`, which does not exist and is not in
  this issue's scope, so they stay `⏳ pending` even once `--color-program-on-dark` is
  defined. Their values therefore **cannot be verified by the gate in this PR**; §4 states
  what they are measured against instead.

## 3. The decision the ratchet forces — and the one place it cannot be obeyed

`docs/decisions/gh250-contrast-gate-known-failures.md` §3 instructs gh#251 to delete **both**
`KNOWN_FAILURES` rows and update `SHIPPED_BASELINE` for "red's and amber's hex and ratio".
Red is straightforward. Amber is not, and the two halves of #250's own record disagree
about it:

- §3 says gh#251 updates amber's hex — i.e. the `--hsl-yellow` **primitive** moves.
- The amber row's own `why` text says the opposite: *"the chip itself must use dark text on
  an amber tint, not white on amber"* — i.e. the pair is a false premise, not a broken colour.
- The parent plan settles it. `bf220-design-phase-wave-1-plan.md:139` specifies the
  white-vs-`--color-program` pair as the one that **"records that amber fails at 1.98 and
  must use dark-text-on-tint, rather than silently passing"**, and its mapping table pins
  `--hsl-yellow` at `36, 83%, 61%`.

Moving the amber primitive to the only lightness that clears white (`36, 83%, 35%` → 4.62)
is not a 1% nudge like red's — it takes `#EEAC49` to `#A3680F`, a dark ochre. It would
repaint `--color-tertiary`, `--color-warning`, the whole amber tint/shade/alpha ladder, the
utility classes, `ccmButton.vue:354`, `ccmFormField.vue:285`, and **`bf/Notice.vue:52-60`,
whose block comment records a measurement of `--color-warning` on its own tint-11 ground**
that this change would silently invalidate. That is a palette repair in a merged component,
not a programme-token issue, and issue #251 explicitly fences pre-existing token debt out of
its scope.

**Decision: do not move `--hsl-yellow`.** Consequences, stated plainly:

1. `white-on-amber` still fails at 1.98. Its `KNOWN_FAILURES` row **stays**, and
   `SHIPPED_BASELINE`'s amber entry stays `#EEAC49` / 1.98. The ratchet is not violated —
   the row is stale only when its pair *passes*, and it does not.
2. `npm run check:contrast` (strict) therefore still exits 1, on that one pre-existing pair.
   `npm run check:contrast:ci` — what `verify.yml` runs — is **green**, and the self-check's
   strict assertion is written as `exit === (KNOWN_FAILURES.length > 0 ? 1 : 0)`, so it holds
   with one row as it did with two.
3. Removal is filed as a residual: repairing the amber primitive is a token-hygiene change
   with its own blast radius and its own review.

The standard this PR *does* meet, which is the one worth holding: **every token it
introduces clears its floor.** It ships no new failing colour and it shrinks the allowlist
from two rows to one without adding any.

## 4. The tiers

Measured with the gate's own maths (8-bit rounded, css-color-4 `f(n)`), `#FFFFFF` as the
page ground and `#080808` (`--color-surface-inverse`) as the dark ground.

| scope | `--hsl-program` | `--hsl-program-on-light` | `--hsl-program-on-dark` |
| --- | --- | --- | --- |
| `:root` (neutral) | `var(--hsl-navy)` `#003C5C` 11.66 | `var(--hsl-navy)` 11.66 | `201, 100%, 45%` `#0095E6` 6.14 |
| `democracy` | `var(--hsl-green)` `#027A8D` 5.03 | `188, 97%, 29%` `#027F92` 4.72 | `188, 97%, 41%` `#03B3CE` 7.96 |
| `future-leadership` | `var(--hsl-red)` `#CF4457` 4.55 | `352, 59%, 54%` `#CF4457` 4.55 | `352, 59%, 67%` `#DC7986` 6.79 |
| `transatlantic-…` | `36, 83%, 35%` `#A3680F` 4.62 | `36, 83%, 35%` `#A3680F` 4.62 | `36, 83%, 48%` `#E08F15` 7.73 |

Three things in that table need saying out loud.

**Red's primitive moves, from `352, 59%, 55%` to `352, 59%, 54%`.** `#D0495B` → `#CF4457`;
4.39 → 4.55. One point of lightness, invisible, and it is what the `KNOWN_FAILURES` row
itself prescribes ("gh#251 moves it to 352, 59%, 54%"). It clears AA for `--color-fail` and
`--color-error` as text everywhere, not only in the programme axis. Red's row is deleted and
`SHIPPED_BASELINE` red becomes `#CF4457` / 4.55.

**Amber's raw tier is `36, 83%, 35%`, not `var(--hsl-yellow)`.** The gate asserts white on
`--color-program` at 4.5 for every programme, and bright amber measures 1.98 there. Seeding
the raw tier from the bright primitive would put a hard, un-allowlisted failure into CI. The
programme axis therefore carries the deepest amber that can hold white text, and the bright
amber stays exactly where it is, as `--color-yellow` / `--color-warning` / `--color-tertiary`,
untouched. For this one programme the raw and on-light tiers coincide; that is a fact about
amber, not a modelling error, and it is commented as such in the file. Whether the programme
axis should also expose a bright, non-text-bearing amber fill is a design question for the
consumers in #252/#253, and is filed as a residual rather than guessed at here.

**`--hsl-program-on-dark` is not gate-verified in this PR** (§2). Each value is the
lightest-tier hue chosen to clear 4.5 on `--color-surface-inverse` with real headroom
(6.14–7.96), because the scrim ground that eventually measures it composites *lighter* than
`#080808`. Teal's `188, 97%, 41%` is the parent plan's own value, kept; the other three are
its analogues. The parent plan already warns (`:171`) that on-dark programme hues "do not
survive over media" at workable alpha, so the hero phase may revisit these — that is the
phase that will have a scrim to measure against.

## 5. Shape of the edit

`src/public/css/tokens/semantic-colors.css`, appended after the existing `:root` block,
inside `@layer tokens`:

```css
[data-program="democracy"] { --hsl-program: var(--hsl-green); --hsl-program-on-light: …; --hsl-program-on-dark: …; }
[data-program="future-leadership"] { … }
[data-program="transatlantic-relations-global-challenges"] { … }

:root {
  --hsl-program: var(--hsl-navy);        /* neutral default, off a programme route */
  --hsl-program-on-light: var(--hsl-navy);
  --hsl-program-on-dark: 201, 100%, 45%;
}

:root, [data-program] {
  --color-program: hsl(var(--hsl-program));
  --color-program-on-light: hsl(var(--hsl-program-on-light));
  --color-program-on-dark: hsl(var(--hsl-program-on-dark));
}
```

Constraints held: bare comma triplets throughout (the 21-step alpha ladder parses
`hsl(var(--hsl-x), 0.4)`); seeded from `--hsl-green` / `--hsl-red` / the amber literal, never
from `--color-success` / `--color-fail` / `--color-warning`; no `--theme-*` namespace
(`composition/stack.css:7`, `center.css:51`, `box.css:3-4`); `hsl` only, no `oklch`; double
quotes in every `[data-program="…"]` selector.

`scripts/check-contrast.ts`: delete the `white-on-red` row from `KNOWN_FAILURES`; update
`SHIPPED_BASELINE`'s red entry to `#CF4457` / 4.55. Nothing else — not the pair table, not
the scope chains, not the workflow.

Slugs verified against `content/bf/programs/*.json`: `democracy`, `future-leadership`,
`transatlantic-relations-global-challenges`.

## 6. Verification

1. `npm run check:contrast` — all nine programme pairs live and passing, `white-on-red`
   passing at 4.55, one known failure remaining (`white-on-amber`), exit 1.
2. `npm run check:contrast:ci` — exit 0.
3. `npm run check:contrast:self-check` — 14/14, including the ratchet and mutation groups.
4. `npm run validate:tokens` — 0 errors; still exactly the one pre-existing layer-order
   warning.
5. `npm run lint:css` — no new finding in the two token files (both are clean today).
6. **The alpha ladder, proved not assumed** — resolve a `--color-*-alpha-*` token through a
   headless CSS parse and confirm it still yields a four-argument `hsl()`, and confirm
   `--hsl-program` splices the same way. A `hsl()` wrapper leaking into an `--hsl-*` token is
   the one edit here that breaks 63 shipped tokens silently.
7. `npx nuxi typecheck` — no new diagnostics against the 90-diagnostic baseline
   (`docs/decisions/gh236-ci-verify-workflow.md`).

## 7. Out of scope, noted not fixed

- `semantic-colors.css:103-104` — `--color-*-super-dark` is *lighter* than `--color-*-dark`
  for seven families. Belongs to `docs/ds-epic/issues/06-token-hygiene.md`.
- ~48 utility classes referencing undefined `--color-black-shade-*`. Same owner.
- **`scripts/validate-tokens.ts:240`** — `expectedOrder` is
  `reset, defaults, tokens, themes, components, utils, overrides` and omits `composition`,
  which `src/public/css/styles.css:2` does declare. The omission is why every run warns
  "Layer order may not be optimal". Confirmed on `dev`; flagged per the issue, not fixed.
- No component consumes the new tokens. Wiring `data-program` onto the routes and the first
  consumers are #252/#253.
