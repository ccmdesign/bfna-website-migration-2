---
title: AI Demo Authoring Guide
description: Workflow for AI agents creating or updating CCM design system demos.
status: draft
audience: ai-automation
scope: demos
legacySource:
  - _process/docs-deprecated/ai-guidelines/demos.md
---

## Demo Architecture
| Path | Purpose |
| --- | --- |
| `src/components/docs/demos/ccm-<name>-demo.vue` | Interactive page showcasing a DS component. |
| `src/components/docs/demos/_docs/ccm-<name>.html` | Generated fragment surfaced inside demos and DocsTabs. |
| `public/component-docs/ccm<Name>.json` | Generator output (props, slots, examples) used by docs routes. |

Naming: component slug matches the SFC (`ccmButton.vue` → `ccm-button-demo.vue`). Keep demos flat unless the team introduces grouping.

## Authoring Workflow
1. **Plan coverage**  
   - Audit props, slots, and events in the component source and generator JSON.  
   - List scenarios (variants, sizes, accessibility states, integrations) you must demonstrate.
2. **Structure the layout**  
   - Use DS layout utilities (`ccmSection`, `stack`, `cluster`, `grid`) to organize content.  
   - Maintain a consistent heading hierarchy; prefer `<h2>` for sections.
3. **Implement**  
   - Author with `<script setup lang="ts">`.  
   - Import DS components implicitly (auto-registered) or explicitly for clarity.  
   - Expose a `documentationFragment` by importing `_docs/ccm-<name>.html?raw` and rendering it with `v-html`.  
   - Keep state local (`ref`, `reactive`); avoid global stores.
4. **Guard client APIs**  
   - Wrap `definePageMeta` or DOM access in `if (import.meta.client)` so demos embed cleanly in DocsTabs.  
   - Avoid direct window/document usage.
5. **Document decisions**  
   - Record non-obvious scenarios, token usage, or shortcuts in the demo narrative and corresponding guidelines.
6. **Regenerate assets**  
   - Run `npm run docs:components:generate` to refresh `_docs/*.html` and JSON metadata after demos or components change.

## Content Requirements
- Canonical usage (default state).  
- Variant and size matrix, driven by props.  
- Accessibility scenarios (keyboard walkthrough, aria labels, focus states).  
- Behavioral toggles (loading, error, integration with router or JSON-LD).  
- Edge cases (long labels, empty states, external links).  
- Documentation fragment embed to reinforce parity with generator output.  
- Realistic data—no lorem ipsum.

## Validation Commands
```
npx eslint src --ext .ts,.vue
npm run lint:css
npm run typecheck
npm run docs:components:generate
npx vitest run src/tests/components/ds --run
npm run validate:tokens
```
Manual QA:
- `/docs/demos/ccm-<name>-demo` renders without console warnings; keyboard navigation matches expectations.  
- `/docs/<component>` embeds the same demo and surfaces generator metadata.  
- Responsive behavior verified across breakpoints.  
- Document any skipped checks with follow-up issues.

## Troubleshooting
- **Hydration warnings** – Guard client-only APIs or move logic into `onMounted`.  
- **Stale fragments** – Regenerate docs; confirm component JSDoc includes `@example` tags.  
- **Missing demo in DocsTabs** – Ensure slug consistency between the demo filename, `_docs` fragment, and generator JSON entry.  
- **Archived demos** – Revive by moving files from `_archive` into `src/components/docs/demos/` and updating content to current standards.

## Escalation
- Styling regressions → coordinate with owners of `styling-cube-css.md` and `tokens-governance.md`.  
- Accessibility gaps → tag the accessibility reviewer and capture findings in the PR.  
- Generator failures → involve platform maintainers; provide command output and affected component names.  
- New layout utilities → draft proposals in `_process/spec-drafts/` and update `src/content/docs/guidelines/utilities.md`.

## References
- `src/content/docs/guidelines/demo-playbook.md`
- `src/content/docs/guidelines/ai/components.md`
- `src/content/docs/guidelines/ai/validation.md`
- `src/content/docs/guidelines/styling-cube-css.md`
