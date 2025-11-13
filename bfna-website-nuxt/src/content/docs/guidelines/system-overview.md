---
title: CCM System Overview
description: Map of the CCM design system, repository structure, and delivery lifecycle.
status: draft
legacySource:
  - _process/docs-deprecated/guidelines/system-overview.md
---

## Mission
- Deliver consistent UI through reusable components, semantic tokens, and demos.  
- Keep accessibility, performance, and documentation parity non-negotiable.  
- Provide a single source of truth for humans and AI agents through synchronized guidelines and prompts.

## Repository Guide
```
/
├── src/
│   ├── components/ds/           # Design system components (ccm*)
│   ├── components/content/      # Content compositions built on DS components
│   ├── components/docs/demos/   # Interactive demos + generated HTML fragments
│   ├── content/docs/            # Nuxt Content pages (guidelines, components, prompts)
│   ├── composables/             # Reusable logic for components and demos
│   ├── public/css/              # Tokens, utilities, and layer styles
│   └── tests/                   # Vitest suites mirroring source structure
├── scripts/                     # Generators (`generate-component-docs.ts`, etc.)
├── _process/                    # Specs, planning, and archived documentation
└── .ai/                         # Agent-specific instructions (mirrors of guidelines)
```

Key navigation cues:
- Component docs live in `src/content/docs/components/` and embed generator output from `public/component-docs/`.
- Specs begin in `_process/spec-drafts/` and promote into `src/content/docs/guidelines/component-design-decisions.md`.
- AI mirrors under `src/content/docs/guidelines/ai/` stay aligned with human docs; maintain both sides as part of any change.

## Lifecycle Overview
1. **Intake & triage** – Use `implementation-playbook.md` to evaluate reuse vs. new work. Log context in `_process/spec-drafts/`.  
2. **Design alignment** – Partner with design, product, accessibility, and token owners. Reference ADRs and standards.  
3. **Implementation** – Build or update SFCs in `src/components/ds/` following `component-standards.md`.  
4. **Documentation & demos** – Update demos, Markdown, and generated JSON together; regenerate assets via `npm run docs:components:generate`.  
5. **Validation** – Execute the command matrix in `ai/validation.md` and perform manual QA.  
6. **Release & support** – Version docs, sync AI guidance, announce changes, and capture follow-ups.

## Quick Reference Table
| Scenario | Open This | Path |
| --- | --- | --- |
| Plan a feature using DS | `implementation-playbook.md` | `src/content/docs/guidelines/implementation-playbook.md` |
| Build or evolve DS components | `component-development.md` | `src/content/docs/guidelines/component-development.md` |
| Enforce component rules | `component-standards.md` | `src/content/docs/guidelines/component-standards.md` |
| Author demos | `demo-playbook.md` | `src/content/docs/guidelines/demo-playbook.md` |
| Manage tokens | `tokens-governance.md` | `src/content/docs/guidelines/tokens-governance.md` |
| Sync AI guidance | `ai/README.md`, topic-specific files | `src/content/docs/guidelines/ai/` |

## Support & Escalation
| Situation | Escalate To | Evidence Required |
| --- | --- | --- |
| Missing DS capability | Design system maintainers | Spec draft, impact analysis, proposed timeline |
| Token gap or conflict | Token owners | Before/after screenshots, design approval, validation logs |
| Documentation drift | Docs maintainers | Path list, generator output, QA notes |
| Automation failure | Platform/tooling owner | Command output, component or demo references |
| Accessibility concern | Accessibility reviewer | Repro steps, assistive tech findings, affected routes |

Escalate early and log decisions in `component-design-decisions.md` or `_process/spec-drafts/`.

## Glossary
- **Design system component** – A component in `src/components/ds/` adhering to `component-standards.md`.  
- **Wrapper component** – A feature-level component in `src/components/` that forwards DS props and reshapes domain data.  
- **Content component** – A composition in `src/components/content/` orchestrating DS pieces for a page section.  
- **DocsTabs** – Component docs experience that reads generator JSON + demos to surface usage information.  
- **Semantic token** – A named CSS custom property defined under `src/public/css/tokens/semantic-*.css`.  
- **Every Layout utility** – Layout helper classes in `src/public/css/utils/` (`stack`, `cluster`, `grid`, etc.).  
- **ADR** – Architectural decision record stored in `src/content/docs/guidelines/component-design-decisions.md`.

## References
- `src/components/ds/`
- `src/components/docs/demos/`
- `src/public/component-docs/`
- `src/content/docs/guidelines/implementation-playbook.md`
- `src/content/docs/guidelines/component-development.md`
- `src/content/docs/guidelines/ai/README.md`
