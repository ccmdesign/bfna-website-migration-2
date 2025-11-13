# Feature Specification: DocsTabs Rollout & Component Overviews

**Feature Branch**: `feature/docs-tabs-rollout`
**Created**: 2025-11-02
**Status**: Draft
**Input**: Documentation audit (2025-11-02) highlighting missing `<DocsTabs>` implementation and absent `src/content/docs/components/` entries; consolidation spec `_process/component-docs-consolidation.md` goals G1–G3.

---

## Problem Statement
- Current docs refer to a tabbed component documentation surface (`<DocsTabs>`, Nuxt Content component overviews) that does not exist, breaking parity between implementation, demos, and instructions.
- The docs generator only emits JSON; there is no shared UI to display demos, API usage, and narrative content together, resulting in fragmented references.
- Without the promised tabs, both humans and AI agents lack a canonical page per DS component, undermining the consolidation effort.

## Goals & Success Metrics
- **G1**: Ship a reusable `<DocsTabs>` component that embeds the live demo, generated JSON metadata, and optional code snippets for any DS component.
- **G2**: Publish initial Nuxt Content overview pages in `src/content/docs/components/` for every component discovered via `getDesignSystemComponentEntries()`, wired to `<DocsTabs>`.
- **G3**: Extend the documentation generator pipeline to provide the structured data needed by the tabs (usage JSON + rendered HTML fragment + code samples) with automated validation.

## Non-Goals
- Updating every demo’s narrative prose beyond what is required to load inside `<DocsTabs>`.
- Rewriting design tokens or unrelated documentation guidelines (handled by the docs parity hotfix).
- Building full CI automation (covered by the documentation validation spec).

---

## Proposed Changes

### Architecture / Code Layout
- Add `src/components/docs/DocsTabs.vue` (and supporting composables) to:
  - Accept `componentId`, `demoPath`, `docsJson`, and optional `codeSources` props.
  - Dynamically import the demo SFC (`defineAsyncComponent`) and display it inside a “Demo” tab.
  - Pull JSON metadata from `${PATH_COMPONENT_DOCS_OUTPUT}` for “Usage” / “Props” views.
  - Render generated HTML fragments (from `docs-extract.ts`) for the “Guidance” tab.
- Create `src/components/docs/DocsTabsTab.vue` or composables if needed for tab state and SSR safety.
- Introduce `src/content/docs/components/<component>.md` files generated or scaffolded with frontmatter referencing the demo + JSON paths.

### Tooling & Configuration
- Update `scripts/generate-component-docs.ts` to optionally emit:
  - A `codeSnippets` array derived from component docblocks or source selection.
  - A manifest mapping component IDs to their overview Markdown files for validation.
- Evaluate whether to augment `docs-extract.ts` to ensure `_docs/*.html` fragments remain in sync (or consolidate both pipelines).
- Add Nuxt auto-import configuration for `src/components/docs/` if not already covered.

### Telemetry & Observability
- No external telemetry. Add console warnings in dev mode if `<DocsTabs>` cannot resolve demo or JSON data to aid QA.

### Security & Compliance
- Ensure dynamic imports are limited to known paths (whitelist resolved via generator manifest) to avoid arbitrary file access.
- No new runtime secrets.

### Docs & Developer Experience
- Provide authoring guidance for the new overview pages (update `content.md` once feature ships).
- Document fallback behavior when demos are client-only (graceful message instead of blank tab).
- Add storybook-like instructions for writing narrative sections below `<DocsTabs>` body.

---

## Implementation Plan
1. **Component foundation**
   - Scaffold `DocsTabs.vue` with tab state (e.g., `useState` or local refs) and slots for “Demo”, “Usage”, “Guidance”, “Code”.
   - Implement SSR-safe demo loading via dynamic import using `demoPath` (guard `definePageMeta` by updating demos to check `import.meta.client`).
2. **Generator enhancements**
   - Extend `parseComponentDocs.ts` to include optional code sample extraction (`@usage`, `@snippet` tags) feeding JSON. Update generator to include these fields.
   - Produce a manifest (e.g., `component-docs-index.json`) enumerating expected Markdown overview files for validation.
3. **Content scaffolding**
   - For each component detected by `getDesignSystemComponentEntries()`, create `src/content/docs/components/<component>.md` with frontmatter: `componentId`, `demoPath`, `docsJson`, `status`, `version`.
   - Render `<DocsTabs>` in the body, followed by placeholder narrative sections (Overview, Usage guidance, Accessibility notes, Changelog).
4. **Demo adjustments**
   - Audit `src/pages/docs/demos/*.vue` for `definePageMeta` usage; wrap in `if (import.meta.client)` or extract layout metadata to avoid SSR issues inside tabs.
   - Ensure each demo exports a root element friendly for embedding (no unexpected `layout` wrappers unless the layout spec is updated).
5. **Nuxt Content integration**
   - Verify `/docs/components/<slug>` route resolves to the new Markdown entries by adjusting `src/pages/docs/[component].vue` or Content navigation as needed.
6. **Documentation updates**
   - Refresh `src/content/docs/ai-guidelines/content.md` and related guides to describe the new workflow once functional.
7. **QA & handoff**
   - Smoke-test each component overview page, confirm tabs work for desktop/mobile, ensure missing data surfaces actionable errors.

## Validation Plan
- `npm run docs:components:generate` (updated script) and `npm run docs:sync` to produce HTML fragments.
- `npx eslint src --ext .ts,.vue,.md` (including new components and Markdown).
- `npx vitest run src/tests/components/docs --run` (add targeted tests for `<DocsTabs>` behavior).
- Manual QA: visit `/docs/components/<component>` for all shipped components; verify tabs render, demos hydrate, props tables match JSON.

## Risks & Mitigations
- **Risk**: Dynamic imports of demos may break SSR if they rely on page-level layouts or route hooks.  
  **Mitigation**: Update demos to guard `definePageMeta`; add integration test ensuring `<DocsTabs>` renders on server without errors.
- **Risk**: Generator changes could invalidate existing JSON consumers.  
  **Mitigation**: Append new fields while preserving current schema; document changes and provide migration notes.
- **Risk**: Component overviews become stale as new components ship.  
  **Mitigation**: Combine with validation automation (separate spec) to assert coverage.

## Dependencies & Coordination
- Coordinate with the docs parity hotfix to avoid conflicting edits in guidelines referencing `<DocsTabs>`.
- Requires follow-up validation automation (see documentation validation spec) to enforce coverage.
- Engage docs maintainers for content style review and DS engineers for demo adjustments.

## Open Questions
- Should overview Markdown be generated automatically or manually curated with templates?
- What tab labels and ordering best serve both humans and AI agents (Demo, Usage, API, Changelog, etc.)?
- Do we need dark-mode awareness inside `<DocsTabs>` (mirrors demo theme toggles)?

## Appendix (Optional)
- Reference spec: `_process/component-docs-consolidation.md` (baseline goals).
- Candidate directories to audit: `src/pages/docs/demos/_docs/`, `src/public/component-docs/`, `src/pages/docs/[component].vue`.
- Potential libraries: evaluate `@headlessui/vue` vs. custom tabs (prefer custom to avoid new deps unless necessary).

---

> **Authoring Notes**
> - Pair this rollout with the docs parity hotfix to minimize drift between instructions and implementation.

