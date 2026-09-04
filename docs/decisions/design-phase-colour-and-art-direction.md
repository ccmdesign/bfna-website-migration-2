# Colour and art direction in the design phase — D5 and §5 rule 2 are retired

Context: the `bf-*` design-system epic (`docs/ds-epic/BRIEF.md`) forbade colour outright.
It was right to. That epic built ~46 components and nine templates in sequence, each by a
different autonomous run, and a rule of "no new colour, no art direction" is the cheapest
way to stop fifty uncoordinated runs each inventing a palette. The components are built and
merged. The design phase
([BF-220](https://app.plane.so/ccm-design/browse/BF-220/),
[`docs/plans/bf220-design-phase-wave-1-plan.md`](../plans/bf220-design-phase-wave-1-plan.md))
now has to give the site a programme colour system, a hero that paints something, and an
article page with a type scale — none of which that rule permits. This record retires it,
dated 2026-09-04, and states what replaces it and what survives unchanged.

## 1. What is retired, and the third instance the issue did not name

Three lines carry the same rule, all in `docs/ds-epic/BRIEF.md`:

| line | id | text |
| --- | --- | --- |
| 52 | **D5** | "Base styling = existing Utopia space/type scale + existing colour tokens + CUBE composition… deliberately unbranded. **No art direction. No new colours.**" |
| 62 | **§5 rule 2** | "**Never add a colour.** No new hex/hsl literal, no new `--color-*` token." |
| 27 | **DoD-6** | "No new colour — `git diff $EPIC_BASE_SHA -- '*.css' '*.vue'` introduces no new colour literal or `--color-*` token" |

All three are retired for the design phase. DoD-6 is retired explicitly even though gh#249
named only the first two: it is the same rule wearing an epic-gate hat, and a record that
retired D5 while leaving DoD-6 standing would authorise a change that then fails the epic's
own definition of done. The three were always one rule stated three times.

They are retired **for work from BF-220 onward**. They were correct for the ds-epic and
nothing in this record is a criticism of them; a run that is still finishing ds-epic work
is still bound by them.

## 2. The brief is not edited — this record supersedes it

`docs/ds-epic/BRIEF.md` stays byte-identical. Its own §5 rule 8 says "**Never edit this
brief and never edit `issues.md`**", and that rule is load-bearing in a way the colour one
is not: fifty issue bodies link the brief as their unrestated context, and every merged
issue's journal is an argument about the text as it stood. Editing D5 in place would
silently rewrite the premise of forty-odd closed issues.

So the mechanism is supersession, which is also what the ds-epic itself does with D7
(Plane epics BF-150…BF-215 "are superseded" rather than deleted). The brief remains the
record of what the component phase decided; this file is the record of what the design
phase decided instead, and it wins where they disagree.

## 3. What replaces it: a measured floor, not an editorial one

The old rule was *no colour*. The new rule is **add no colour that fails its measured
floor**, and the floor is machine-checked rather than argued.

The reason for the change of form is that "no new colours" was never really about colour —
it was a proxy for two failure modes, uncoordinated palettes and inaccessible ones, and it
was a proxy precisely because nothing in the repo could measure the second. That is still
true today: there is no contrast function and no colour utility anywhere in this codebase.
Every ratio in the tree is a hand-written comment that nothing recomputes
(`src/components/bf/Button.vue:61`, `docs/ds-epic/issues/41-bf-notice.md:141-143`), so a
palette edit cannot regress a number that nothing computes.

Recomputed for this record from `src/public/css/tokens/primitive-colors.css`, against white
(`#FFFFFF`), by the WCAG 2.1 relative-luminance formula:

| primitive | value | hex | on white | AA text (4.5:1) |
| --- | --- | --- | --- | --- |
| `--hsl-green` (teal) | `188, 97%, 28%` | `#027A8D` | **5.03** | pass |
| `--hsl-blue` | `208, 50%, 38%` | `#306491` | 6.25 | pass |
| `--hsl-navy` | `201, 100%, 18%` | `#003C5C` | 11.66 | pass |
| `--hsl-red` | `352, 59%, 55%` | `#D0495B` | **4.39** | **fail** |
| `--hsl-yellow` (amber) | `36, 83%, 61%` | `#EEAC49` | **1.98** | **fail** |

Two of the five primitives the palette already ships fail AA as text on the page ground —
before any new colour is added. Amber is not marginal; at 1.98:1 it is below even the 3:1
large-text floor. The no-colour rule was protecting nobody from this, because the failing
values were already in the tree and the rule only forbade *new* ones.

The replacement is `bfna-website-nuxt/scripts/check-contrast.ts`, landing in
[#250](https://github.com/ccmdesign/bfna-website-migration-2/issues/250) and wired into
`.github/workflows/verify.yml`: it resolves the `--hsl-*` variable graph and asserts
declared pairs against WCAG floors, and its own acceptance requires it to report exactly
the baseline above and exit non-zero on it, plus a self-check proving it fails when a value
is edited below its floor. A gate that cannot bite is not a gate.

**Between this merge and #250's, the floor is asserted by hand.** That is the honest state
of it and this record says so rather than implying the gate already exists. Any colour
added in that window carries its measured ratio in a comment, and #250 recomputes them.

## 4. What still stands

Retiring the colour rule retires nothing else. In particular:

1. **`hsl`, never `oklch`.** §5 rule 2's last clause ("hsl format, not oklch") survives its
   own rule. This is not stylistic: the 21-step alpha ladder in
   `tokens/primitive-colors-shades-and-tints.css` is built by passing a bare comma triplet
   into a fourth argument — `hsl(var(--hsl-black), 0.05)` — so a `--hsl-*` token must stay
   a bare `H, S%, L%` triplet with no function wrapper, and an `oklch()` value cannot be
   spliced that way at all. `grep -rn oklch` over `src/` and `public/` returns nothing
   today; that is the state to keep.
2. **Semantic tokens in components; never a primitive reached for directly.** The rest of
   §5 rule 2 — "use the existing semantic tokens (`--color-primary`, `--color-text`,
   `--color-surface`, …); never a primitive directly" — is a layering rule, not a colour
   rule, and it is why adding colour is now safe: a new hue enters at the token layer and
   every consumer keeps naming a role. New programme tokens are seeded from the primitives
   (`--hsl-green`, `--hsl-red`, `--hsl-yellow`) and **not** from the semantic status roles
   `--color-warning` / `--color-fail` / `--color-success`, so the programme axis and the
   status axis can diverge later without one dragging the other.
3. **The `--_bf-{component}-{property}` pattern, `@layer` order, presentational-only
   components** (§5 rules 3 and 4) — untouched.
4. **D2: `wf-*` is frozen.** Nothing here licenses an edit under `pages/wireframes/`,
   `components/wireframe/`, or `public/css/wireframe.css`.
5. **WCAG 2.1 AA** (§5 rule 9). The floor is what is changing form, not the standard.
6. **§5 rule 8** — this record does not edit the brief, and neither does anything after it.

## 5. The hero acceptance gate: narrowed, and de-inverted

`docs/ds-epic/issues/37-bf-hero.md:67` reads, before this change:

```bash
grep -Lq "background-image\|--color-.*:.*#" src/components/bf/Hero.vue
```

It is the only place where the retired rule is mechanically enforced against work this
phase must do — wave-1 subtask 5 gives `bfHero` a photograph and a scrim, so
`background-image` cannot stay in a forbidden-pattern list. The gate is **narrowed, not
deleted**: the colour-literal half of the assertion is still worth having, because the
component genuinely should not hard-code a hex.

Deleting it would also have been the second bug in one line. That file's own **D-37.5 §1**
already records the first: `grep -L` prints files *without* a match, but `-q` short-circuits
to plain quiet-match semantics, so the two flags cancel and the line exits **0 when the
pattern IS present** — the opposite of its intent. It was verified there against controls
(exit `1` for `Hero.vue` and `Button.vue`, which do not contain the probe string; exit `0`
for `CardInsight.vue`, which does), and the correct form `! grep -q …` was published in the
same section — but as a run-time substitution, never written back into the acceptance block.
So line 67 has been wrong since it was authored, in both directions at once: it forbade
something the design phase needs, and it never actually tested for it.

Both are fixed in one edit. The line becomes:

```bash
! grep -q -- "--color-.*:.*#" src/components/bf/Hero.vue
```

`--` before the pattern because the pattern now begins with a hyphen; `! grep -q` because
that is the form D-37.5 already proved. Re-verified against the component as it stands on
`dev`: the old form exits `1` on today's clean `Hero.vue` — it would fail a correct
component — while the new form exits `0` there and non-zero against the same file with a
`--color-x: #ff0000` declaration appended. The gate bites in the direction it claims to. Line 61 of the same block — `grep -Lq "level"` — is
de-inverted with it, since D-37.5 §1 prescribes the negation "for **both** `grep -Lq`
lines" and repairing one inverted gate while leaving its twin two lines above would be a
strange kind of thorough.

D-37.5 §2's separate defect (`grep -c` counts lines, and Nuxt's prerendered HTML is one
line, so the `<h1>` count reads `1` for a page holding three) is **not** amended. Its
substitution is published, the check is not blocking anyone, and gh#249's scope is the
colour rule.

The prose at D-37.5 §1 is left standing rather than rewritten: it now documents an
amendment that has been applied, marked as such, instead of a substitution each runner had
to rediscover. The history of why a gate was wrong is worth more than the tidiness of
deleting it.

Two other spec files carry the same shape of colour grep —
`docs/ds-epic/issues/14-bf-logo.md:67` and `docs/ds-epic/issues/41-bf-notice.md:68`. Both
are deliberately left alone: their components are built and merged, neither is touched by
wave 1, and 41's own §190 already documents and substitutes its inversion. They are named
here so a later reader does not read the omission as an oversight.

## 6. Scope of this change

Documentation only. No `.css`, no `.vue`, no token file, no workflow. The tokens are
BF-220 subtask 3, the contrast gate and its `verify.yml` step are subtask 2
([#250](https://github.com/ccmdesign/bfna-website-migration-2/issues/250)), and the hero
that consumes both is subtask 5. This record is the thing that has to exist before any of
them can be reviewed against a rule that still says no.
