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

_Runner appends here._
