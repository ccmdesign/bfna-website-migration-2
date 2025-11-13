---
title: CCM System Overview
description: Canonical map of the CCM design system, repository structure, and delivery lifecycle.
category: Guidelines
type: architecture
status: canonical
published: true
priority: High
version: 2025.11
last_updated: 2025-11-02
author: Design System Team
tags:
  - system
  - overview
  - architecture
hero:
  brow: Guidelines
  title: CCM System Overview
  tagline: Navigate how components, demos, and docs stay in sync
related_docs:
  - implementation-playbook.md
  - component-development.md
  - component-standards.md
  - documentation-governance.md
---

# CCM System Overview

The CCM design system keeps engineers, designers, and documentation maintainers aligned on a single implementation. Use this page as the hub that explains what lives where, how work flows through the system, and which playbooks to open when you start a change.

---

## Design System Mission & Principles

- **Composition first** – Compose features from `${PATH_DS_COMPONENTS}` before writing wrappers or custom CSS. The implementation ladder (documented in `${PATH_DOCS_GUIDELINES}/implementation-playbook`) is the governing rule.
- **Accessibility by default** – DS components ship with keyboard, ARIA, and focus affordances. Any change must preserve or improve these baselines; escalation goes to the accessibility reviewer listed in `${PATH_DOCS_GUIDELINES}/component-standards`.
- **Performance & maintainability** – Keep bundles lean, reuse tokens, and respect the CUBE CSS layer order. Each layer (tokens, utilities, components) has dedicated documentation so humans and agents never guess.
- **Documentation parity** – Demos, Markdown guidance, and generated JSON docs must move together. If one artifact changes, the other two must be updated in the same PR.

---

## Repository Map

```
/ (repo root)
├── src/                                # Application source (Nuxt app)
│   ├── components/ds/                  # Design system components (ccm*)
│   ├── components/content/             # Content orchestration components
│   ├── pages/docs/demos/               # Interactive demos
│   ├── content/docs/                   # Human-facing documentation (this directory)
│   ├── public/css/                     # Tokens, utilities, base styles
│   └── tests/                          # Vitest suites mirroring source
├── .ai/                                # HOW-to guides for agents
├── _process/                           # Specs, planning, decision logs
└── scripts/                            # Automation (e.g., generate-component-docs)
```

Additional navigation cues:

- `${PATH_DOCS_COMPONENT_OVERVIEWS}` embeds `<DocsTabs>` that load demos plus generated usage data.
- `_process/spec-drafts/` holds in-flight specs; archive outcomes in `${PATH_DOCS_GUIDELINES}/component-design-decisions` once accepted.
- `${PATH_AI_ROOT}` mirrors these docs for LLM consumption; keep tokens in sync when files move.

---

## Lifecycle at a Glance

1. **Intake & Triage** – Capture the request (component, styling, docs) and run the decision tree in `${PATH_DOCS_GUIDELINES}/implementation-playbook`. Confirm whether the need is satisfied by existing DS building blocks.
2. **Design Alignment** – Validate requirements with design/system owners. Reference existing patterns via `${PATH_DOCS_GUIDELINES}/component-development` and review open ADRs in `${PATH_DOCS_GUIDELINES}/component-design-decisions`.
3. **Implementation** – Build or update components in `${PATH_DS_COMPONENTS}` following the standards checklist. Keep CSS variable strategy, prop organization, and accessibility hooks aligned with `${PATH_DOCS_GUIDELINES}/component-standards`.
4. **Documentation & Demos** – Update or create demo pages (`${PATH_DS_DEMOS}`) per `${PATH_DOCS_GUIDELINES}/demo-playbook` and refresh Nuxt Content entries here. Regenerate component JSON via `npm run docs:components:generate`.
5. **Validation** – Run QA commands (`npx vitest run`, `npx eslint`, `npm run lint:css`, `npm run validate:tokens`, `npm run build`). Manual QA covers demos, DocsTabs, and accessibility checks.
6. **Release & Support** – Version docs, log changes in ADRs or maintenance trackers, and note follow-ups in `${PATH_AI_ROOT}/maintenance.md`. Communicate releases through the project’s change log or roadmap as required.

---

## Where to Start

| Scenario | Primary Reference | Path Token |
| --- | --- | --- |
| Plan a product feature | Implementation Playbook | `${PATH_DOCS_GUIDELINES}/implementation-playbook` |
| Deliver a new DS component | Component Development Guide | `${PATH_DOCS_GUIDELINES}/component-development` |
| Verify standards compliance | Component Standards | `${PATH_DOCS_GUIDELINES}/component-standards` |
| Update demos or embed them in docs | Demo Playbook | `${PATH_DOCS_GUIDELINES}/demo-playbook` |
| Manage documentation lifecycle | Documentation Governance | `${PATH_DOCS_GUIDELINES}/documentation-governance` |
| Create or adjust tokens | Tokens Governance | `${PATH_DOCS_GUIDELINES}/tokens-governance` |

Keep this table in view while working—each entry links out to the deeper playbook for that domain.

---

## Support & Escalation

| Situation | Contact / Artifact | Notes |
| --- | --- | --- |
| Design uncertainty or missing patterns | Design system maintainers (log context in `_process/spec-drafts/`) | Attach mocks, acceptance criteria, and reference affected components. |
| Token or styling regressions | Token owners (`${PATH_DOCS_GUIDELINES}/tokens-governance`) | Provide before/after screenshots and validation output. |
| Documentation drift or broken DocsTabs | Docs maintainers (`${PATH_DOCS_GUIDELINES}/documentation-governance`) | Include affected Markdown paths and generator logs. |
| Automation failures (`generate-component-docs`, lint) | Platform/Tooling point person (`scripts/` owners) | Attach command output, environment info, and suspected offending components. |
| Accessibility concerns | Accessibility reviewer listed in `${PATH_DOCS_GUIDELINES}/component-standards` | Provide repro steps, assistive tech findings, and impacted components. |

Escalate early; unresolved gaps block delivery downstream.

---

## Glossary

- **Design system component (DS component)** – An SFC in `${PATH_DS_COMPONENTS}` that implements CCM standards (pure presentation, CSS variable-driven styling).
- **Wrapper / project component** – A component in `src/components/` that transforms domain data, forwards DS props, and optionally overrides slots.
- **Content component** – An orchestration component in `src/components/content/` that composes DS components into page sections.
- **DocsTabs** – Shared UI embedding demos, code, and usage in `${PATH_DOCS_COMPONENT_OVERVIEWS}`.
- **Design token** – Named CSS custom property defined in `${PATH_PUBLIC_TOKENS}` representing color, spacing, typography, etc.
- **Every Layout utility** – Token-aware layout helper (`stack`, `cluster`, `grid`, etc.) from `${PATH_DOCS_UTILITIES}`; use before writing custom CSS.
- **ADR (Architectural Decision Record)** – Entry in `${PATH_DOCS_GUIDELINES}/component-design-decisions` capturing context, choice, and consequences for system-wide decisions.

---

## Quick Links

| Resource | Purpose |
| --- | --- |
| `${PATH_DOCS_GUIDELINES}/implementation-playbook` | Decision ladder for shipping features with CCM. |
| `${PATH_DOCS_GUIDELINES}/component-development` | Lifecycle, checklists, and responsibilities for DS work. |
| `${PATH_DOCS_GUIDELINES}/component-standards` | Canonical rules every DS component must satisfy. |
| `${PATH_DOCS_GUIDELINES}/styling-cube-css` | Styling, token, and CUBE CSS policy. |
| `${PATH_DOCS_GUIDELINES}/demo-playbook` | How to structure `/docs/demos/*` pages and embed them. |
| `${PATH_DOCS_GUIDELINES}/tokens-governance` | Token change management, validation, and rollback. |
| `${PATH_AI_ROOT}` | Agent-focused mirrors of these instructions (keep path tokens synced). |

Refer back here whenever you need the canonical source of truth for how CCM fits together.

