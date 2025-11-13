# CCM AI Build Guidelines

## Purpose & Scope
- Centralize LLM-oriented instructions for working with the CCM design system.
- Act as the successor to `.ai/`, with every reference tokenized for portability.
- Serve as the table of contents for all task-specific guides in `${PATH_AI_ROOT}`.

## Path Token Matrix
> Update alongside any filesystem moves. Tokens must stay authoritative for every module in this folder.

| Token | Filesystem Path | Notes |
| --- | --- | --- |
| `PATH_AI_ROOT` | `src/content/docs/ai-guidelines/` | Home for LLM guidance. |
| `PATH_DOCS_GUIDELINES` | `src/content/docs/guidelines/` | Canonical “WHAT” documentation set. |
| `PATH_DOCS_COMPONENT_STANDARDS` | `src/content/docs/guidelines/component-standards.md` | Source of truth for DS standards. |
| `PATH_DOCS_TOKENS` | `src/content/docs/guidelines/tokens-governance.md` | Token governance playbook (no dedicated tokens/ directory yet). |
| `PATH_DOCS_UTILITIES` | `src/content/docs/guidelines/styling-cube-css.md` | Current home for utility guidance until a utilities collection ships. |
| `PATH_DOCS_COMPONENT_OVERVIEWS` | `src/pages/docs/[component].vue` | Dynamic component docs route fed by generated JSON + demos (future Markdown overviews pending). |
| `PATH_DS_COMPONENTS` | `src/components/ds/` | Shipping DS Vue components. |
| `PATH_CONTENT_COMPONENTS` | `src/components/content/` | Content-layer Vue components. |
| `PATH_DS_DEMOS` | `src/pages/docs/demos/` | Interactive demo pages. |
| `PATH_COMPONENT_DOCS_OUTPUT` | `src/public/component-docs/` | Generated JSON/HTML docs. |
| `PATH_TEST_COMPONENTS` | `src/tests/components/` | Vitest suites for DS components. |
| `PATH_PUBLIC_TOKENS` | `src/public/css/tokens/` | Authoritative token definitions. |
| `PATH_UTILS_ROOT` | `src/utils/` | Utility helpers for docs + registry. |
| `PATH_UTILS_DS_REGISTRY` | `src/utils/designSystemRegistry.ts` | Enumerates DS components for tooling. |
| `PATH_UTILS_PARSE_COMPONENT_DOCS` | `src/utils/parseComponentDocs.ts` | Converts JSDoc into demo/doc metadata. |
| `PATH_COMPOSABLES` | `src/composables/` | Shared composition helpers. |
| `PATH_SCRIPTS_DOCS` | `scripts/` | Documentation tooling entry point. |
| `PATH_COMPONENT_MIGRATION_CHECKLIST` | `_process/spec-drafts/component-migration-checklist.md` | Migration playbook. |

## Module Index (Outline)
- `components.md` — Workflow for creating/updating DS components.
- `styling.md` — Token, utility, and CUBE CSS guidance for agents.
- `maintenance.md` — Versioning, migrations, clean-up tasks.
- `workflows.md` — Task routing, validation order, escalation paths.
- `content.md` — Authoring Nuxt Content pages + tabbed overviews.
- `demos.md` — Embedding and troubleshooting DS demos.
- `validation.md` — Required lint/test commands and automation hooks.

## Using These Guides (Outline)
1. Identify the task type (new component, token tweak, docs sync).
2. Load path tokens from this README.
3. Follow the relevant module outline to gather prerequisites before coding.
4. Cross-check results against `${PATH_DOCS_GUIDELINES}` and `${PATH_DS_COMPONENTS}`.

## Maintenance Checklist (Outline)
- Keep tokens synced with repo structure.
- Add new modules to the index with one-line summary + token references.
- Link this README from root-level AI instructions until `.ai/` is deprecated.
- Schedule periodic audits using the docs pipeline evaluation plan.

_(Outline v0.2 — fill sections as new guides graduate out of draft.)_

