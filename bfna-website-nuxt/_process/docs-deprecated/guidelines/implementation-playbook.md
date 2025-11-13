---
title: Implementation Playbook
description: Composition-first checklist for shipping product features with the CCM design system.
category: Guidelines
type: guide
status: canonical
published: true
priority: High
version: 2025.11
last_updated: 2025-11-02
author: Product Engineering + Design System Team
tags:
  - implementation
  - workflow
  - composition
hero:
  brow: Guidelines
  title: Implementation Playbook
  tagline: Ship features by composing the CCM design system
related_docs:
  - system-overview.md
  - component-development.md
  - styling-cube-css.md
  - tokens-governance.md
---

# Implementation Playbook

Use this playbook for any product feature that touches UI. It walks through the composition ladder, escalation paths, and QA expectations so changes stay aligned with the CCM design system.

---

## 1. Before You Start

**Intake Checklist**

- Restate the requirement and its success criteria.
- Audit existing DS components, wrappers, and demos (`${PATH_DS_COMPONENTS}`, `${PATH_DS_DEMOS}`) for reusable patterns.
- Identify tokens or utilities already covering spacing, color, or layout needs.
- Confirm accessibility expectations with design (focus order, keyboard behavior, screen-reader messaging).
- Capture dependencies (API data, analytics, third-party integrations) in `_process/spec-drafts/` or ticket notes.

**Inputs to Gather**

- Relevant guidelines (`${PATH_DOCS_GUIDELINES}/component-standards`, `${PATH_DOCS_GUIDELINES}/styling-cube-css`).
- Existing content components or wrappers you can extend.
- Demo references showing similar experiences.
- ADRs in `${PATH_DOCS_GUIDELINES}/component-design-decisions` that inform architectural choices.

---

## 2. Decision Flow

### Composition Ladder

1. **Use an existing DS component** – Configure via props, slots, CSS variables.
2. **Utilities** – Apply CUBE CSS utilities (`stack`, `cluster`, `grid`, etc.) before writing new layout CSS.
3. **Semantic tokens** – Use `var(--color-* )`, `var(--space-*)` for styling adjustments.
4. **Wrapper component** – Create only if you need repeatable overrides, data shaping, or business logic.
5. **Content component** – Compose multiple DS components into a reusable section.
6. **Custom CSS** – Last resort; must reference tokens and stay scoped.

### Escalation

- If the ladder fails to satisfy the requirement, open a DS component request using `_process/spec-drafts/` and link to it in your PR.
- For token gaps, follow `${PATH_DOCS_GUIDELINES}/tokens-governance` to propose new semantic tokens.
- For documentation or demo changes, coordinate with maintainers listed in `${PATH_DOCS_GUIDELINES}/documentation-governance`.

---

## 3. Implementation Steps

1. **Prototype with existing components**
   - Import DS components via auto-import (`<ccmButton>`, `<ccmHero>`).
   - Override internal CSS variables using inline `:style` bindings when minor tweaks are needed.
2. **Create wrappers when justified**
   - Place wrappers in `src/components/`.
   - Forward DS props explicitly and transform domain data in computed properties.
   - Keep wrappers slim; move reusable logic into composables under `src/composables/`.
3. **Compose content components**
   - For repeated sections, create components in `src/components/content/` using utilities for layout.
   - Avoid embedding heavy business logic; orchestrate existing components.
4. **Styling**
   - Reference tokens per `${PATH_DOCS_GUIDELINES}/styling-cube-css`.
   - Respect CUBE CSS layer order; never hard-code values.
   - Document any new utility needs and update `${PATH_DOCS_UTILITIES}` after approval.
5. **Accessibility**
   - Verify keyboard flows, ARIA, and focus management. Use native elements when possible.
   - Test with screen readers (VoiceOver, NVDA) for critical flows.
   - Capture gaps in the PR and create follow-up tasks if unresolved.

---

## 4. Documentation & Demo Updates

- Update or create demo entries in `${PATH_DS_DEMOS}` following `${PATH_DOCS_GUIDELINES}/demo-playbook`.
- Refresh component docs (Markdown + DocsTabs JSON) when DS components change.
- Add usage notes, migration guidance, or anti-patterns to relevant docs.
- Mirror changes into `${PATH_AI_ROOT}` modules so agents inherit updated behavior.

Command reminders:

```bash
node ${PATH_SCRIPTS_DOCS}/generate-component-docs.ts
npm run docs:components:generate   # alias if available
```

---

## 5. Validation & QA

Run the full QA suite before requesting review:

```bash
npx eslint src --ext .ts,.vue,.md
npm run lint:css
npx vitest run
npm run validate:tokens
npm run typecheck
npm run build
```

Manual validation checklist:

- `[ ]` Responsive behavior confirmed at ≤768px, 1024px, ≥1440px.
- `[ ]` Accessibility walkthrough (keyboard, screen reader) completed.
- `[ ]` Visual diff or design approval captured.
- `[ ]` Demos and DocsTabs render without console warnings.
- `[ ]` Performance considerations addressed (lazy loading, memoization, SSR guards).

Log skipped items with context and create tickets for follow-up if needed.

---

## 6. Handoff & Release

- Include implementation notes, validation output, and screenshots in the PR template.
- Update `version`, `last_updated`, and changelog sections in relevant docs.
- Communicate releases to stakeholders (design, docs, QA) with links to demos and docs.
- If breaking changes occur, provide migration examples and timelines.
- File follow-up issues for debt (token cleanup, additional demos, automation enhancements) rather than leaving TODOs in code.

---

## Playbooks & Recipes

### Wrapper Creation Checklist

```
- [ ] Lives in src/components/ (root)
- [ ] Imports the DS component it wraps
- [ ] Shapes domain data via computed properties
- [ ] Forwards design props explicitly
- [ ] Overrides slots only when necessary
- [ ] Uses semantic tokens or internal CSS variables for styling
- [ ] Adds tests covering data transforms
- [ ] Documents usage in relevant content component or docs
```

### Content Component Pattern

```vue
<template>
  <section class="stack" data-space="l">
    <ccmHero :content="heroContent" size="l" />
    <div class="cluster" data-space="m">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' }
})

const heroContent = computed(() => ({
  title: props.title,
  tagline: props.description
}))
</script>
```

### Third-Party Integrations

- Guard browser-only APIs with `if (import.meta.client)`.
- Wrap external scripts in composables to keep components SSR-safe.
- Document integration requirements (API keys, environment variables) in the PR.

### Performance Tips

- Lazy-load heavy components with dynamic imports when possible.
- Use `defineAsyncComponent` sparingly and document rationale.
- Monitor bundle impact via build analyzer when introducing new dependencies.

---

## Appendices

### Anti-pattern Catalog

- Hard-coded colors or spacing values – replace with tokens.
- Creating wrappers that composite multiple DS components – use content components instead.
- `v-bind="$attrs"` on DS wrappers – violates inheritAttrs configuration.
- Copying demo logic into production without extracting reusable helpers.

### Escalation Matrix

| Blocker | Escalate To | Notes |
| --- | --- | --- |
| Missing DS capability | Design system maintainers | Provide spec, timeline, impact analysis. |
| Token gaps or conflicts | Token owners | Reference `${PATH_DOCS_GUIDELINES}/tokens-governance`. |
| Documentation ambiguity | Docs maintainer | Tag `${PATH_DOCS_GUIDELINES}/documentation-governance` for resolution. |
| Accessibility uncertainty | Accessibility reviewer | Attach prototype, describe expected behavior. |

### Supporting Tools

- `${PATH_SCRIPTS_DOCS}/generate-component-docs.ts` – Keep DocsTabs aligned.
- `npx nuxt devtools` – Inspect component tree and props during development.
- `grep -r "--_ccm" src/components/ds` – Discover internal CSS variables for overrides.

Following this playbook keeps product implementation consistent, efficient, and aligned with the design system.

