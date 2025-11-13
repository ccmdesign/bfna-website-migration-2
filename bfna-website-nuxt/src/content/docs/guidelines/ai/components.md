---
title: AI Components Guide
description: Authoritative workflow for AI agents working on CCM design system components.
status: draft
audience: ai-automation
scope: components
legacySource:
  - _process/docs-deprecated/ai-guidelines/components.md
---

## Source of Truth
- Component code lives in `src/components/ds/`. Current inventory: molecules (`ccmBreadcrumb`, `ccmButton`, `ccmChip`, `ccmFormField`, `ccmFormGroup`, `ccmTabs`, `ccmTopbar`) and organisms (`ccmByLine`, `ccmCard`, `ccmFooter`, `ccmHero`, `ccmSection`, `ccmTable`).  
- Components are auto-registered with the `ccm` prefix—file names must be PascalCase (`ccmButton.vue`).  
- Use `getDesignSystemComponentEntries()` from `src/utils/designSystemRegistry.ts` to enumerate components programmatically. Never hand-maintain lists.

## Golden Rules
1. **Composition first** – Prefer composing existing DS components or utilities before authoring new ones.  
2. **Follow `component-standards.md`** – Enforce grouped props, slot priority, CSS variable patterns, accessibility defaults, and validation commands.  
3. **Semantic tokens only** – Map styling through semantic tokens and component-scoped variables; avoid primitives unless a governance change is approved.  
4. **Slots document the API** – Provide meaningful slot names, document them via JSDoc, and ensure demos exercise each slot.  
5. **Accessibility is non-negotiable** – Preserve keyboard support, aria semantics, and focus management; document behavior in demos and docs.

## Standard Workflow
| Phase | Required actions | Files |
| --- | --- | --- |
| Discovery | Audit `src/components/ds/` and `src/components/docs/demos/` for reuse. Record rationale in `_process/spec-drafts/` when proposing new components. | `_process/spec-drafts/`, existing SFCs |
| Scaffolding | Choose destination (`src/components/ds/molecules/` or `/organisms/`). Plan demo + docs updates up front. | Component SFC, spec |
| Implementation | Use `<script setup lang="ts">`, `defineOptions`, grouped props, computed `cssVars`, and documented emits. | `src/components/ds/<Component>.vue` |
| Styling | Scope variables to `--_ccm-<component>-*`, rely on semantic tokens, and keep layout utilities external. | Component SFC |
| Demos & docs | Update `src/components/docs/demos/ccm-<name>-demo.vue`, regenerate `_docs/` fragments and `public/component-docs/ccm<Name>.json`. | Demo, generator output |
| Validation | Run the command matrix in `ai/validation.md`, including token validation, docs generation, linting, tests, and build. | n/a |

## Implementation Details
- Guard SSR-sensitive APIs (`definePageMeta`, DOM access) with `if (import.meta.client)`.  
- Provide prop defaults inline (`default:`) rather than via `withDefaults`.  
- Keep wrapper components thin—if they forward DS props or add domain logic, place them under `src/components/` and document expected behavior.  
- Use shared composables in `src/composables/` when logic spans multiple DS components.

## Docs & Demo Integration
1. Every component must have a demo at `src/components/docs/demos/ccm-<name>-demo.vue`.  
2. Import the generated HTML fragment `_docs/ccm-<name>.html?raw` and expose it through the demo layout.  
3. Run `npm run docs:components:generate` after updating code or JSDoc; this refreshes `public/component-docs/ccm<Name>.json`, the docs index, and `_docs/*.html`.  
4. Verify `/docs/demos/ccm-<name>-demo` and `/docs/<component slug>` render without console warnings.  
5. Update Markdown overviews (`src/content/docs/components/ccm-<name>.md`, when present) and AI mirrors in the same change.

## Validation Commands
```
npx eslint src --ext .ts,.vue
npm run lint:css
npm run typecheck
npx vitest run src/tests/components/ds --run
npm run docs:components:generate
npm run validate:tokens
```
Document command output plus manual QA steps (demos, docs route, accessibility) in the PR summary or validation log.

## Escalation Paths
- Standards ambiguity → update `component-standards.md` and log decisions in `src/content/docs/guidelines/component-design-decisions.md`.  
- Generator issues → inspect `scripts/generate-component-docs.ts` and affected docblocks; coordinate with platform maintainers.  
- Token gaps → reference `tokens-governance.md` and seek approval before introducing primitives.  
- Missing demos or JSON → treat as blockers; regenerate assets and fix JSDoc before merging.

## References
- `src/content/docs/guidelines/component-standards.md`
- `src/content/docs/guidelines/component-development.md`
- `src/content/docs/guidelines/demo-playbook.md`
- `src/content/docs/guidelines/ai/demos.md`
- `src/content/docs/guidelines/ai/validation.md`
