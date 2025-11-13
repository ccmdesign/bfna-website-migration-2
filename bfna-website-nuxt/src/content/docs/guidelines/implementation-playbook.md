---
title: Implementation Playbook
description: Composition-first workflow for shipping product features with the CCM design system.
status: draft
legacySource:
  - _process/docs-deprecated/guidelines/implementation-playbook.md
---

## Scope
- Applies to any feature that touches UI in this Nuxt app.  
- Anchors product teams to the design system before writing bespoke components or CSS.  
- Use alongside `component-development.md`, `component-standards.md`, and AI mirrors (`src/content/docs/guidelines/ai/components.md`, `ai/styling.md`).

## Before You Start
**Intake checklist**
- Restate the requirement, success criteria, and acceptance tests.
- Audit `src/components/ds/`, `src/components/content/`, and `src/components/docs/demos/` for reuse.
- Identify existing tokens (`src/public/css/tokens/`) or utilities (`src/public/css/utils/`) that satisfy spacing, color, or layout needs.
- Confirm accessibility expectations with design and accessibility reviewers (focus order, keyboard flows, aria messaging).
- Capture dependencies (API data, analytics, third-party integrations) in the spec or ticket.

**Reference docs**
- `src/content/docs/guidelines/component-standards.md`
- `src/content/docs/guidelines/styling-cube-css.md`
- `src/content/docs/guidelines/tokens-governance.md`
- `src/content/docs/guidelines/demo-playbook.md`

## Decision Ladder (Composition First)
1. **Use an existing DS component** – Configure via props, slots, and CSS variables.  
2. **Apply utilities** – Reach for Every Layout helpers (`stack`, `cluster`, `grid`, etc.) before custom CSS.  
3. **Leverage semantic tokens** – Bind `var(--color-*)`, `var(--space-*)` through inline `cssVars` or style blocks.  
4. **Create a wrapper** – Only when repeatable overrides, domain data shaping, or business logic is required. Place wrappers in `src/components/` and forward DS props explicitly.  
5. **Compose a content component** – Build reusable page sections in `src/components/content/` using DS components and utilities.  
6. **Author new DS component** – Escalate via `_process/spec-drafts/` when no existing pattern fits and design has approved the addition.  
7. **Custom CSS** – Last resort. Must reference tokens, stay scoped, and document rationale in the PR.

Escalate quickly when the ladder fails—open a spec draft and involve design system maintainers for component or token gaps.

## Implementation Steps
1. **Prototype using DS components**  
   - Auto-imported components (`ccmButton`, `ccmCard`, etc.) should cover most needs.  
   - Override styles via component-scoped CSS variables with computed `cssVars`.
2. **Create thin wrappers judiciously**  
   - Place in `src/components/`, transform domain data in computed properties, export DS props.  
   - Avoid re-implementing DS styling; rely on tokens and existing utilities.
3. **Compose content components**  
   - When multiple DS components form a reusable section, create an entry under `src/components/content/`.  
   - Document how consumers configure the section and maintain separation from business logic.
4. **Styling discipline**  
   - Follow `styling-cube-css.md` and `tokens.md`.  
   - Never hard-code primitives or use `!important`. Flag token gaps in the spec.
5. **Accessibility & localization**  
   - Validate keyboard flows, aria semantics, localization boundaries, and content length variations.  
   - Document accommodations in the PR and relevant docs.

## Documentation & Demos
- Update or create demos in `src/components/docs/demos/` following the `demo-playbook.md`.  
- Ensure generated fragments (`_docs/`) and component JSON (`public/component-docs/`) are refreshed via `npm run docs:components:generate`.  
- Add or revise narrative docs (`src/content/docs/components/**`, `src/content/docs/guidelines/**`) and AI mirrors as needed.  
- Record prompt or automation runs in `src/content/docs/prompts/history.md`.

## Validation Pipeline
Run the full suite before requesting review:
```bash
npx eslint src --ext .ts,.vue
npm run lint:css
npm run typecheck
npx vitest run
npm run validate:tokens
npm run docs:components:generate
npm run build
```
Manual QA checklist:
```
- [ ] Responsive behavior verified at mobile, tablet, desktop breakpoints
- [ ] Keyboard and screen reader walkthrough completed
- [ ] Demos and DocsTabs render without console warnings
- [ ] Visual approval captured (screenshots or design sign-off)
- [ ] Performance considerations reviewed (lazy loading, SSR guards)
```
Log skipped items with owners and follow-up issues.

## Handoff & Release
- Populate PR template with validation results, screenshots, and migration notes.  
- Update version metadata, changelog sections, and documentation status fields.  
- Communicate releases to design, docs, QA, and product teams.  
- Provide migration examples and timelines for breaking changes.

## Ongoing Maintenance
- Track follow-up work (token adjustments, demo gaps, documentation debt) in `_process/spec-drafts/` or the project tracker.  
- Schedule audits to consolidate variants or remove outdated wrappers.  
- Keep AI guidance (`src/content/docs/guidelines/ai/*.md`) aligned after every release.

## References
- `src/content/docs/guidelines/component-development.md`
- `src/content/docs/guidelines/component-standards.md`
- `src/content/docs/guidelines/demo-playbook.md`
- `src/content/docs/guidelines/styling-cube-css.md`
- `src/content/docs/guidelines/ai/components.md`
- `src/content/docs/guidelines/ai/styling.md`
