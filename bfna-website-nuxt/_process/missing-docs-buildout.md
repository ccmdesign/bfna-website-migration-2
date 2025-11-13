# Feature Specification: Missing Docs Buildout

**Feature Branch**: `feature/missing-docs-buildout`
**Created**: 2025-11-02
**Status**: Draft
**Input**: Follow-up to `_process/component-docs-consolidation.md` gap analysis request (2025-11-02).

---

## Problem Statement
- Component-docs consolidation spec calls for canonical guideline and component overview documents that are still absent (`src/content/docs/components/*`, utilities/tokens/cube-css docs).
- Lack of Markdown entries blocks the `PATH_DOCS_COMPONENT_OVERVIEWS` token and prevents `<DocsTabs>` integration from having living content to target.
- Missing guideline docs force both humans and LLM agents to reference outdated filenames, breaking the intended HOW/WHAT documentation split.

## Goals & Success Metrics
- **G1**: Author Markdown overview pages for every shipped DS component (`src/components/ds/**`) under `src/content/docs/components/` with required frontmatter.
- **G2**: Deliver the three missing guideline docs (`tokens.md`, `cube-css.md`, `utilities.md`) aligned with the consolidation spec nomenclature, deprecating prior filenames without losing content fidelity.
- **G3**: Ensure all relevant path tokens resolve to real files/directories and are referenced from AI guidance (`ai-guidelines-readme.md`, per token matrix).

## Non-Goals
- Updating or deleting legacy `.ai/` files (will happen post-rollout).
- Rewriting demo implementations or generator pipeline beyond light metadata tweaks needed for Markdown frontmatter.
- Introducing new DS components; scope is documentation only.

---

## Proposed Changes

### Architecture / Code Layout
- Create `src/content/docs/components/` directory with one Markdown file per DS component (PascalCase slug → kebab-case filename, e.g., `ccm-breadcrumb.md`).
- Each component doc to export frontmatter fields: `title`, `componentId`, `demoPath`, `docJsonPath`, `status`, `standards`, `category`, `tokensUsed` (array), and optional `notes`.
- Add three guideline Markdown files under `src/content/docs/guidelines/`: `tokens.md`, `cube-css.md`, `utilities.md`. Migrate content from `tokens-governance.md` and `styling-cube-css.md` into the new filenames; leave stubs or redirects in old files if deletion is deferred.
- Update existing guideline index or navigation components (if any) to reference the new filenames; ensure internal links within docs and AI guides use `${PATH_*}` tokens pointing at updated paths.

### Tooling & Configuration
- Extend `scripts/generate-component-docs.ts` (if needed) to emit `componentId` and `demoPath` metadata consumable by Markdown frontmatter defaults (no schema change beyond additive fields).
- Update `src/utils/docsPathTokens.ts` to include any new tokens required (`${PATH_DOCS_TOKENS_GUIDE}`, `${PATH_DOCS_UTILITIES_GUIDE}` if referenced) and ensure `PATH_DOCS_COMPONENT_OVERVIEWS` now resolves to the new directory.
- Review `content.config.ts` collections to confirm the new folders are indexed; add collection definitions or navigation metadata if required.

### Telemetry & Observability
- None (static docs). Confirm no existing telemetry references to old guideline filenames; if present, update references only.

### Security & Compliance
- N/A; no new network calls or secrets.

### Docs & Developer Experience
- Refresh `src/content/docs/ai-guidelines/*.md` to reference the new docs via tokens (especially `components.md`, `styling.md`, `content.md`).
- Update any human-facing ToCs (`documentation-governance.md`, `system-overview.md`) to point at the new guideline filenames and component directory.
- Document authoring checklist for future components in `component-development.md` to include creating the Markdown overview page.

---

## Implementation Plan
1. Create `src/content/docs/components/` directory and scaffold Markdown files for all DS components with placeholder sections (`Overview`, `Usage`, `Demo`, `Code`, `Standards Checklist`).
2. Draft guideline docs (`tokens.md`, `cube-css.md`, `utilities.md`) by migrating/condensing existing material; add frontmatter linking to relevant tokens and AI references. Leave legacy files as wrappers with clear relocation notice if immediate deletion is undesirable.
3. Update `content.config.ts` collections to include the new directories and ensure generated navigation surfaces pick them up.
4. Update path token mappings and AI guides to reference the new docs; run `npm run validate:ai-instructions` to ensure token consistency.
5. Validate component Markdown integrates with `<DocsTabs>` pages (stub out usage description referencing `${PATH_DS_DEMOS}`).

## Validation Plan
- Run `npm run generate` (or `scripts/generate-component-docs.ts`) to ensure component JSON aligns with new frontmatter expectations.
- Execute `npm run lint:content` or equivalent (if available) to guarantee Markdown frontmatter schemas are satisfied; otherwise run `npm run lint:css`/`npx eslint` to confirm no lint regressions due to token imports.
- Launch `npm run dev` and verify `/docs/[component]` routes import Markdown content without 404s; spot-check at least one atom/molecule/organism page.
- Re-run `npm run validate:ai-instructions` after updating AI guides.

## Risks & Mitigations
- **Risk**: Incomplete frontmatter schema could break future automation consuming Markdown files.  
  **Mitigation**: Define a shared interface in `src/types/docs.ts` and validate via unit tests or content rules (future enhancement).
- **Risk**: Renaming guideline files may break existing links/bookmarks.  
  **Mitigation**: Provide temporary redirect stubs or link references in `documentation-governance.md` and announce change in release notes.
- **Risk**: Manual component list may drift as DS inventory grows.  
  **Mitigation**: Hook `designSystemRegistry` to generate a report verifying Markdown parity; schedule follow-up automation task.

## Dependencies & Coordination
- Coordinate with documentation maintainers for content migration approvals.
- Confirm with DS engineers that component demos referenced in frontmatter exist and follow naming conventions.
- Ensure AI documentation owners sign off on new token references.

## Open Questions
- Should component Markdown files embed demos via direct `<ComponentNameDemo />` imports or rely solely on `<DocsTabs>`? (Need decision before writing content.)
- Do we retain legacy guideline filenames as aliases (frontmatter redirect) or remove them outright? Requires agreement with stakeholders.
- Is additional collection metadata needed for Nuxt Content navigation menus? Clarify with docs tooling owner.

## Appendix (Optional)
- Reference: `_process/component-docs-consolidation.md`
- Reference: `src/utils/docsPathTokens.ts`
- Reference: `src/components/ds/` inventory for component list

---

> **Authoring Notes**
> - Draft assumes docs pipeline will evolve alongside `<DocsTabs>` integration; adjust frontmatter fields once exact schema is finalized.

