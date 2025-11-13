---
title: Component Standards
description: Canonical checklist every CCM design system component must satisfy before shipping.
category: Guidelines
type: standard
status: canonical
published: true
priority: High
version: 2025.11
last_updated: 2025-11-02
author: Design System Team
tags:
  - standards
  - components
  - checklist
hero:
  brow: Guidelines
  title: Component Standards
  tagline: Non-negotiable rules for `${PATH_DS_COMPONENTS}`
related_docs:
  - component-development.md
  - demo-playbook.md
  - styling-cube-css.md
  - tokens-governance.md
---

# Component Standards

These standards apply to every component in `${PATH_DS_COMPONENTS}`. Wrappers and content components should reference them but may introduce additional rules documented in `${PATH_DOCS_GUIDELINES}/component-development`.

Use these sections during implementation, code review, and maintenance. Every standard lists the rule, why it exists, examples, anti-patterns, and the validation mechanism that guards it.

---

## 1. Structural & API Standards

### Standard 1 — Script Setup + Explicit Options

- **Rule:** Components must use `<script setup lang="ts">` and declare `inheritAttrs: import.meta.env.PROD ? false : true`.
- **Rationale:** Guarantees consistent composition API usage and prevents attribute leakage in production while preserving dev ergonomics (DD-001).
- **Example:**

```vue
<script setup lang="ts">
defineOptions({
  inheritAttrs: import.meta.env.PROD ? false : true
})
```

- **Anti-pattern:** Omitting `defineOptions`, causing DOM attributes to mirror props in production.
- **Validation:** Manual code review; lint rule pending. Flag missing configuration in PR checklist.

### Standard 2 — Prop Organization & Type Safety

- **Rule:** Group props by category with inline comments (Structural, Content, Visual, Accessibility, Behavior). Every prop requires TypeScript typing and sensible defaults.
- **Rationale:** Aids API discoverability and keeps contracts self-documenting.
- **Example:**

```ts
const props = defineProps({
  // Structural
  is: { type: String, default: 'button' },
  to: { type: [String, Object] as PropType<string | RouteLocationRaw>, default: null },
  // Content
  label: { type: String, default: '' },
  // Visual
  size: { type: String as PropType<'s' | 'm' | 'l' | 'xl'>, default: 'm' },
  variant: { type: String as PropType<'primary' | 'secondary' | 'ghost' | 'destructive'>, default: 'primary' },
  // Accessibility
  ariaLabel: { type: String, default: null },
  // Behavior
  disabled: { type: Boolean, default: false }
})
```

- **Anti-pattern:** Commentless prop blobs or unused props left in place.
- **Validation:** Code review + unit tests verifying default behavior; lint rule ensures no unused props.

### Standard 3 — Slot > Prop Priority

- **Rule:** Slots must fall back to prop values, and slot content always overrides props when provided.
- **Rationale:** Ensures predictable customization while keeping prop APIs simple (DD-003).
- **Example:**

```vue
<slot>{{ props.label }}</slot>
```

- **Anti-pattern:** Rendering both slot and prop simultaneously, causing duplicate content.
- **Validation:** Component tests covering prop-only and slot override scenarios.

---

## 2. Styling Standards

### Standard 4 — CSS Variable Naming & Defaults

- **Rule:** Internal variables must follow `--_ccm-{component}-{property}` with defaults declared in `<style scoped>`.
- **Rationale:** Enables predictable composition (DD-002) and keeps overrides explicit.
- **Example:**

```css
.ccm-card {
  --_ccm-card-padding: var(--space-l);
  padding: var(--_ccm-card-padding);
}
```

- **Anti-pattern:** Generic names (`--padding`) or missing defaults.
- **Validation:** Visual regression via demos; manual review to ensure naming scheme.

### Standard 5 — Inline Style Binding via `cssVars`

- **Rule:** Map prop-driven styling through a computed object bound to `:style`. Use attribute selectors only for semantic variants.
- **Rationale:** Keeps CSS size manageable and ensures tokens map cleanly.
- **Example:**

```ts
const cssVars = computed(() => ({
  '--_ccm-button-padding-inline': `var(--space-${props.size === 's' ? '2xs' : 's'})`,
  ...(props.backgroundColor && {
    '--_ccm-button-background-color': `var(--${props.backgroundColor})`
  })
}))
```

- **Anti-pattern:** Enumerating variants in CSS or hard-coding values in templates.
- **Validation:** ESLint + manual review; demos highlight variant coverage.

### Standard 6 — Tokens Before Primitives

- **Rule:** Reference semantic tokens first, component-scoped variables second, primitives last. Document any primitive usage in the component overview.
- **Rationale:** Maintains themeability and prevents color/spacing drift.
- **Example:** `background: var(--color-primary);`
- **Anti-pattern:** `background: #0d6efd;`
- **Validation:** `npm run validate:tokens` + grep checks for hex/rgb values.

---

## 3. Accessibility Standards

### Standard 7 — Accessible Names & States

- **Rule:** All interactive components must provide accessible names, roles, and state attributes with meaningful fallbacks.
- **Rationale:** Ensures screen readers and assistive tech interpret components correctly.
- **Example:**

```ts
const computedAriaLabel = computed(() => props.ariaLabel || props.content?.title || 'Action')
```

- **Anti-pattern:** Leaving `aria-label` undefined or binding empty strings.
- **Validation:** Manual keyboard + screen reader QA; component tests verifying attributes.

### Standard 8 — Keyboard Interactions

- **Rule:** Components must support expected keyboard patterns (Enter/Space, Arrow keys, Escape) and expose focus indicators.
- **Rationale:** Accessibility compliance and parity with native elements.
- **Example:** Buttons rely on native `<button>` semantics; composite widgets (tabs, menus) manage `tabindex` and key events per WAI-ARIA Authoring Practices.
- **Anti-pattern:** Custom divs acting as buttons without key listeners.
- **Validation:** Manual QA + automated tests where feasible.

---

## 4. Documentation & Testing Standards

### Standard 9 — Docs & Demos in Sync

- **Rule:** Every component change must update its demo, DocsTabs JSON, and Markdown overview in the same PR.
- **Rationale:** Prevents drift between implementation, demos, and documentation.
- **Example:** Run `node ${PATH_SCRIPTS_DOCS}/generate-component-docs.ts` and update `${PATH_DOCS_COMPONENT_OVERVIEWS}`.
- **Anti-pattern:** Shipping component changes without demo coverage.
- **Validation:** CI ensures generator output committed; reviewers verify docs/demos.

### Standard 10 — Test Coverage

- **Rule:** Provide Vitest coverage for rendering, props, accessibility states, and domain-specific transforms. Complex logic belongs in composables with dedicated tests.
- **Rationale:** Protects public APIs and enforces regressions checks.
- **Example:** `src/tests/components/ds/ccm-button.spec.ts` includes prop binding and slot override tests.
- **Anti-pattern:** Relying solely on manual QA.
- **Validation:** `npx vitest run src/tests/components/ds --run`.

---

## 5. Self-Assessment Checklist

Run through this before opening a PR:

```
- [ ] Standard 1: Script setup + inheritAttrs configured
- [ ] Standard 2: Props grouped, typed, and used
- [ ] Standard 3: Slots override props with fallbacks
- [ ] Standard 4: CSS variables follow --_ccm-* pattern with defaults
- [ ] Standard 5: cssVars computed bound to :style; variants via attributes
- [ ] Standard 6: Semantic tokens preferred over primitives
- [ ] Standard 7: Accessible names, roles, and state fallbacks implemented
- [ ] Standard 8: Keyboard interactions and focus indicators verified
- [ ] Standard 9: Demo, DocsTabs JSON, and Markdown updated
- [ ] Standard 10: Tests cover props, slots, and accessibility scenarios
- [ ] Validation commands executed and recorded in PR
```

Include the checklist in code review comments or PR template.

---

## 6. Automation Matrix

| Standard | Automation | Notes |
| --- | --- | --- |
| 1 | Pending ESLint rule | Manual review required today. |
| 2 | ESLint (unused props) + TypeScript | Run `npx eslint` and `npm run typecheck`. |
| 3 | Vitest suites | Tests must assert slot vs prop behavior. |
| 4 | Manual review + demo visual QA | Consider future lint rule for naming pattern. |
| 5 | Manual review + design QA | Potential for custom lint script; track in `_process/spec-drafts/`. |
| 6 | `npm run validate:tokens` + grep checks | Scripts fail when undefined tokens detected. |
| 7 | Manual accessibility QA | Additional automated tests encouraged. |
| 8 | Manual QA + unit tests | Document results in PR checklist. |
| 9 | `node ${PATH_SCRIPTS_DOCS}/generate-component-docs.ts` + reviewer sign-off | CI ensures generated JSON committed. |
| 10 | `npx vitest run` | CI enforces tests before merge. |


---

## 7. Change Control

- Propose changes via `_process/spec-drafts/` with DS, docs, and accessibility maintainers.
- Update this document’s version, `last_updated`, and changelog entry when standards evolve.
- Reflect changes in `${PATH_DOCS_GUIDELINES}/component-design-decisions` with a new or revised ADR.
- Communicate updated standards to all contributors (PR template, announcements, AI mirrors) before enforcement begins.

**Changelog (recent):**

- **2025-11-02 (v2025.11):** Reorganized standards into thematic groups, added synchronization and testing requirements, aligned wording with new playbooks.

---

## Appendices

### Quick Reference (Standards → Example Components)

| Standard | Reference Component |
| --- | --- |
| 1–5 | `ccmButton.vue`, `ccmCard.vue` |
| 6 | `ccmHero.vue` (semantic tokens + CSS variables) |
| 7–8 | `ccmTabs.vue`, `ccmMenu.vue` (composite accessibility) |
| 9 | `src/pages/docs/demos/buttons.vue`, `src/content/docs/components/ccmButton.md` |
| 10 | `src/tests/components/ds/ccm-button.spec.ts` |

### Related Documentation

- `${PATH_DOCS_GUIDELINES}/component-development` – Workflow for shipping DS components.
- `${PATH_DOCS_GUIDELINES}/demo-playbook` – Demo authoring requirements.
- `${PATH_DOCS_GUIDELINES}/styling-cube-css` – Detailed styling and token policies.
- `${PATH_DOCS_GUIDELINES}/tokens-governance` – Token change management process.

Adhering to these standards keeps the CCM design system consistent, accessible, and easy to maintain.

