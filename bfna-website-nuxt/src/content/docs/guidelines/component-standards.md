---
title: Component Standards
description: Canonical requirements every CCM design system component must satisfy.
status: draft
legacySource:
  - _process/docs-deprecated/guidelines/component-standards.md
---

## Purpose
- Applies to every Vue single-file component under `src/components/ds/`.
- Use this checklist during implementation, code review, and maintenance before publishing or regenerating docs.
- Keep supporting playbooks in sync: see `src/content/docs/guidelines/component-development.md`, `implementation-playbook.md`, and the AI mirrors under `src/content/docs/guidelines/ai/`.

## Structural & API Standards
1. **Script setup + inherit options**  
   - Author components with `<script setup lang="ts">`.  
   - Call `defineOptions({ inheritAttrs: import.meta.env.PROD ? false : true })` to avoid leaking attributes in production while keeping dev tools friendly.
2. **Typed, grouped props**  
   - Group props by concern (`// Structural`, `// Content`, `// Visual`, `// Accessibility`, `// Behavior`).  
   - Provide explicit TypeScript types, defaults, and keep prop order stable. Remove unused props immediately.
3. **Slots override props**  
   - Render slots before prop fallbacks: `<slot>{{ props.label }}</slot>`.  
   - Tests must cover prop-only and slot-override scenarios to prevent duplicate content.
4. **Events & emits**  
   - Declare events with `defineEmits` and document payload shapes in JSDoc so generators surface them.  
   - Mirror event names in the demo and DocsTabs examples.

## Styling Standards
1. **Component-scoped variables**  
   - Prefix overrides with `--_ccm-<component>-*` inside `<style scoped>`.  
   - Provide defaults and use semantic tokens as fallbacks (`var(--_ccm-card-padding, var(--space-l))`).
2. **Computed `cssVars` binding**  
   - Map prop-driven styling through a computed object and bind with `:style="cssVars"`.  
   - Only set keys when a prop deviates from the default—do not dump the full token map.
3. **Tokens before primitives**  
   - Reference semantic tokens defined in `src/public/css/tokens/semantic-*.css`.  
   - If no semantic value exists, log the gap and propose an addition via `tokens-governance.md` before referencing primitives.
4. **Layer discipline**  
   - Respect CUBE CSS order from `src/public/css/styles.css`. Component styles live in the `components` layer and must not redefine utilities or tokens.

## Accessibility Standards
1. **Accessible names & fallbacks**  
   - Provide meaningful defaults for labels, aria attributes, and roles (`computed(() => props.ariaLabel ?? props.content?.title ?? 'Action')`).  
   - Guard against empty strings or undefined values.
2. **Keyboard interactions**  
   - Support expected key patterns (Enter/Space, Arrow keys, Escape) and surface focus indicators.  
   - For composite widgets follow the WAI-ARIA Authoring Practices and document deviations in the component overview.
3. **State exposure**  
   - Reflect disabled, loading, selected, and expanded states through aria attributes and CSS hooks.  
   - Cover state toggles in demos and tests.

## Documentation & Testing Standards
1. **Docs + demos stay in lockstep**  
   - Update `src/components/docs/demos/ccm-<name>-demo.vue`, generated fragments in `src/components/docs/demos/_docs/`, and Markdown overviews in the same PR.  
   - Run `node scripts/generate-component-docs.ts` (alias: `npm run docs:components:generate`) to refresh JSON + HTML payloads.
2. **JSDoc completeness**  
   - Keep component docblocks current (`@component`, `@prop`, `@slot`, `@example`). The generator fails fast when tags are missing.
3. **Test coverage**  
   - Add or update Vitest suites under `src/tests/components/ds/` covering rendering, props, slots, accessibility, and behavioral logic moved into composables.
4. **Validation commands**  
   - Execute:  
     ```bash
     npx eslint src --ext .ts,.vue
     npm run lint:css
     npm run typecheck
     npx vitest run src/tests/components/ds --run
     npm run validate:tokens
     npm run docs:components:generate
     ```
   - Document results in the PR or validation log before requesting review.

## Self-Assessment Checklist
```
- [ ] Script setup + inheritAttrs configured
- [ ] Props grouped, typed, defaults provided, unused removed
- [ ] Slots override props with safe fallbacks
- [ ] CSS variables follow --_ccm-* pattern with semantic fallbacks
- [ ] cssVars computed bound to template; attribute selectors reserved for variants
- [ ] Tokens referenced instead of primitives; token gaps documented
- [ ] Accessibility: names, roles, keyboard flows verified
- [ ] Demos, DocsTabs JSON, and Markdown updated together
- [ ] Vitest, linting, typecheck, token validation, docs generator executed
```

## Automation & Escalation
- Capture lint or generator gaps in `_process/spec-drafts/` and assign an owner before merge.
- File prompt updates under `src/content/docs/prompts/` when standards change so AI guidance stays mirrored.
- Escalate unresolved accessibility or styling conflicts to the design system maintainers; reflect decisions in `component-development.md` and AI mirrors.

## References
- `src/components/ds/`
- `src/components/docs/demos/`
- `src/tests/components/ds/`
- `src/content/docs/guidelines/component-development.md`
- `src/content/docs/guidelines/implementation-playbook.md`
- `src/content/docs/guidelines/tokens-governance.md`
