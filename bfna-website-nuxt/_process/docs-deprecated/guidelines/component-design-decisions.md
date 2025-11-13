---
title: Component Design Decisions
description: Architectural decision record (ADR) log for CCM design system components.
category: Guidelines
type: adr
status: canonical
published: true
priority: High
version: 2025.11
last_updated: 2025-11-02
author: Design System Team
tags:
  - adr
  - architecture
  - decision-log
hero:
  brow: Guidelines
  title: Component Design Decisions
  tagline: Why the CCM component system is designed the way it is
related_docs:
  - component-standards.md
  - component-development.md
  - styling-cube-css.md
  - tokens-governance.md
---

# Component Design Decisions

This log captures the architectural choices that shape `${PATH_DS_COMPONENTS}`. Each entry records context, the decision taken, rationale, and consequences so future maintainers and agents understand why patterns exist. Add new entries whenever guidance changes in a way that impacts multiple components or workflows.

---

## 1. How to Use This Log

- **IDs** – Decisions use the `DD-###` format (`DD-001`, `DD-002`, …). IDs never change; superseded entries retain the original number with updated status.
- **Statuses** – `Proposed`, `Accepted`, `Superseded`, `Deprecated`. Only `Accepted` decisions are normative.
- **When to log** – Any change that affects standards, component APIs, styling strategy, tooling expectations, or doc automation. Minor implementation tweaks do not need an ADR—update component documentation instead.
- **Where to reference** – Link decisions from `${PATH_DOCS_GUIDELINES}/component-development`, `${PATH_DOCS_GUIDELINES}/component-standards`, and relevant `_process/spec-drafts/` to provide traceability.

---

## 2. Decision Index

| ID | Title | Category | Status | Affected Areas |
| --- | --- | --- | --- | --- |
| [DD-001](#dd-001-inheritattrs-configuration-strategy) | `inheritAttrs` configuration strategy | Architecture | Accepted | All DS components |
| [DD-002](#dd-002-css-variable-composition-strategy) | CSS variable composition strategy | Styling | Accepted | DS components, wrappers, demos |
| [DD-003](#dd-003-slot-priority-over-props) | Slot priority over props | API Design | Accepted | Components exposing slots & props |
| [DD-004](#dd-004-component-docs-generated-from-jsdoc) | Component docs generation from JSDoc | Tooling | Accepted | Docs generator, DocsTabs |

Categories: **Architecture**, **Styling**, **Accessibility**, **API Design**, **Tooling**, **Documentation**. Add new tags as needed for future decisions.

---

## 3. Decision Entries

### DD-001: `inheritAttrs` Configuration Strategy

- **Date:** 2025-10-22
- **Status:** Accepted
- **Category:** Architecture
- **Context:** Design system components expose configuration props (`size`, `backgroundColor`, `variant`) that map to CSS variables. Vue’s default behavior mirrors props onto the DOM, cluttering markup in production.

#### Problem

We need clear diagnostics in development without shipping noisy attributes or risking hydration mismatches in production.

#### Decision

Configure every DS component with environment-aware `inheritAttrs`:

```ts
defineOptions({
  inheritAttrs: import.meta.env.PROD ? false : true
})
```

- Development (`npm run dev`): attributes visible for debugging.
- Production (`npm run build`): attributes stripped, leaving only computed CSS variables.

#### Rationale

1. **Developer experience** – Inspecting props in DevTools stays effortless.
2. **Performance** – Production DOM stays lean.
3. **Explicitness** – Each component controls its own behavior without hidden mixins.
4. **Compatibility** – Avoids hydration issues because the flag is deterministic per environment.

#### Consequences

- Wrappers must forward props explicitly (`v-bind="$attrs"` no longer works when `inheritAttrs: false`).
- Boilerplate appears in each component, but consistency outweighs repetition.
- Reviewers can easily spot components missing the pattern.

#### Related

- `${PATH_DOCS_GUIDELINES}/component-standards` (Standard 3).
- `${PATH_DOCS_GUIDELINES}/component-development` (inheritAttrs guidance).

---

### DD-002: CSS Variable Composition Strategy

- **Date:** 2025-10-24
- **Status:** Accepted
- **Category:** Styling
- **Context:** We needed a middle ground between prop explosion and wrapper proliferation for customizing appearances.

#### Problem

Either we add props for every visual tweak (API bloat) or force teams to create wrappers for each variation (maintenance burden).

#### Decision

Embrace CSS variable manipulation as the sanctioned composition strategy:

```vue
<ccmCard :style="{
  '--_ccm-card-padding': 'var(--space-xl)',
  '--_ccm-card-background-color': 'var(--surface-emphasis)'
}">
  <ccmButton :style="{
    '--_ccm-button-padding-inline': 'var(--space-2xl)'
  }">Save</ccmButton>
</ccmCard>
```

Rules:

- Override up to ~5 internal variables before extracting a wrapper.
- Prefer existing props; use variable overrides when props cannot express the need.
- Document notable overrides in demos or content components.

#### Rationale

1. **Flexibility** – Unlocks one-off visual adjustments without new components.
2. **Encapsulation** – Internal variables remain private (`--_ccm-*`) yet intentionally overrideable.
3. **Performance** – No extra render cost; leverages native CSS cascade.
4. **Migration path** – Patterns can graduate to wrappers when they repeat.

#### Consequences

- Developers must understand available internal variables (list them in DocsTabs).
- Excessive overrides indicate a missing component variant; escalate to maintainers.
- Demos must highlight sanctioned override patterns to keep consumers aligned.

#### Related

- `${PATH_DOCS_GUIDELINES}/styling-cube-css`
- `${PATH_DOCS_GUIDELINES}/component-standards` (Standard 1 & 2)

---

### DD-003: Slot Priority Over Props

- **Date:** 2025-10-18
- **Status:** Accepted
- **Category:** API Design
- **Context:** DS components expose simple props for ease-of-use but must allow deep customization when consumers need bespoke markup.

#### Problem

Without a deterministic precedence order, developers risk conflicting content when both props and slots are provided.

#### Decision

Slots always override props. Each component’s default slot (and any named slots) render prop fallbacks only when the slot is absent.

```vue
<template>
  <button class="ccm-button">
    <slot>{{ label }}</slot>
  </button>
</template>
```

#### Rationale

1. **Predictability** – Consumers know slot content wins without additional props.
2. **Composable API** – Wrapper components can inject markup while preserving prop defaults for simple use cases.
3. **Docs alignment** – Demos and DocsTabs show both prop-only and slot override patterns consistently.

#### Consequences

- Component documentation must clearly describe slot fallback behavior.
- Automated tests must verify both modes (prop-only, slot overrides) to catch regressions.

#### Related

- `${PATH_DOCS_GUIDELINES}/component-standards` (Standard 6 & 7)
- `${PATH_DOCS_GUIDELINES}/component-development` (Slot>prop pattern)

---

### DD-004: Component Docs Generated from JSDoc

- **Date:** 2025-10-21
- **Status:** Accepted
- **Category:** Tooling
- **Context:** Manual Markdown docs for each component drifted from implementation and were expensive to maintain.

#### Problem

We needed a single source of truth for component APIs that could feed DocsTabs, AI agents, and humans.

#### Decision

- Document every DS component with JSDoc comments inside the `<script setup>` block.
- Use `scripts/generate-component-docs.ts` to produce JSON consumed by `${PATH_DOCS_COMPONENT_OVERVIEWS}`.
- Author Markdown overview shells that embed `<DocsTabs>` instead of duplicating details.

#### Rationale

1. **Single source** – Component code remains the root of truth for props, slots, events.
2. **Automation** – Docs generation runs in CI and local workflows, preventing drift.
3. **Consistency** – Agents and humans consume identical structured data.

#### Consequences

- Component PRs must update JSDoc comments alongside code changes.
- Documentation reviewers run the generator locally to catch schema issues.
- Demo authors coordinate with doc maintainers to keep tabs in sync.

#### Related

- `${PATH_DOCS_GUIDELINES}/documentation-governance`
- `${PATH_DOCS_GUIDELINES}/demo-playbook`

---

## 4. Submitting New Decisions

1. Draft the change rationale (problem, constraints, options) in `_process/spec-drafts/`.
2. Discuss with DS maintainers and relevant owners (tokens, docs, platform).
3. Once accepted, assign the next sequential ID and add the decision to this log using the template below.
4. Update cross-references (`component-standards`, `component-development`, docs/demos) to reflect the new rule.
5. Announce the decision in release notes or team channels, noting required migrations.

---

## 5. Superseded Decisions

When a decision is replaced:

- Update the entry’s `Status` to `Superseded` and link to the new ID.
- Add migration guidance under **Consequences** describing how to transition.
- Keep historical context intact; do not delete the entry.
- Archive supporting research in `_process/_archives/` and update references in active docs.

---

## Appendices

### ADR Template Snippet

```markdown
### DD-XYZ: Concise Title

- **Date:** YYYY-MM-DD
- **Status:** Proposed | Accepted | Superseded | Deprecated
- **Category:** Architecture | Styling | API Design | Tooling | Accessibility | Documentation
- **Context:** Brief description of the scenario.

#### Problem
Explain the problem and constraints.

#### Decision
Explain the choice and include illustrative code if relevant.

#### Rationale
1. Reason one.
2. Reason two.
3. Reason three.

#### Consequences
List positive, negative, neutral impacts; include migration steps.

#### Related
Link to affected docs, specs, or tooling.
```

### Contacts & Approval Workflow

| Area | Maintainer | Notes |
| --- | --- | --- |
| Component architecture | DS Engineering Lead | Required approver for `Architecture` and `API Design` decisions. |
| Styling & tokens | Token Owner + Front-end Platform | Joint approval for `Styling` and token-related choices. |
| Documentation & tooling | Docs Maintainer + Platform | Sign-off for `Tooling` and doc automation entries. |

### Related References

- `${PATH_DOCS_GUIDELINES}/component-development` – Lifecycle guidance referencing ADRs.
- `${PATH_DOCS_GUIDELINES}/component-standards` – Standards that derive from the decisions above.
- `_process/spec-drafts/` – Working area for new or evolving decisions.

Keep this log current; it is the canonical explanation of why the CCM design system works the way it does.

