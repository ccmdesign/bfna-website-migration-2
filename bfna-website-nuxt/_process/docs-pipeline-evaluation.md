# Feature Specification: Documentation Pipeline Audit & Decommission Plan

**Feature Branch**: `feature/docs-pipeline-audit`
**Created**: 2025-11-01
**Status**: Draft
**Input**: Follow-up request to catalogue current documentation-generation assets, identify unused pieces, and prepare a safe removal strategy while consolidating docs under `@docs`.

---

## Problem Statement
- Multiple scripts, HTML fragment generators, and legacy doc blueprints coexist, with unclear ownership and utilization, causing drift and confusion for contributors.
- We lack a definitive map of which parts of the legacy pipeline (`_process/`, `.ai/`, archived demo assets, old Markdown blueprints) still feed any live Nuxt routes or tooling.
- Without a structured audit, we risk deleting assets that still power automations or leaving dead files that mislead future work.

## Goals & Success Metrics
- **G1**: Produce an authoritative inventory of all documentation pipeline inputs/outputs (scripts, directories, generated artifacts) and their consumers.
- **G2**: Flag assets that are unused or superseded, with evidence (e.g., unused imports, routes, build steps) to support removal.
- **G3**: Deliver a sequenced decommission plan that identifies what can be deleted immediately vs. what requires migration or replacement.

## Non-Goals
- Executing deletions or migrations inside this effort (may follow in subsequent implementation work).
- Redesigning the new consolidated docs system; this audit scopes the legacy and transitional pieces only.

---

## Proposed Changes

### Architecture / Code Layout
- Create an audit report (Markdown) under `_process/` summarizing each doc-related directory (`.ai/`, `_process/spec-drafts/`, `content/docs/ai-guidelines/`, `content/docs/guidelines/`, `src/pages/docs/demos/_docs/`, `src/public/component-docs/`, etc.) with:
  - Purpose and current output.
  - Known consumers (Nuxt routes, scripts, external tooling).
  - Status: Required, Replace, Legacy, or Unknown.
- Document the data flow between scripts (`generate-component-docs`, future tab-integrations), Nuxt Content, and demos to highlight redundancy and orphaned outputs.

### Tooling & Configuration
- Instrument a lightweight script (e.g., `scripts/audit-docs-pipeline.ts`) that:
  - Lists files under key directories, checking for references via static analysis (grep/AST) to identify unused assets.
  - Reports missing/expected outputs from the generator (e.g., components without JSON docs or HTML fragments without consumers).
- Ensure the audit script runs read-only, producing JSON/Markdown output for review; no config changes required.

### Telemetry & Observability
- N/A: No runtime telemetry adjustments.

### Security & Compliance
- N/A: The audit touches local repository files only.

### Docs & Developer Experience
- Produce a companion cleanup checklist enumerating recommended deletion targets and prerequisites (e.g., “Once tabbed docs are live, delete `.ai/architecture.md` after verifying `PATH_ARCHITECTURE_DOC` points to the new location”).
- Update `ai-guidelines-readme.md` (in subsequent change) to note the new audit report as the source of truth for pipeline status.

---

## Implementation Plan
1. Enumerate all doc-related directories/files and describe their intended purpose; capture this in an audit matrix under `_process/docs-audit.md` (or similar).
2. Build the read-only audit script to detect active references, missing outputs, and orphaned files; run it to populate evidence in the audit matrix.
3. Interview Nuxt routes and build scripts to cross-check consumption paths (e.g., confirm which pages load `src/public/component-docs/*.json`, whether `_archive` Vue components are imported).
4. Classify each asset as Required/Replace/Legacy/Unknown based on findings; outline dependencies that block deletion.
5. Draft a decommission timeline with recommended sequencing and any migration prerequisites.

## Validation Plan
- Execute the audit script locally and ensure it finishes without write operations; capture logs/artifacts in `_process` for review.
- Manually verify a sample of “unused” assets to confirm they aren’t dynamically loaded (e.g., search for runtime `import()` paths).
- Review findings with the doc maintainers before proceeding to any deletions.

## Risks & Mitigations
- **Risk**: Static analysis misses dynamic references (e.g., runtime `fetch` to JSON files).  
  **Mitigation**: Pair automated checks with manual inspection of Nuxt routes and demos; treat uncertain items as “Unknown” pending deeper review.
- **Risk**: Audit report becomes stale quickly if not maintained.  
  **Mitigation**: Establish a lightweight process (e.g., run audit script before major doc refactors) and note this in `ai-guidelines-readme.md`.
- **Risk**: Overlapping work with the consolidation spec could cause conflicts.  
  **Mitigation**: Keep audit and consolidation in separate branches; coordinate timing to merge audit insights into the consolidation plan.

## Dependencies & Coordination
- Requires input from maintainers familiar with historical doc tooling to confirm usage assumptions.
- Coordinate with whoever will own the eventual deletions to align on timing.

## Open Questions
- Do we need CI integration for the audit script, or is manual execution sufficient for now?
- Should the audit report include performance metrics (e.g., build time impacts) or focus purely on usage/deprecation?

## Appendix (Optional)
- Candidate directories/files for review:
  - `.ai/*`
  - `_process/spec-drafts/*`
  - `_process/support/*`
  - `content/docs/guidelines/*`
  - `content/docs/ai-guidelines/*`
  - `src/pages/docs/demos/_docs/*`
  - `src/public/component-docs/*`
  - `src/utils/designSystemRegistry.ts`
  - `scripts/generate-component-docs.ts`
- Tools: `rg`, `ts-node` for the audit script, Nuxt Content route inspection.

---

> **Authoring Notes**
> - Spec aligns with `_process/_templates/_spec-draft-template.md`; adjust filenames or report locations during execution if needed.

