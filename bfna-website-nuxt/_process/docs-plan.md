# Docs Prompt Workflow Plan

## Phase 1 · Prompts & Doc Scaffolding (File Baseline)

### 1.1 Catalog legacy assets

- `_process/docs-deprecated/components/` → 13 component outlines (ccm-breadcrumb.md … ccm-topbar.md)
- `_process/docs-deprecated/guidelines/` → core foundations (cube-css.md, tokens.md, utilities.md, system-overview.md, styling-cube-css.md, component-standards.md, documentation-governance.md, demo-playbook.md, component-development.md, implementation-playbook.md)
- `_process/docs-deprecated/ai-guidelines/` → AI usage docs (ai-guidelines-readme.md, components.md, content.md, demos.md, maintenance.md, styling.md, validation.md, workflows.md)
- `_process/docs-deprecated/demos/` → Vue demo SFCs + `_docs/*.html`

### 1.2 Establish new prompts directory (`src/content/docs/prompts/`)

- `README.md` — sections: Goals, Legacy source map, Prompt metadata conventions, Input requirements, Regeneration checklist, Maintenance for evolving DS
- `PROMPTS_INDEX.md` (optional quick lookup) listing prompts + intended outputs
- `component-docs.prompt.md`
- Frontmatter template: `promptId: component-docs`, `version: 1.0.0`, `updatedAt`, `derivedFrom: ../../../../_process/docs-deprecated/components/`
- Body sections mirroring legacy component docs: Overview, When to Use, Anatomy, Variants, States, Props/Slots table, Accessibility, Content Guidance, Implementation Notes, Cross-links
- `foundations.prompt.md`
- Frontmatter referencing `../_process/docs-deprecated/guidelines/`
- Body scaffold: Scope, Principles, Token Map (auto-injected), Layer Breakdown, Usage Patterns, Authoring Checklist, References
- `component-demo.prompt.md`
- Incorporate `guidelines/demo-playbook.md` coverage (Variants grid, State matrix, Accessibility hooks, Responsive behavior, Source panel instructions)
- `release-note.prompt.md` (future messaging) seeded from `ai-guidelines/workflows.md` if desired

### 1.3 Define target doc templates in live folders

- `src/content/docs/components/` Markdown template
- Frontmatter: `title`, `description`, `status`, `promptId`, `promptVersion`, `lastPromptRun`, `componentVersion`, `demoComponent`, `legacySource`
- Body header order: TL;DR, Overview, Usage Scenarios (Do/Don’t lists), Anatomy (diagram refs), API (Props table referencing `src/components/ds/**`), States, Variants, Accessibility, Content, Implementation (link to `src/components/...`), Demo (embedded), Changelog
- `src/content/docs/guidelines/` template types
- Tokens doc: frontmatter fields for `tokenSet`, `promptId`, `dataSource` (e.g., `scripts/output/tokens.json`)
- CUBE CSS doc: sections for Layer Responsibilities, CSS Imports, Utilities Table, Checklist (pull from legacy `cube-css.md`), Appendices (links to `styling-cube-css.md`)
- Utilities doc: Table of utility classes (auto-generated placeholder), Best Practices, Extension Process
- `src/content/docs/ai-guidelines/` template (if migrating AI guidance): frontmatter with `audience`, `promptId`, `scope`; sections for Summary, Usage Scenarios, Guardrails, Update cadence

### 1.4 Demo destination structure

- Proposed folder: `src/components/docs/demos/`
- Vue SFC naming: `ccm-<component>-demo.vue`
- Collocated metadata JSON: `ccm-<component>-demo.meta.json` (listing variants, tokens touched)
- Optional generated static HTML snapshots under `src/public/component-docs/`
- For foundational visual assets (e.g., token swatches): plan manual creation under `src/content/docs/guidelines/assets/`

## Phase 2 · Automation & Regeneration Infrastructure

### 2.1 Data extraction scripts

- Extend/replace `scripts/generate-component-docs.ts`
- Read component metadata from SFCs (`src/components/ds/**`) or a dedicated spec file (`src/components/ds/**/component.spec.json`)
- Load prompt from `src/content/docs/prompts/component-docs.prompt.md`
- Optionally include legacy markdown snippet from `_process/docs-deprecated/components/<component>.md` as reference context
- Emit Markdown to `src/content/docs/components/<component>.md`
- New script `scripts/generate-foundations-docs.ts`
- Aggregate tokens via `src/utils/designSystemRegistry.ts` or new exporter → `scripts/output/tokens.json`
- Capture CUBE layers from `src/public/css/**` (list `@layer` names) and combine with `guidelines/` legacy copy
- Feed `foundations.prompt.md` and write to `src/content/docs/guidelines/*.md`
- Demo generator `scripts/generate-component-demos.ts`
- Use `component-demo.prompt.md` + component metadata to output Vue SFCs under `src/components/docs/demos/`
- Compare existing legacy demos in `_process/docs-deprecated/demos/` for merging prompts vs manual reuse

### 2.2 Metadata and governance

- Define JSON schema for component spec (fields: `name`, `purpose`, `props[]`, `slots[]`, `tokens[]`, `states[]`, `variants[]`, `dependencies[]`)
- Document schema in `src/content/docs/prompts/README.md`
- Ensure generated docs include frontmatter cross-links: `legacySource`, `promptRunId`, `dataHash`
- Create log file `src/content/docs/prompts/history.md` capturing prompt version history and doc regeneration events

## Phase 3 · Migration, Demos, and Review Alignment

### 3.1 Legacy doc migration plan

- Per-component mapping sheet (e.g., table in `PROMPTS_INDEX.md` or new `migration-map.md`) listing:
- Legacy component doc path → new doc path → migration status
- Legacy guideline path → new guideline path
- Legacy AI guidance path → keep archived or migrate
- Migration steps:

1. Run automation scripts to draft new docs/demos
2. Compare diff with legacy content; port any critical manual notes
3. Flag remaining manual tasks in doc frontmatter (`migrationStatus: needs-manual-review`)

### 3.2 Demo verification workflow

- For each migrated component, confirm demo SFC renders key variants/states from `component-demo.prompt.md`
- Capture static HTML using existing watcher (`scripts/docs-watch.ts`) or new command; place in `src/public/component-docs/<component>.html`
- Update component docs to embed demos via existing components (`docs-live-demo.vue`, `docs-component-source.vue`)

### 3.3 Review & maintenance guidelines

- Update `src/content/docs/guidelines/documentation-governance.md` with new sections:
- Prompt provenance checks
- Regeneration cadence (foundations quarterly unless tokens change)
- Demo validation steps
- Refresh AI maintenance guide (either migrate `ai-guidelines/maintenance.md` or point to new docs) to instruct agents/humans on updating prompts when DS evolves
- Establish checklist stored in `src/content/docs/prompts/review-checklist.md` covering: prompt version, metadata filled, demo linked, tokens validated, automation outputs reviewed

### 3.4 Future-proofing for new components

- Document the onboarding flow in `prompts/README.md`: LLM generates component spec → code → demo → doc using prompts
- Provide placeholder template `src/content/docs/components/_template.md` for manual additions when automation unavailable
- Plan for tracking new component additions via `scripts/generate-component-docs.ts` watch mode or CI job (speculative, note as optional)


### To Do
[ ] Create docs prompts directory and seed canonical component prompt template
[ ] Write usage README describing how to run prompts and review outputs
[ ] Modify generate-component-docs script to consume prompt template and embed metadata
[ ] Update component docs/frontmatter expectations to reference prompt version
[ ] Create docs prompts directory and seed canonical component prompt template
[ ] Write usage README describing how to run prompts and review outputs
[ ] Modify generate-component-docs script to consume prompt template and embed metadata
[ ] Update component docs/frontmatter expectations to reference prompt version