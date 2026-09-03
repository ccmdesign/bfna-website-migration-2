# Plan — gh#10 · 01 Amend app docs to the `bf-*` contract

**Issue:** [#10](https://github.com/ccmdesign/bfna-website-migration-2/issues/10)
**Spec (authoritative):** [`docs/ds-epic/issues/01-bf-docs-amendments.md`](../ds-epic/issues/01-bf-docs-amendments.md)
**Brief:** [`docs/ds-epic/BRIEF.md`](../ds-epic/BRIEF.md) — D1
**Base branch:** `dev` · **`$EPIC_BASE_SHA`:** `f757a649361993275a43282456f4746d247be37b`
**Type:** docs-only. No `.vue`, `.ts`, or `.css` changes.

## Approach

Issue 01 is the epic's gate: every later item-runner reads `bfna-website-nuxt/CLAUDE.md`
and `bfna-website-nuxt/AGENTS.md`, and both currently teach the superseded
`ccm*`-first contract. The fix is **additive, not destructive** — the existing `ccm*`
rules stay true for `src/components/ds/*` (which this epic never touches, per the spec's
Out-of-scope), and the `bf-*` rules are stated alongside them so no runner can read one
without the other. Nothing is renamed; no component file is created or moved.

Four surfaces change:

1. `bfna-website-nuxt/CLAUDE.md` — Directory Overview, Content Workflow, Key standard highlights.
2. `bfna-website-nuxt/AGENTS.md` — project-structure tree, Coding Standards, CSS Architecture.
3. `_process/scoping/design-system-approach.md` — new file, copied from the only checked-out
   copy (`.claude/worktrees/lucid-bhaskara-fc1b6c/`) and amended to `bf-*`.
4. `docs/ds-epic/issues/01-bf-docs-amendments.md` — Decisions section records `$EPIC_BASE_SHA`.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/CLAUDE.md` | +`src/components/bf/` line in Directory Overview (presentational-only, nav+footer included; `ds/` named as the prior generation). +`bf-*` data-pipeline line in Content Workflow. Key standard highlights: `--_ccm-{component}-{property}` scoped to `src/components/ds/*`, `--_bf-{component}-{property}` stated for `src/components/bf/*`. |
| `bfna-website-nuxt/AGENTS.md` | +`bf/` line in the `components/` tree. Coding Standards: `ccm` prefix line gains the `bf` prefix + no-data-layer clause. CSS Architecture: component-variable line gains the `--_bf-` counterpart. |
| `_process/scoping/design-system-approach.md` | **New.** Copy of the `lucid-bhaskara-fc1b6c` original with every `ccm*` prefix reference rewritten to `bf-*` (incl. the Workstream 3 "All built `ccm*`-first" line and the Workstream 2 heading/method) and a dated amendment note at the top. |
| `docs/ds-epic/issues/01-bf-docs-amendments.md` | Decisions section: `$EPIC_BASE_SHA` + the additive-vs-replace decision. |
| `docs/plans/gh10-plan.md` | This file. |

## Test strategy

Run from `bfna-website-nuxt/`:

1. `npx nuxt typecheck` — exit 0. (Runner rule: `npx nuxt generate`, never `npm run generate`,
   which invokes the Directus importer and needs secrets not in the checkout.)
2. `npx nuxt generate` — exit 0.
3. Spec acceptance:
   ```bash
   grep -n 'ccm' CLAUDE.md AGENTS.md | grep -Ei 'prefix|--_ccm-\{component\}' \
     | grep -v 'bf-\*\|--_bf-' && echo FAIL || echo PASS
   test -f ../_process/scoping/design-system-approach.md && \
     grep -q 'bf-\*' ../_process/scoping/design-system-approach.md
   ```
   Every surviving `ccm` prefix/CSS-var rule line must carry its `bf-*` counterpart on the
   same line, so the third `grep -v` drops it.
4. DoD-4 guard (must print nothing):
   ```bash
   git diff --stat dev...HEAD -- \
     bfna-website-nuxt/src/pages/wireframes \
     bfna-website-nuxt/src/components/wireframe \
     bfna-website-nuxt/src/layouts/wireframe.vue \
     bfna-website-nuxt/src/public/css/wireframe.css
   ```
5. DoD-6 sanity: `git diff dev...HEAD -- '*.css' '*.vue'` is empty (docs-only issue).

## Risks

- **R1 — acceptance grep is line-scoped.** The `grep -v 'bf-\*\|--_bf-'` filter only clears a
  line that carries the `bf` counterpart *inline*. Mitigation: amend in place on the same
  line rather than adding a separate paragraph below. Verified by running the command.
- **R2 — collateral `ccm` mentions.** `CLAUDE.md` also names `ccmTabs`/`ccmAccordion` etc. in
  the Interdependent Components examples and `ccmButton.vue` in AGENTS.md. These are
  *examples*, not prefix or CSS-var **rules**, and the acceptance grep's `-Ei 'prefix|--_ccm-'`
  filter does not match them. Leave them — rewriting them would violate the spec's
  "do not touch existing `ccm*` components" boundary.
- **R3 — source doc lives outside this worktree.** `design-system-approach.md` exists only in
  `.claude/worktrees/lucid-bhaskara-fc1b6c/`. Read it from the main checkout's worktree path;
  do not add that worktree as a remote or check it out.
- **R4 — `--_ccm-{component}-{property}` does not appear in the source approach doc.** The
  spec's instruction to replace it is a no-op there; the real `ccm*` references are the
  Workstream 2/3 prose and the "13 `ccm*` components" audit line. The audit line is a
  statement of *historical fact* about `src/components/ds/` — keep it factual, amend only the
  forward-looking rules. Record this in Decisions.
- **R5 — wireframe freeze.** Nothing in this issue's scope goes near `wireframes/`; the DoD-4
  diff check is run anyway as a guard.
