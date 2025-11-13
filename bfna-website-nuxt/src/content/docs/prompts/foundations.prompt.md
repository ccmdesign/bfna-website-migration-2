---
promptId: foundations-docs
version: 1.0.0
updatedAt: 2025-01-16
---

# Foundations Documentation Prompt

## Scope
- Define the system layer or concept covered (tokens, CUBE CSS, utilities, governance).
- Clarify primary audiences (designers, engineers, docs authors) and why they rely on this foundation.
- List canonical data sources: token exports (`scripts/output/tokens.json`), CSS layer manifests, and relevant Nuxt Content guides.

## Principles
- Anchor guidance to design system principles:
  - Composition first (`stack`, `cluster`, `grid` utilities before custom layout).
  - Semantic tokens over primitives so theming stays resilient.
  - Layered CSS via CUBE methodology—keep overrides intentional and documented.
- Connect each principle to concrete tokens, utilities, or component expectations.

## Token Map
- Reserve space for automated token table insertion.
- Include narrative context for how tokens reinforce the principles.

## Layer Breakdown
- Describe each relevant CSS or architecture layer (reset, defaults, tokens, themes, composition, components, utils, overrides).
- Note import order, dependencies, and overrides, referencing `src/public/css/styles.css`.
- Highlight where contributors can extend the foundation (e.g., new utilities or theme overrides).

## Usage Patterns
- Provide examples of correct implementation scenarios (code snippets, layout recipes, token wiring).
- Call out anti-patterns or deprecated approaches pulled from audits or governance docs.
- Cross-link to demos or component docs that showcase the foundation in practice.

## Authoring Checklist
- Bullet checklist for reviewers to vet updates (semantic tokens, responsive layers, accessibility callouts).
- Ensure prompts cover validation commands (`npx eslint`, `npm run lint:css`, `npm run validate:tokens`) and manual QA expectations.

## References
- Link to source files (`src/public/css/**`, `src/utils/**`), design assets, and supporting guidelines (`src/content/docs/guidelines/*.md`).
- Cite prompts or governance docs that inform this foundation.

## Inputs & Artifacts
- Gather raw data exports (`scripts/output/tokens.json`, layer manifests) before drafting.
- Capture excerpts from related governance docs (documentation, implementation, component standards).
- Note any planning specs or audit findings that should be preserved in the narrative.

## QA Checklist
- [ ] Automated commands executed (`npm run docs:generate`, `npx eslint`, `npm run lint:css`, `npm run validate:tokens`).
- [ ] Cross-checked foundation guidance against live components/demos.
- [ ] Updated changelog or history entry with the prompt version change.
- [ ] Confirmed references in `src/content/docs/prompts/migration-map.md` reflect the new state.
