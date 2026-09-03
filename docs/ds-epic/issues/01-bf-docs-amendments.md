# 01 — bf-docs-amendments

Amend the two app-level docs to the `bf-*` contract and land the amended
design-system-approach doc, so every later item-runner reads the current
rules instead of the superseded `ccm*`-first ones.

## Context

First issue in the epic — nothing else may start before this lands (BRIEF D1).
Blocks all 58 remaining issues. Builds from nothing (docs-only). Consumes:
`bfna-website-nuxt/CLAUDE.md`, `bfna-website-nuxt/AGENTS.md`, and
`.claude/worktrees/lucid-bhaskara-fc1b6c/_process/scoping/design-system-approach.md`
(the only checked-out copy — not present in the main checkout). BF provenance:
none (docs task); digest §A "E.1 — Component prefix" conflict is what this
issue resolves in the app docs (the `_process/scoping/architecture-and-epics.md`
side of the conflict is left as-is — out of scope).

## Scope

- `bfna-website-nuxt/CLAUDE.md`:
  - Line 34 (`Directory Overview`): change `src/components/ds/: Design system
    components prefixed \`ccm\` (ccmButton, ccmCard, etc.)` to also state
    `src/components/bf/: Final bf-* design system (props in, events out —
    presentational-only, nav and footer included); src/components/ds/ is the
    prior ccm-prefixed generation, not touched by the bf-* epic`.
  - Lines 106–120 ("Key standard highlights"): change
    `` Use `--_ccm-{component}-{property}` pattern `` to state both:
    `` `--_ccm-{component}-{property}` for existing src/components/ds/*
    (unchanged); `--_bf-{component}-{property}` for every new src/components/bf/*
    component ``.
  - Lines 64–69 ("Content Workflow"): append a line describing the target
    data pipeline: `bf-* pipeline: src/assets/wireframe-data/*.json (6
    snapshots, read-only) → scripts/normalise-wireframe-data.ts →
    content/bf/**/*.json → six bf* type:'data' collections in
    content.config.ts → src/composables/data/bf*.ts (queryCollection only) →
    component props`.
- `bfna-website-nuxt/AGENTS.md`:
  - Lines 18–19 (project-structure tree): add a `bf/` line under
    `components/` alongside `ds/`: `` │   ├── bf/         # Final bf-*
    design system (presentational-only) ``.
  - Line 64 (`Design system components use ccm prefix`): append
    `; components under src/components/bf/ use the bf prefix instead —
    presentational-only, no data-layer access`.
  - Line 75 (`Component variables: --_ccm-{component}-{property}`): append
    `; bf-* components use --_bf-{component}-{property}`.
- Copy
  `.claude/worktrees/lucid-bhaskara-fc1b6c/_process/scoping/design-system-approach.md`
  into `_process/scoping/design-system-approach.md` in this checkout,
  amended: replace every `ccm*` prefix reference with `bf-*` (the doc's own
  line 43 "All built `ccm*`-first" and line 16/69 token notes), replace
  `` `--_ccm-{component}-{property}` `` with `` `--_bf-{component}-{property}` ``
  everywhere it appears, and add a one-line note at the top: `Amended
  2026-09-02 per docs/ds-epic/BRIEF.md D1 — bf-* supersedes ccm*-first.`
- Record `$EPIC_BASE_SHA` (tip of `dev` at issue start) in this file's
  Decisions section (the runner fills it in when it executes this issue —
  authoring only notes the requirement here, does not compute the SHA).

## Out of scope

- Renaming, moving, or otherwise touching any existing `ccm*` component
  under `src/components/ds/`.
- Any edit under `bfna-website-nuxt/src/pages/wireframes/` or
  `bfna-website-nuxt/src/components/wireframe/` — an edit there fails the
  epic regardless of intent.
- Creating `src/components/bf/` itself (issue 02).
- Resolving digest Conflict E.1 in `_process/scoping/architecture-and-epics.md`
  — that file is not touched here.

## Styling

N/A — docs-only issue, no CSS or component changes.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
grep -n 'ccm' CLAUDE.md AGENTS.md | grep -Ei 'prefix|--_ccm-\{component\}' \
  | grep -v 'bf-\*\|--_bf-' && echo FAIL || echo PASS
# FAIL today (no bf-* amendment exists); PASS once amended lines carry the
# bf-* counterpart alongside the ccm one.
test -f ../_process/scoping/design-system-approach.md && \
  grep -q 'bf-\*' ../_process/scoping/design-system-approach.md
```

## Decisions

**Runner: gh#10, 2026-09-02, branch `feature/gh10-amend-app-docs-to`.**

- **D01.1 — `$EPIC_BASE_SHA` = `f757a649361993275a43282456f4746d247be37b`** (tip of `dev` at
  issue start, `docs(plans): ds-epic plan file for lfg-ccm (BF-217)`). This is the baseline for
  BRIEF DoD-4 and DoD-6 for the whole epic.
- **D01.2 — amendments are additive, on the same line.** The acceptance command filters
  line-by-line (`grep -v 'bf-\*\|--_bf-'`), so a `bf-*` counterpart stated in a separate
  paragraph would still fail. Every `ccm` prefix / CSS-var rule line was therefore rewritten to
  carry both contracts inline: `--_ccm-` scoped to `src/components/ds/*`, `--_bf-` for
  `src/components/bf/*`. Nothing was deleted, so the `ds/` generation remains correctly
  documented.
- **D01.3 — one line beyond the spec's enumeration was amended.** `CLAUDE.md:90`
  ("**DS components**: … each prefixed with `ccm`") is not named in the spec's Scope but *is*
  caught by the spec's own acceptance command. It was amended to point new work at
  `src/components/bf/`. The spec's enumeration was incomplete, not wrong; the acceptance
  command is authoritative.
- **D01.4 — collateral `ccm` mentions deliberately left alone.** `CLAUDE.md`'s Interdependent
  Components examples (ccmTabs, ccmAccordion, ccmMenu, ccmFormGroup) and `AGENTS.md`'s
  PascalCase example (`ccmButton.vue`) are *examples*, not prefix or CSS-variable **rules**;
  the acceptance grep does not match them and rewriting them would breach this issue's
  "do not touch existing `ccm*` components" boundary.
- **D01.5 — `--_ccm-{component}-{property}` does not occur in `design-system-approach.md`.**
  The spec's instruction to replace it there is a no-op. The doc's actual `ccm*` references
  were its Workstream 2 heading/method, the Workstream 1 deliverable, the Workstream 3
  "All built `ccm*`-first" principle and the intro's "under the `ccm*` design system" — all
  rewritten to `bf-*`. The "13 `ccm*` components in `src/components/ds/`" line in *Current
  state (audited)* is a statement of historical fact and was kept, with a clause added marking
  them as the prior generation the `bf-*` epic does not touch.
- **D01.6 — `bf-*` pipeline documented in both app docs.** The spec places it in `CLAUDE.md`'s
  Content Workflow only; a one-line cross-referenced summary was also added to `AGENTS.md`'s
  Content Management section, because the issue body requires *both* app docs to state the
  current contract and item-runners may read either.
- **D01.7 — `AGENTS.md` still advertises `npm run generate` (line 40) as the SSG command,
  which BRIEF §5 rule 6 forbids** (it runs `contentImporter.js` and needs Directus secrets).
  Out of this spec's enumerated scope, so not fixed here — raised as a residual issue instead.

**Verification run on this branch:** `npx nuxt typecheck` exit 0 · `npx nuxt generate` exit 0 ·
acceptance grep PASS · `design-system-approach.md` present and contains `bf-*` ·
wireframe-source diff (`dev...HEAD`) empty · no `*.css` / `*.vue` change (DoD-6 trivially held).
