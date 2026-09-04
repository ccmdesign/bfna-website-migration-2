# gh#249 — retire the no-colour rule, repair the hero acceptance gate

Phase 0 of the design phase, wave 1
([BF-220](https://app.plane.so/ccm-design/browse/BF-220/),
[`docs/plans/bf220-design-phase-wave-1-plan.md`](./bf220-design-phase-wave-1-plan.md)).
Nothing else in that wave can land while the ds-epic BRIEF still says "no new
colours" and the hero spec still forbids `background-image`: wave-1 subtask 3 adds
three `--color-program-*` tokens and subtask 5 gives `bfHero` a photograph and a scrim.

## Approach

Two edits, both under `docs/`. No app code, no token file, no workflow change —
`#250` owns `scripts/check-contrast.ts` and the `verify.yml` step that runs it.

1. **`docs/decisions/design-phase-colour-and-art-direction.md` — new.** House form of
   `docs/decisions/gh236-ci-verify-workflow.md`: prose, opens with `Context:`, numbered
   sections, measured claims only. Supersedes rather than edits — BRIEF §5 rule 8 says
   "never edit this brief", so the brief stays byte-identical and the record is what
   overrides it.

2. **`docs/ds-epic/issues/37-bf-hero.md:67` — amended.** The line is
   `grep -Lq "background-image\|--color-.*:.*#" src/components/bf/Hero.vue`. Two
   separate defects, fixed together:
   - `-L` prints files *without* a match while `-q` suppresses output and
     short-circuits to plain quiet-match semantics, so the line exits **0 when the
     pattern IS present** — inverted. That file's own D-37.5 §1 already records this
     and already publishes the substitute (`! grep -q …`); it was applied at run time
     and never written back into the acceptance block.
   - `background-image` is no longer forbidden. Narrow the pattern to the colour-literal
     half and keep it as a real negative assertion.

## What the record has to say

Three things, per the issue's acceptance:

| | |
| --- | --- |
| retired | BRIEF **D5** (`docs/ds-epic/BRIEF.md:52`, "No art direction. No new colours.") and **§5 rule 2** (line 62, "Never add a colour… no new `--color-*` token"), plus **DoD-6** (line 27), which is the same rule wearing an epic-gate hat |
| replaces it | the measured contrast floor landing in #250 — "add no colour" becomes "add no colour that fails its measured floor" |
| still stands | `hsl` only, never `oklch`; semantic tokens in components, never a primitive reached for directly; §5 rule 8 (do not edit the brief); D2 (`wf-*` frozen) |

## Files to touch

| file | why |
| --- | --- |
| `docs/decisions/design-phase-colour-and-art-direction.md` | **new** — the record |
| `docs/ds-epic/issues/37-bf-hero.md` | line 67 gate: de-invert, drop `background-image` |
| `docs/plans/gh249-plan.md` | this file |

Explicitly **not** touched: `docs/ds-epic/BRIEF.md` (rule 8), `docs/ds-epic/issues.md`
(rule 8), `.github/workflows/verify.yml` (nothing colour-related runs there yet —
#250 adds the step), any `.css` or `.vue`.

`docs/ds-epic/issues/14-bf-logo.md:67` and `41-bf-notice.md:68` carry the same shape of
colour grep. Both are out of scope: their components are built and merged, neither is
touched by wave 1, and re-litigating a passing gate is not this issue. Named in the
record so the next person does not think they were missed.

## Verification

Docs-only, so the gates are textual:

```bash
test -f docs/decisions/design-phase-colour-and-art-direction.md
head -3 docs/decisions/design-phase-colour-and-art-direction.md | grep -q 'Context:'
# no inverted grep survives in the acceptance block (lines 55-68); the string is
# allowed to remain in D-37.5's prose, which is the record of why it was wrong
! sed -n '55,68p' docs/ds-epic/issues/37-bf-hero.md | grep -q 'grep -Lq'
! sed -n '55,68p' docs/ds-epic/issues/37-bf-hero.md | grep -q 'background-image'
# docs only — no app file in the diff
! git diff --name-only dev...HEAD | grep -q '^bfna-website-nuxt/'
test -z "$(git diff --name-only dev...HEAD -- docs/ds-epic/BRIEF.md)"
```

Plus CI (`.github/workflows/verify.yml`): typecheck against the 90-diagnostic baseline,
`nuxt generate`, `check-routes`, `check-links`. A docs-only diff cannot move any of them,
which is itself the check that the scope line held.

## Risks

- **Reading the record as permission to paint anything.** Mitigated by writing the
  replacement rule and its enforcement date into the record: between this merge and
  #250's gate the floor is asserted by hand, and the record says so rather than
  pretending the gate already exists.
- **Line 67 drifting.** The amendment edits the acceptance block; D-37.5 §1's prose
  further down already explains the inversion and stays, now describing an amendment
  that has been applied rather than a substitution made at run time.
