# gh#251 — programme colour tokens, and why amber's known failure survives

Context: BF-220 wave 1 gives the site back the mechanism production was built on — colour
carried by topic, one custom property recolouring everything under it. In v2 that survived
only in dead code (`css-legacy/global.css:274-289`). #251 adds the hook: three tiers per
programme in `bfna-website-nuxt/src/public/css/tokens/semantic-colors.css`, keyed by
`[data-program]`, with a neutral `:root` default. No component consumes them yet; that is
#252/#253.

The interesting part of this issue is not the tokens. It is that #250 shipped a contrast
gate with a **ratchet** — an excused failure that starts passing is itself a hard error —
and the brief for #251 said to clear the allowlist entirely. One of the two rows could not
be cleared without doing damage well outside this issue. This records why, and what was
done instead.

## 1. The tiers

Measured with the gate's own maths (css-color-4 `f(n)`, 8-bit rounded), against
`--color-surface-page` (`#FFFFFF`) and `--color-surface-inverse` (`#080808`).

| scope | `--color-program` | `--color-program-on-light` | `--color-program-on-dark` |
| --- | --- | --- | --- |
| `:root` (neutral) | navy `#003C5C` — white on it 11.66 | `#003C5C` — 11.66 on page | `#0095E6` — 6.14 on inverse |
| `democracy` | teal `#027A8D` — 5.03 | `#027F92` — 4.72 | `#03B3CE` — 7.96 |
| `future-leadership` | red `#CF4457` — 4.55 | `#CF4457` — 4.55 | `#DC7986` — 6.79 |
| `transatlantic-relations-global-challenges` | amber `#A3680F` — 4.62 | `#A3680F` — 4.62 | `#E08F15` — 7.73 |

Mapping is production's real assignment **as measured on the live site** (Democracy green,
Future Leadership red, Transatlantic inheriting Politics & Society's orange) — not the dead
legacy block, which has green and yellow swapped; see §8. `--hsl-navy` and `--hsl-blue` stay
out of the programme axis so `--color-accent` and `--color-primary` keep carrying the
neutral interface spine.

Six of the nine gate pairs are live and passing. The three `program-on-dark--*` pairs stay
`⏳ not yet defined` because they measure against `--color-scrim`, which lands in the hero
phase — so those three values are **not** gate-verified by this PR. They are chosen to clear
4.5 on `--color-surface-inverse` with real headroom, because the eventual scrim ground
composites *lighter* than `#080808` and will be harder. The parent plan
(`bf220-design-phase-wave-1-plan.md:171`) already warns these hues "do not survive over
media" at a workable alpha; expect the hero phase to revisit them.

## 2. Red's primitive moved. That was the easy one.

`--hsl-red` goes from `352, 59%, 55%` to `352, 59%, 54%` — `#D0495B` → `#CF4457`, 4.39 →
4.55 on white. One point of lightness; no eye resolves it. It is exactly what the
allowlist row prescribed, and it clears AA for `--color-fail` and `--color-error` as text
everywhere, not only inside the programme axis. Row deleted; `SHIPPED_BASELINE`'s red entry
updated to `#CF4457` / 4.55, which is what the self-check's resolver lock now asserts.

## 3. Amber's primitive did not move, and its row stays

The brief — both the orchestrating issue and
`docs/decisions/gh250-contrast-gate-known-failures.md` §3 — says #251 updates "red's and
amber's hex and ratio" and deletes both rows. #250's record is internally inconsistent on
this point, and the inconsistency is worth naming rather than silently resolving:

- §3 says gh#251 updates amber's hex, which can only mean moving the `--hsl-yellow`
  primitive.
- The amber row's own `why` text says the opposite: *"the chip itself must use dark text on
  an amber tint, not white on amber"* — that is, the failing pair encodes a false premise
  about the component, not a broken colour.
- The parent plan settles it. `bf220-design-phase-wave-1-plan.md:139` specifies the
  white-vs-`--color-program` pair as the one that **"records that amber fails at 1.98 and
  must use dark-text-on-tint, rather than silently passing"**, and its mapping table pins
  `--hsl-yellow` at `36, 83%, 61%`.

The measurements decide it. Bright amber is `#EEAC49` at **1.98:1** on white — not
marginal, below even the 3:1 large-text floor. The lightest value at `h 36, s 83%` that
clears 4.5 is **`36, 83%, 35%` → `#A3680F` at 4.62**, a dark ochre. That is not red's
invisible one-point nudge; it is a different colour. Moving the primitive there would
repaint:

- `--color-tertiary` and `--color-warning`, and through them the entire amber
  tint/shade/alpha ladder;
- the utility classes in `css/utils/color-utils-*.css`;
- `ds/molecules/ccmButton.vue:354` and `ds/molecules/ccmFormField.vue:285`;
- **`bf/Notice.vue:52-60`**, whose block comment records a measurement of `--color-warning`
  against its own tint-11 ground — a number this change would silently invalidate in a
  merged, reviewed component.

That is a palette repair with its own blast radius and its own review. #251 explicitly
fences pre-existing token debt out of scope, and this is pre-existing token debt.

**So: `--hsl-yellow` is untouched, `white-on-amber` still measures 1.98, and its
`KNOWN_FAILURES` row stays.** The ratchet is not violated — a row is stale only when its
pair *passes*, and this one does not. `npm run check:contrast` (strict) exits 1 on that one
pair; `npm run check:contrast:ci`, which `verify.yml` runs, is green; the self-check's
strict-exit assertion is written as `exit === (KNOWN_FAILURES.length > 0 ? 1 : 0)` and holds
with one row as it did with two. The row's `why` text was rewritten to say what is now true
— that the failure was left deliberately, and why — rather than continuing to promise a fix
that has already been decided against.

Removing the last row is filed as a residual.

## 4. How the amber programme is coloured, given that

The gate asserts `white on --color-program ≥ 4.5` for **every** programme. Seeding the
transatlantic raw tier from bright `var(--hsl-yellow)` would therefore have put a hard,
un-allowlisted failure into CI — a new failure, which `--allow-known` correctly refuses to
excuse.

So that one programme's raw tier is a literal `36, 83%, 35%` rather than a `var()` onto the
primitive. It is the deepest amber that can carry white text, which is why the raw and
on-light tiers coincide there and nowhere else. That is a fact about amber at this hue and
saturation, not a modelling error, and the file says so at the point of declaration.

The consequence to be aware of: **the programme axis has no bright amber.** Fills, rules and
chip grounds for Transatlantic read as deep ochre. If the design wants the bright amber back
for large, non-text-bearing surfaces, that is a fourth tier — a tint token with a 3:1
large-text or non-text floor rather than 4.5 — and it belongs with the consumers in
#252/#253, where there is something on screen to judge it against. Filed as a residual
rather than guessed at here.

## 5. The standard this PR actually meets

Not "the allowlist is empty". That was not achievable without unrelated damage. The standard
is narrower and, for a token PR, the one that matters:

> Every token this change introduces clears its floor, and the allowlist shrank without
> anything being added to it. Two rows became one.

## 6. Constraints held

- **`--hsl-*` stay bare comma triplets.** Verified in a real CSS engine, not by inspection:
  a probe page loading all four token files resolved **63/63** `--color-{primary,secondary,accent}-alpha-*`
  tokens to valid `rgba()`, and `hsl(var(--hsl-program), 0.4)` spliced correctly in all four
  scopes (`rgba(2, 122, 141, 0.4)` under `democracy`, and so on). The new `--hsl-program*`
  tokens are ladder-compatible.
- **Scoping verified in the same engine.** `--color-program` computes to `#003C5C` at
  `:root`, `#027A8D` / `#CF4457` / `#A3680F` under the three `[data-program]` values, and
  inherits into a child element — matching the gate's resolved hexes exactly. A browser
  probe is not a checked-in artefact, which is part of why §7.1's repaired `requireScoped`
  matters: it is the check that runs on every commit.
- Seeded from the primitives, never from `--color-success` / `--color-fail` /
  `--color-warning`, so the programme and status axes can still diverge.
- No `--theme-*` namespace (taken by `composition/stack.css:7`, `center.css:51`,
  `box.css:3-4`). `hsl` only, no `oklch`. Double-quoted attribute values in every
  `[data-program="…"]` selector.
- **Source order matters and is deliberate.** `:root` and `[data-program="x"]` have equal
  specificity, so if the attribute ever lands on `<html>` itself, order decides. The neutral
  default is declared first so the programme block wins.

## 7. Edits to the gate beyond the two constants

`gh250-contrast-gate-known-failures.md` §3 says #251 changes two constants and nothing else.
Four edits go beyond that. Three are cosmetic; one is not, and it is the most important
thing in this record after §3.

**7.1 `requireScoped` was vacuous, and review caught it.** The gate refuses a programme pair
whose token resolved from `:root` — the guard against a mistyped `[data-program="…"]` block
reporting the neutral default under a programme's label. The pairs named
`--color-program*`, which this change declares **once**, in the shared `:root, [data-program]`
rule; only `--hsl-program*` varies per slug. So the named tokens always resolved from
`[data-program]` whether or not the slug block existed. Demonstrated, not theorised:
renaming `[data-program="democracy"]` to `democrasy` left the gate at **exit 0**, printing
`PASS 11.66:1 #003C5C on #FFFFFF … [democracy]` — navy under democracy's label. The gate
could go green while a programme rendered the wrong colour.

Each pair now requires its `--hsl-program*` half as well. Re-verified: the same sabotage is
two fatal resolve errors and **exit 2** under `--allow-known`; the clean tree still exits 0
and the self-check is 14/14. The alternative fix — declaring `--color-program*` inside each
slug block — was rejected: it triples the declarations to satisfy a check rather than making
the check test the right thing.

**7.2 The self-check's red mutation anchor went dead.** The ratchet assertion copied the
token dir and repaired both allowlisted primitives by literal string replace. Red's literal
`--hsl-red: 352, 59%, 55%;` no longer exists after §2, so that `.replace` became a no-op —
and worse, a non-matching literal propping up the `repaired === src` guard that is supposed
to catch exactly this staleness. Red also has no row left to make stale, so mutating it
proved nothing. The anchor is deleted; amber's, the one that still matters, is the whole
test.

**7.3 `pendingFrom` on the three `program-on-dark--*` pairs** was `'#251'`. Their own token
now exists; what is missing is `--color-scrim`. Left alone the report would say "lands in
#251" forever after #251 merged. It now reads `'the hero + scrim phase'`, matching the
sibling `white-on-scrim` pair. The field is tested for truthiness only, so no verdict, floor,
scope chain or exit code changes.

**7.4 The amber row's `issue` field** was `'#251'`, an issue that decided against the repair.
The list's own rule is that every entry names the issue that **removes** it, so the row now
points at #263, which owns the amber primitive repair.

**7.5 The header docblock** was rewritten to say that one row remains deliberately rather
than that #251 fixes both. Prose only.

## 8. Noted, not fixed

- `scripts/validate-tokens.ts:240` — `expectedOrder` is
  `reset, defaults, tokens, themes, components, utils, overrides` and omits `composition`,
  which `src/public/css/styles.css:2` declares. That omission is the sole source of the
  standing "Layer order may not be optimal" warning on every run. Flagged per the issue.
- `semantic-colors.css` — `--color-*-super-dark` is *lighter* than `--color-*-dark` for
  seven families, and ~48 utility classes reference undefined `--color-black-shade-*`. Both
  belong to `docs/ds-epic/issues/06-token-hygiene.md`.
- `npm run lint:css` exits 2 on `dev` with 422 pre-existing errors. This change adds none;
  the two token files it edits were clean before and are clean after.
- Both token files carry a banner pointing at `src/content/docs/tokens/{architecture,
  maintenance,guide}.md`, none of which exists in the repo. Pre-existing since `cab3a00b`.
- The mapping is taken from the live site. The dead legacy block this record cites for the
  *mechanism* (`css-legacy/global.css:274-289`) has green and yellow swapped — `.democracy`
  is yellow there and `.politics-society` green — the same reversal the wave-1 plan warns
  the old colour study carries. The file's comments now say so at the point of use.

## 9. Residuals raised by review

| # | what |
| --- | --- |
| #263 | Repair `--hsl-yellow` — removes the last allowlist row (§3) |
| #264 | The `:root` programme default and the on-dark tier ship unmeasured (§4, §7.3) |
| #265 | Two ADRs still record `--hsl-red` at 55% / `#D0495B` / 4.39 (§2) |
| #266 | `validate-tokens.ts:240` omits the `composition` layer (§8) |

---

## Addendum — mapping ratified 2026-09-04, against the legacy source

§3 above records a conflict: `css-legacy/global.css:274-289` maps `.democracy` → yellow
(`33, 100%, 49%` = `#FA8900`) and `.politics-society` → green (`153, 28%, 43%` =
`#4F8C71`). Both hexes match the live production site exactly, so the legacy block is
authoritative and the live-site *design review* that reported the reverse was wrong. This
file shipped Democracy on teal and Transatlantic on the amber lineage — i.e. **swapped
relative to production**.

That was an error in the issue spec, not in the implementation. It was put to the client
with the correction costed, and **the shipped mapping was kept deliberately**:

| Programme | v2 hue | Production ancestor |
| --- | --- | --- |
| `democracy` | teal | orange — **deliberately reassigned** |
| `future-leadership` | red | red — unchanged |
| `transatlantic-relations-global-challenges` | amber/ochre | green — **deliberately reassigned** |

Rationale: with four topics collapsing to three Programs the mapping could not survive
intact anyway, and the contrast gate forces amber to a deep ochre (`#A3680F`) that reads
poorly on the flagship programme. Teal on Democracy is the better result and the
reassignment is now on the record as a choice.

Consequence: this is a **partial rebrand of programme identity**, not pure evolution. Two
of three programme colours change hue family from production. Anything downstream that
assumes continuity with the live site — redirects, print collateral, social templates —
should be checked against this table rather than against `css-legacy`.

Future Leadership is the only programme whose colour carries across unchanged.
