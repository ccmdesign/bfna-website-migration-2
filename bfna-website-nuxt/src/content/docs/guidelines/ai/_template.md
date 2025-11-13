title: AI Guidance Topic
description: Outline for AI usage guidance in the docs workflow.
status: draft
audience: docs-authors
promptId: ai-guidance
promptVersion: 0.1.0
lastPromptRun: null
scope: documentation
---

## Purpose & Scope
- Centralize LLM-oriented instructions for working with the CCM design system.
- Ensure every guide exposes the correct path tokens so agents reference live sources.
- Highlight the downstream manuals writers should consult before drafting changes.

## Path Token Matrix
> Update this table whenever files move. Tokens must stay authoritative for every module.

| Token | Filesystem Path | Notes |
| --- | --- | --- |
| `PATH_AI_ROOT` | `src/content/docs/guidelines/ai/` | Home for AI guidance. |
| `PATH_DOCS_GUIDELINES` | `src/content/docs/guidelines/` | Canonical human-facing docs. |
| `PATH_DOCS_COMPONENT_STANDARDS` | `src/content/docs/guidelines/component-standards.md` | Component standards source of truth. |
| `PATH_DOCS_TOKENS` | `src/content/docs/guidelines/tokens-governance.md` | Token governance playbook. |
| `PATH_DOCS_COMPONENT_OVERVIEWS` | `src/pages/docs/[component].vue` | Dynamic route powered by generated JSON + demos. |
| `PATH_DS_COMPONENTS` | `src/components/ds/` | Shipping DS Vue components. |
| `PATH_CONTENT_COMPONENTS` | `src/components/content/` | Content-layer Vue components. |
| `PATH_DS_DEMOS` | `src/pages/docs/demos/` | Interactive demos surfaced in DocsTabs. |
| `PATH_COMPONENT_DOCS_OUTPUT` | `src/public/component-docs/` | Generated component metadata. |
| `PATH_TEST_COMPONENTS` | `src/tests/components/` | Vitest suites for DS components. |
| `PATH_PUBLIC_TOKENS` | `src/public/css/tokens/` | Authoritative design tokens. |
| `PATH_UTILS_ROOT` | `src/utils/` | Shared utilities that scripts consume. |
| `PATH_UTILS_DS_REGISTRY` | `src/utils/designSystemRegistry.ts` | Enumerates DS components for automation. |
| `PATH_UTILS_PARSE_COMPONENT_DOCS` | `src/utils/parseComponentDocs.ts` | Converts JSDoc into docs metadata. |
| `PATH_SCRIPTS_DOCS` | `scripts/` | Documentation tooling entry point. |
| `PATH_COMPONENT_MIGRATION_CHECKLIST` | `planning/specs/component-migration-checklist.md` | Migration playbook (relocate from legacy planning workspace when available). |

## Module Index
- `components.md` — Workflow for creating or updating DS components.
- `styling.md` — Token, utility, and CUBE CSS guidance for agents.
- `maintenance.md` — Versioning, migrations, and clean-up tasks.
- `workflows.md` — Intake, validation, and escalation paths.
- `content.md` — Authoring Nuxt Content pages and tabbed overviews.
- `demos.md` — Building and troubleshooting DS demos.
- `validation.md` — Required lint/test commands and automation hooks.

## Using These Guides
1. Identify the task type (component work, styling, docs authoring, demos, maintenance).
2. Load the path tokens above so your notes reference the correct files.
3. Follow the relevant module outline to gather prerequisites before coding.
4. Cross-check results with `src/content/docs/guidelines/` and `src/components/ds/` to make sure human and AI instructions match.

## Maintenance Checklist
- Keep the token matrix synced with repo structure.
- Add new modules with a concise summary and token references.
- Link back to this template from root-level AI instructions until all legacy docs are retired.
- Schedule periodic audits using the docs pipeline evaluation plan and capture outcomes in maintenance reports.
