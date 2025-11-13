---
title: Component Development Guide
description: End-to-end workflow for planning, building, documenting, and shipping CCM design system components.
category: Guidelines
type: guide
status: canonical
published: true
priority: High
version: 2025.11
last_updated: 2025-11-02
author: Design System Team
tags:
  - components
  - workflow
  - development
hero:
  brow: Guidelines
  title: Component Development Guide
  tagline: Deliver DS components with confidence and traceability
related_docs:
  - component-standards.md
  - demo-playbook.md
  - documentation-governance.md
  - tokens-governance.md
---

# Component Development Guide

Use this guide when you build or evolve components inside `${PATH_DS_COMPONENTS}`. It supplements `${PATH_DOCS_GUIDELINES}/implementation-playbook` with DS-specific responsibilities and artifacts.

---

## 1. Lifecycle Overview

1. **Intake & Triage** – Validate the request via the implementation ladder. Confirm reuse options (existing components, utilities, tokens) before green-lighting new work.
2. **Discovery & Alignment** – Collaborate with design, product, and accessibility stakeholders. Capture requirements in `_process/spec-drafts/` and link to relevant ADRs.
3. **Implementation** – Build in `${PATH_DS_COMPONENTS}` following `${PATH_DOCS_GUIDELINES}/component-standards`. Wrap only when domain-specific logic is required.
4. **Supporting Assets** – Update demos, documentation, tests, and generator outputs in lockstep.
5. **Validation & QA** – Run automated commands plus manual accessibility and visual checks.
6. **Release & Communication** – Version docs, announce changes, and provide migration guidance.
7. **Post-launch Maintenance** – Monitor adoption, triage bugs, and schedule follow-ups.

---

## 2. Discovery & Scoping

**Stakeholder Checklist**

- Design mockups with states (default, hover, focus, disabled, loading).
- Content strategy (copy length, optional fields, localization needs).
- Accessibility requirements (roles, ARIA, keyboard flows, screen reader expectations).
- Token or theme implications (new semantic tokens? variable overrides?).
- Analytics or telemetry needs (events, instrumentation).

**Scoping Questions**

- Does a similar component already exist? If yes, can we extend it with props or internal variables?
- What is the minimal public API (props, slots, emits) that satisfies requirements?
- Which demos need updating (existing page vs. new page in `${PATH_DS_DEMOS}`)?
- What documentation needs to change (component overview, playbooks, AI guides)?
- Do we need new validation or generator logic?

Record answers in the spec draft and link to it from the PR description.

---

## 3. Implementation Requirements

- **Structure** – Use `<script setup lang="ts">`, declare props in categorized blocks (Structural, Content, Visual, Accessibility, Behavior), and set `inheritAttrs` per DD-001.
- **CSS Variables** – Apply the `--_ccm-{component}-{property}` naming convention. Bind props via computed `cssVars`; rely on semantic tokens first.
- **Slot > Prop Pattern** – Slots override props. Provide prop fallbacks within slot templates.
- **Accessibility** – Implement required ARIA attributes with intelligent fallbacks (`aria-label`, `aria-expanded`, etc.). Maintain keyboard support for all interactive elements.
- **Type Safety** – Export or reuse TypeScript interfaces for content objects and enums.
- **Docs Hooks** – Keep JSDoc blocks up to date so `generate-component-docs` emits accurate data.

Wrapper guidance:

- Only create wrappers when transforming domain data, adding business logic, or enforcing repeated overrides.
- Forward DS props explicitly (size, variant, backgroundColor, etc.).
- Limit custom CSS; favor CSS variable overrides or utilities.

---

## 4. Supporting Assets

| Asset | Owner | Requirements |
| --- | --- | --- |
| Demo page (`${PATH_DS_DEMOS}`) | DS engineer + Docs maintainer | Follow `${PATH_DOCS_GUIDELINES}/demo-playbook`; cover variants, sizes, interactions, states, real-world use cases. |
| Docs overview | Docs maintainer | Update Markdown shell (Overview, When to Use, etc.) and ensure `<DocsTabs>` renders updated JSON. |
| Component JSON | Automation | Run `node ${PATH_SCRIPTS_DOCS}/generate-component-docs.ts`; fix lint issues before committing. |
| Tests (`${PATH_TEST_COMPONENTS}`) | DS engineer | Add/extend Vitest suites covering rendering, props, accessibility, and data transformations. |
| Release notes / ADR | DS engineer | Log major decisions or deviations in `${PATH_DOCS_GUIDELINES}/component-design-decisions`. |

---

## 5. Validation Pipeline

Run these commands before requesting review:

```bash
npx vitest run src/tests/components/ds --run
npx eslint src --ext .ts,.vue,.md
npm run lint:css
npm run validate:tokens
node ${PATH_SCRIPTS_DOCS}/generate-component-docs.ts
npm run build
```

Manual QA checklist:

- `[ ]` Demo renders without console errors (desktop + mobile breakpoints).
- `[ ]` DocsTabs show updated props/slots/events and embed the right demo.
- `[ ]` Keyboard navigation and screen readers behave as expected.
- `[ ]` Visual diff against design sign-off (screenshots or design tokens verification).
- `[ ]` Dark/light theme (if applicable) maintains contrast and token alignment.

Document skipped checks in the PR with justification and follow-up tickets.

---

## 6. Release Management

- **Versioning** – Increment component version metadata and associated docs (overview frontmatter, changelog). Use semantic versioning if the component exports a public API consumed externally.
- **Changelog** – Add entries to component overview and, if necessary, global release notes summarizing what changed and why.
- **Migration Guidance** – Provide code samples or command snippets when consumers must adjust props, slots, or tokens.
- **Communication** – Notify stakeholders (design, product, QA) via the chosen channel with links to demos and docs.
- **Docs & AI Sync** – Update `${PATH_DOCS_GUIDELINES}`, `${PATH_DOCS_COMPONENT_OVERVIEWS}`, and `${PATH_AI_ROOT}` in the same release. Agents must inherit the new instructions immediately.

---

## 7. Post-launch Maintenance

- **Bug triage** – Log issues in the tracker with repro steps, affected demos, and screenshots. Prioritize accessibility and regression bugs.
- **Adoption tracking** – Monitor usage through search, telemetry, or documentation feedback. Identify wrappers or patterns that should feed back into the DS.
- **Debt management** – Capture tech debt or backlog items in `_process/spec-drafts/` and link to this guide for context.
- **Deprecation** – Follow `${PATH_DOCS_GUIDELINES}/component-standards` and `${PATH_DOCS_GUIDELINES}/documentation-governance` policies when deprecating variants or components.

---

## Appendices

### Role Responsibilities Matrix

| Role | Responsibilities |
| --- | --- |
| DS Engineer | Implement component, update demos/tests/docs JSON, run validations, coordinate releases. |
| Designer | Provide assets, approve visual states, verify demos reflect intent. |
| Accessibility Reviewer | Validate keyboard flows, ARIA mappings, and screen reader output. |
| Docs Maintainer | Update Markdown, ensure path tokens and frontmatter are correct, sync AI mirrors. |
| QA / Platform | Validate automation, CI pipelines, and tooling updates. |

### Templates & References

- `_process/_templates/_spec-draft-template.md` – Starting point for component proposals.
- `.ai/templates/demo-page-llm-guide.md` – Ensures demo docs align with agent workflows.
- `${PATH_DOCS_GUIDELINES}/component-standards` – Non-negotiable checklist while implementing.
- `${PATH_DOCS_GUIDELINES}/demo-playbook` – Detailed demo authoring guidance.
- `${PATH_DOCS_GUIDELINES}/tokens-governance` – Token change process.

Keep this guide close whenever you touch DS components. Paired with the standards and playbooks, it keeps implementation consistent across teams and releases.

