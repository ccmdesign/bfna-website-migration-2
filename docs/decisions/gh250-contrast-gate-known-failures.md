# gh#250 — how the contrast gate reports colour that already fails

Context: gh#249 retired the ds-epic BRIEF's D5 / §5 rule 2 ("no new colours") and
replaced it with "add no colour that **fails its measured floor**". gh#250 builds the
instrument that measures — `bfna-website-nuxt/scripts/check-contrast.ts`. The instrument
was built before the palette was fixed, deliberately: gh#251's repair should be verified
by something written before the answer was known.

The first thing the instrument reported is that the palette **already fails**. Two
shipped primitives do not clear WCAG AA against white:

| primitive | hex | on `#FFFFFF` | verdict |
| --- | --- | --- | --- |
| `--hsl-green` (teal) | `#027A8D` | **5.03** | pass |
| `--hsl-red` | `#D0495B` | **4.39** | fail |
| `--hsl-yellow` (amber) | `#EEAC49` | **1.98** | fail |

That creates a circular problem. A gate that fails is a red required check on `dev`.
gh#251 — the PR that repairs red and amber — has to merge through that check. The gate
would block the fix it exists to demand.

## 1. The choice: a dated known-failing allowlist, not report-only

Two ways out were available.

**Report-only on `dev`.** Run the gate with `continue-on-error: true` (or `|| true`)
until gh#251 lands, then flip it to blocking.

**A known-failing allowlist.** Name the two failing pairs in the script itself, with the
issue that owns each, and excuse only those from the exit code.

The allowlist was taken. Report-only was rejected on three counts:

1. **It is decorative.** A step that cannot fail is a step nobody reads. The failing
   ratios would scroll past in a green run, which is functionally identical to not having
   the gate.
2. **It excuses everything, not two things.** Report-only suppresses a *new* regression
   just as thoroughly as the two known ones. The whole point of gh#250 is that a palette
   edit gets caught; a mode where no palette edit can fail CI defeats it on day one.
3. **Nothing turns it back on.** "Flip it to blocking when gh#251 lands" is a promise
   held in a person's head. There is no mechanism, and the repo has a documented history
   of exactly this failure — `docs/ds-epic/issues/37-bf-hero.md:161-177` records a
   `grep -Lq` acceptance check that was inverted, and therefore never tested what it
   claimed, from gh#46 until gh#249 finally wrote the negation back into the acceptance
   block a fortnight ago. A gate whose correction depends on someone remembering is a
   gate that stays broken for months.

## 2. How the allowlist works

`KNOWN_FAILURES` in `scripts/check-contrast.ts` is a list of `{ pairId, issue, why }`.

- **`npm run check:contrast`** — the default, and what a developer runs locally — is
  **strict**. An allowlisted pair is verdicted `❌ FAIL` like any other and counts toward
  the exit code; the allowlist survives only as the `[#251]` annotation on the row and
  the explanation printed below the summary. The run prints `teal 5.03 PASS`,
  `red 4.39 FAIL`, `amber 1.98 FAIL` and exits 1. This is what gh#250's acceptance
  criterion measures, and it stays true until gh#251 lands.
- **`npm run check:contrast:ci`** — what `.github/workflows/verify.yml` runs — passes
  `--allow-known`. Allowlisted pairs print as `🟡 KNOWN FAIL … [#251]`, with the reason
  and the owning issue, and do not set the exit code. Every pair **outside** the
  allowlist fails hard, from the first run.

So the failure is loud in CI logs and in every local run, and the one PR that can fix it
is not blocked.

## 3. Why it is a ratchet and not an escape hatch

An allowlist that only ever grows is worse than no gate. This one cannot.

- An entry whose pair **now passes** is reported as a *stale allowlist entry* and is a
  hard failure (exit 2), excused mode or not. gh#251 therefore cannot repair amber
  without deleting amber's row in the same PR — and cannot delete the row without
  repairing the colour.
- An entry naming a `pairId` that is not in the gate's pair table is likewise a hard
  failure, so the list cannot rot as the table changes.
- Every entry carries the issue that removes it. Nothing may be added without one.

The list has two rows today. When gh#251 merges it has none, and
`npm run check:contrast` and `npm run check:contrast:ci` give the same verdict — at
which point `--allow-known` is dead weight and can be dropped from the workflow.

**What gh#251 must change in this gate, and nothing else.** Two constants, in one
commit, alongside the palette edit:

1. `KNOWN_FAILURES` — delete both rows. The ratchet forces this.
2. `SHIPPED_BASELINE` — update red's and amber's hex and ratio. That constant is the
   resolver lock the self-check asserts against (§5.2); a palette repair that leaves it
   stale fails the **self-check** rather than the gate, with a message saying so.

The pair table, the scope chains and the workflow need no edit — see §4 and §6.

## 4. Pairs whose tokens do not exist yet

The gate asserts ten pairs that reference `--color-program`, `--color-program-on-light`,
`--color-program-on-dark` and `--color-scrim`. None of those tokens exists on `dev`
today: the programme tokens land in gh#251 and the scrim in the hero phase.

These are reported as `⏳ not yet defined`, a notice, **not** a failure. Asserting them
now would be the same circularity as above in a different costume. They go live the
moment their tokens land, with no edit to this gate.

The distinction is enforced twice over, because "not yet defined" is the easiest place
in this gate to hide a real defect:

- A pair may only be *pending* if it declares the issue that introduces its tokens. A
  missing token on any pair that does **not** declare one is a hard error, so a token
  vanishing from the sheet is caught rather than quietly downgraded.
- A pending pair is excused only for a token **it names itself**. A miss deeper in the
  var chain — a typo inside a token that does exist, say `var(--color-wihte)` — is a hard
  error. Without that narrowing, one transposed letter inside a defined token reads as
  `⏳ --color-wihte not yet defined` and the run goes green.

And once a programme's tokens do exist, `requireScoped` asserts they resolved from a
`[data-program="…"]` scope rather than the `:root` default. A mistyped or missing
programme block would otherwise measure the neutral default and report it under the
programme's label — three programmes all reporting teal's 5.03. Scope keys are
normalised (attribute quoting, whitespace) so `[data-program='x']` and
`[data-program="x"]` cannot become two keys, one of which matches nothing.

## 5. Self-check, because a gate that cannot bite is not a gate

`npm run check:contrast:self-check` runs in CI **before** the gate, and is never
excused. Fourteen assertions in four groups:

1. **The maths**, against published WCAG reference values — `#000` on `#FFF` = 21.00,
   `#FFF` on `#FFF` = 1.00, `#777777` on `#FFF` = 4.48, and symmetry. A broken luminance
   formula is caught independently of any token.
2. **The resolver**, against the recorded baseline — teal resolves to `#027A8D` at 5.03,
   red to `#D0495B` at 4.39, amber to `#EEAC49` at 1.98. This locks HSL→sRGB, `var()`
   following and 8-bit rounding together; any one drifting moves these numbers.
3. **The bite.** The token directory is copied to a temp dir, `--hsl-black` is rewritten
   from `0, 0%, 3%` to `0, 0%, 92%`, and the whole pipeline is re-run against the copy
   through `--tokens-dir`. `--color-text` on `--color-surface-page` must come back
   **failing** (it measures 1.19), and `--allow-known` must **not** excuse it — a new
   failure is a hard failure, not a known one.
4. **The exit code**, not merely the verdict. This group exists because the first three
   can all pass while CI stays green: an evaluator that finds a failure and an exit code
   that ignores it is still a green run, and the earlier draft of this self-check
   inspected verdicts only. So it now calls `report()` itself and asserts the number it
   returns — 1 on the strict palette, 0 under `--allow-known`, non-zero in both modes on
   the mutated palette, and 2 on a fixture where an allowlisted colour has been repaired
   but its row not deleted (the ratchet, end to end).

   The strict-run assertion is stated as `exit === (KNOWN_FAILURES.length > 0 ? 1 : 0)`
   rather than a hard `1`, so gh#251 does not have to edit it.

## 6. Two implementation choices worth recording

**8-bit rounding is load-bearing.** HSL→sRGB rounds to integer channels before the
luminance maths, because a browser paints 8-bit channels and the ratio a reader
experiences is the ratio of the rounded colour. Amber is the case that proves it:
unrounded it measures 1.9736, rounded 1.9751 — either side of the 1.98 this issue
records, once `toFixed(2)` has had its say. Measure what ships.

For the same reason the conversion uses css-color-4's own `f(n)` reference formulation
rather than the piecewise-sector form. The two disagree by ±1/255 on roughly 0.03% of
hues, where a channel lands exactly on `.5` — irrelevant almost everywhere, and not
irrelevant in a gate whose entire job is to adjudicate pairs sitting near 4.50.

**The parser is scope-aware, unlike `validate-tokens.ts`.** That script flattens every
declaration into one `Map`, which is correct for its checks. It would be wrong here:
gh#251 declares `--hsl-program` four times over — once inside each `[data-program="…"]`
block plus a `:root` default — and a flat map keeps whichever came last, so the gate
would measure one programme's colour and report it as all three. `check-contrast.ts`
indexes declarations by selector and resolves along a scope chain
(`[data-program="democracy"]` → `[data-program]` → `:root`). This costs nothing today
and is why gh#251 needs no second edit here.

## 7. A note on "alongside the existing `validate:tokens`"

The parent plan (`docs/plans/bf220-design-phase-wave-1-plan.md:142`) says to wire the
gate "as `npm run check:contrast`, alongside the existing `npm run validate:tokens`, and
add to `.github/workflows/verify.yml`". Both halves are done: the npm script sits next to
`validate:tokens` in `package.json`, and the workflow gained two steps.

A first reading of that sentence — "add `validate:tokens` **to** `verify.yml`" — is not
what it says, and would have been out of scope anyway. But the observation underneath it
is true and worth recording separately: **`verify.yml` does not run `validate:tokens` at
all.** It runs the typecheck gate, `nuxt generate`, `check-routes` and `check-links`. The
token validator has never been part of CI. That is a real gap, filed as a residual rather
than smuggled in here.
