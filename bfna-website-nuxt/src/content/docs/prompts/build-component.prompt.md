---
promptId: build-component
version: 0.1.0
updatedAt: 2025-11-02
derivedFrom: null
---

# Build Component Prompt

You are generating a new CCM design-system component. Follow these instructions exactly.

## Inputs Provided
- Component spec (props, slots, states, variants, tokens, dependencies) in JSON matching `src/content/docs/prompts/component-spec.schema.json`.
- References to existing components or demos when available.
- Any additional requirements supplied in the user message.

## Required Outputs
1. **Component SFC** in `src/components/ds/<category>/<ComponentName>.vue` using `<script setup lang="ts">` with `<template>` and `<style scoped>`.
2. **Handcrafted demo SFC** under `src/components/docs/demos/<slug>-demo.vue` that mirrors real-world usage (no metadata JSON).
3. **Documentation hooks**: notes describing required updates in `src/content/docs/components/<slug>.md` and references to relevant sections in `src/content/docs/guidelines/`.

## Design System Constraints
- **Tokens**: Use semantic tokens defined in `src/public/css/tokens/` (`src/content/docs/guidelines/tokens.md`). Do not hardcode colors, spacing, or typography.
- **CUBE CSS**: Structure layout using utilities and patterns documented in `src/content/docs/guidelines/cube-css.md`. Prefer composition utilities over bespoke layout CSS.
- **Utilities**: Reuse existing helpers from `src/public/css/utils/`; document new helpers in utilities guideline if absolutely necessary.
- **Accessibility**: Follow ADA/WCAG guidance from component specs. Include aria attributes, keyboard interactions, and focus management.
- **Vue patterns**: Use `defineProps`, `defineEmits`, and computed CSS variables. Export component metadata for docs if existing components do so.

## Implementation Checklist
- Validate props/states against the provided spec; expose defaults where defined.
- Bind internal CSS variables with the `--_ccm-` prefix for theming overrides.
- Reference shared composables/utilities as needed (`src/utils/`, `src/composables/`).
- Ensure responsive behavior aligns with composition utilities (e.g., `stack`, `cluster`, `switcher`).
- Write JSDoc-compatible comments for the component and each prop/emit so `vue-docgen-api` can prefill documentation. Include:
  - Top-level `/** ... */` block with Overview, Usage, Accessibility notes, and `@component`, `@category`, `@standards` tags where applicable.
  - Prop descriptions, default values, and any variant/state guidance.
  - `@example` or `@usage` tags with code snippets when useful.

## Demo Requirements
- Render default usage plus all mandatory variants/states specified in the spec.
- Structure the page with `ccm-section`, `stack`, `cluster`, `grid`, and related utilities for consistent spacing.
- Include inline guidance (captions, comments) explaining behaviour, accessibility cues, and composition rationale.

## Documentation Hooks
- Ensure the component comments cover TL;DR, Usage Scenarios, Anatomy cues, Accessibility, and Content notes so generated docs arrive pre-populated instead of TODO placeholders.
- Call out in-code which variants/states map to demos, and reference foundational docs (tokens, CUBE CSS, governance) using inline comments rather than TODOs in Markdown.
- After the generator runs, confirm the component doc includes meaningful copy derived from your comments; reconcile remaining gaps and record updates in `migration-map.md` and `history.md`.

## Validation
- Run `npm run docs:generate`, `npm run docs:demos:generate`, `npm run validate:tokens`, `npm run lint:css`, `npx eslint src --ext .ts,.vue,.md`, and relevant component tests.
- Manual QA: load `/docs/components/<slug>` and each demo route; verify accessibility interactions.

## Deliverable Format
Respond with:
1. Code blocks for the new component, demo SFC, and metadata JSON.
2. Bullet list of documentation updates required.
3. Validation checklist with pass/fail status and additional manual QA notes.
