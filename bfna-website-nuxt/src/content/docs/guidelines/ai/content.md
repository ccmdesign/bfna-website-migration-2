---
title: AI Content Authoring Guide
description: Instructions for AI agents working on Nuxt Content documentation for CCM components and guidelines.
status: draft
audience: ai-automation
scope: documentation
legacySource:
  - _process/docs-deprecated/ai-guidelines/content.md
---

## Documentation Topology
| Location | Purpose |
| --- | --- |
| `src/content/docs/components/` | Component overviews, changelogs, usage narratives, and `<DocsTabs>` configuration. |
| `src/content/docs/guidelines/` | Human-facing standards, playbooks, governance docs (this directory). |
| `src/content/docs/prompts/` | Prompt definitions, history, and migration planning. |
| `public/component-docs/` | Generated JSON consumed by component routes and `<DocsTabs>`. |

Always reference paths explicitly or with defined tokens (`${PATH_DS_DEMOS}`, `${PATH_COMPONENT_DOCS_OUTPUT}`, `${PATH_DS_COMPONENTS}`, `${PATH_DOCS_COMPONENT_OVERVIEWS}`).

## Component Docs Pipeline
1. **Generator-first data**  
   - Maintain complete JSDoc in `src/components/ds/`.  
   - Run `npm run docs:components:generate` to refresh JSON, HTML fragments, and the docs index.  
   - Verify `public/component-docs/ccm<Name>.json` includes `displayName`, `description`, `props`, `slots`, `events`, and examples.
2. **Demo parity**  
   - Each component requires `src/components/docs/demos/ccm-<name>-demo.vue` plus `_docs/ccm-<name>.html`.  
   - Ensure demos import the fragment via `documentationFragment`.
3. **Route rendering**  
   - `src/pages/docs/[component].vue` reads generator output and renders `<DocsTabs>`.  
   - Avoid manual edits to the route; extend helpers in `src/components/content/` instead.
4. **Narrative Markdown**  
   - When Markdown shells exist (`src/content/docs/components/ccm-<name>.md`), keep frontmatter, changelog, and references synchronized with generator data and demos.  
   - Include migration guidance, accessibility notes, and links to related guidelines.

## Authoring Workflow
1. Evaluate requirements from specs or tickets; confirm whether changes affect component docs, guidelines, or prompts.  
2. Update Markdown using Nuxt Content formatting conventions (heading hierarchy, fenced code blocks with language hints, tables with headers).  
3. Synchronize AI mirrors by updating the corresponding file under `src/content/docs/guidelines/ai/`.  
4. Regenerate artifacts with `npm run docs:components:generate` or `npm run docs:generate` (when foundations are touched).  
5. Validate rendering locally (`npm run dev`) and capture screenshots/logs as needed.  
6. Record manual QA notes (route URLs, console status) in the PR description.

## Linking & References
- Prefer relative links rooted at the docs directory (`[Component Standards](../guidelines/component-standards.md)`).  
- Use anchors for intra-page navigation (`[Slots](#slots)`).  
- Reference path tokens or absolute paths when instructing automation (`See \`${PATH_DS_COMPONENTS}\``).  
- Avoid hard-coded URLs to local assets; use Nuxt Content asset syntax if media is required.

## Validation Checklist
```
npx eslint src --ext .ts,.vue,.md
npm run lint:css            # required if demos/styles changed
npm run typecheck
npm run docs:components:generate
npm run docs:generate       # when foundations or prompts change
npm run validate:tokens     # when new tokens or references are added
```
Manual QA:
- `/docs/<component>` renders Code, Docs, and Example tabs with real data.  
- `/docs/demos/ccm-<name>-demo` mirrors the embedded demo.  
- Headings, tables, and callouts follow accessibility best practices (e.g., `###` no skipping levels).  
- Frontmatter fields (`title`, `description`, `status`, `legacySource`, etc.) are complete and current.

## Migration & Cleanup
- When deprecating legacy docs, create an archival stub in `_process/docs-deprecated/` referencing the replacement file.  
- Update `src/content/docs/prompts/migration-map.md` as items move from `queued` → `migrated`.  
- Maintain prompt history (`prompts/history.md`) to capture regeneration metadata and manual interventions.  
- Coordinate large restructures with the docs pipeline audit (`_process/spec-drafts/docs-spec/docs-pipeline-evaluation.md`).

## References
- `src/components/ds/`
- `src/components/docs/demos/`
- `public/component-docs/`
- `src/content/docs/guidelines/documentation-governance.md`
- `src/content/docs/guidelines/ai/validation.md`
