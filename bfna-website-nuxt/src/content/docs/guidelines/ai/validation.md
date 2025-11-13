---
title: AI Validation Guide
description: Required checks for AI agents before shipping CCM design system changes.
status: draft
audience: ai-automation
scope: validation
legacySource:
  - _process/docs-deprecated/ai-guidelines/validation.md
---

## Command Matrix
| Purpose | Command | Notes |
| --- | --- | --- |
| ESLint (Vue/TS/MD) | `npx eslint src --ext .ts,.vue,.md` | Include `.md` when docs change. |
| CSS lint | `npm run lint:css` | Required for component or demo styling updates. |
| Type safety | `npm run typecheck` | Runs `vue-tsc`. |
| Component tests | `npx vitest run src/tests/components/ds --run` | Extend coverage as suites grow. |
| Docs generation | `npm run docs:components:generate` | Refreshes JSON + HTML fragments. |
| Foundations/docs regen | `npm run docs:generate` | Use when tokens, guidelines, or prompts change. |
| Token validation | `npm run validate:tokens` | Mandatory when tokens or styling references adjust. |

Optional: run targeted lint (`npx eslint src/components/docs/demos --ext .vue`) for demo-heavy changes or additional Vitest scopes as suites expand.

## Manual QA Checklist
1. **Demos** – Visit `/docs/demos/ccm-<name>-demo` for affected components. Confirm interactions, keyboard support, focus states, and absence of console warnings.  
2. **Component docs** – Check `/docs/<component>` tabs (Code, Docs, Example). Ensure generator data matches component behavior and embedded demos render correctly.  
3. **Accessibility** – Perform keyboard-only navigation and quick screen reader sanity checks. Validate aria attributes and labels match documentation.  
4. **Visual regression** – Compare against design approvals; review in light and dark themes if available.  
5. **Documentation consistency** – Ensure related Markdown (`component-development.md`, `component-standards.md`, AI guides) reflects changes.  
6. **Prompt sync** – Update `src/content/docs/prompts/history.md` when regenerating automation output; note manual edits in the same entry.

Log findings with links, screenshots, and command outputs in PR descriptions or `_process/validation-log.md`.

## Reporting Template
```
## Validation Summary
- npx eslint src --ext .ts,.vue,.md ✔️
- npm run lint:css ✔️
- npm run typecheck ✔️
- npx vitest run src/tests/components/ds --run ✔️
- npm run docs:components:generate ✔️
- npm run docs:generate ✔️ / n/a
- npm run validate:tokens ✔️

Manual QA:
- /docs/demos/ccm-button-demo – interactions verified, no warnings
- /docs/ccmButton – DocsTabs populated, demo matches standalone
- Accessibility – Keyboard + VoiceOver pass

Follow-ups: Add visual regression tests for new outline variant (#123)
```

## Automation Hooks & Future Work
- Ensure CI mirrors this checklist; block merges when commands fail.  
- Track automation gaps in `src/content/docs/guidelines/ai/maintenance.md` (e.g., missing generator checks, snapshot tooling).  
- When new tools join the pipeline (visual diff, link checker), append them here and update human-facing guidelines.

## References
- `src/content/docs/guidelines/component-standards.md`
- `src/content/docs/guidelines/component-development.md`
- `src/content/docs/guidelines/implementation-playbook.md`
- `src/content/docs/guidelines/ai/components.md`
- `src/content/docs/guidelines/ai/demos.md`
- `src/content/docs/guidelines/ai/styling.md`
