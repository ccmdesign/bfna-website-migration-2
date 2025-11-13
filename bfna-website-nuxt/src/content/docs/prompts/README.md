# Docs Prompt Authoring

## Goals
- Provide a consistent starting point for regenerating design system docs with LLM prompts.
- Capture source relationships so writers know when to reference legacy material.
- Outline the workflow for preparing inputs and reviewing generated outputs.

## Source Map
- Component docs: `src/content/docs/components/` (generated skeletons + manual enrichments)
- Guidelines & foundations: `src/content/docs/guidelines/`
- AI usage guidance: `src/content/docs/guidelines/ai/`
- Prompts & automation history: `src/content/docs/prompts/**`
- Demos: `src/components/docs/demos/`
- Migration tracking: `src/content/docs/prompts/migration-map.md`

## Prompt Metadata Conventions
```yaml
promptId: component-docs
version: 1.0.0
updatedAt: 2025-01-16
```
- `promptId` mirrors the automation script that consumes the prompt.
- `version` increments when the prompt wording or structure changes.
- `updatedAt` follows `YYYY-MM-DD`.
- Use `derivedFrom` sparingly; prefer citing current docs or specs in the prompt body.

## Input Requirements
- Component prompts expect component metadata (props, slots, tokens, states, variants) exported from `src/components/ds/**`.
- Foundations prompts require token exports (see `scripts/output/tokens.json`), CUBE layer manifests, and curated excerpts from guidelines.
- Demo prompts pull component metadata plus any curated variant/state matrices.

## Regeneration Checklist
- Confirm prompt version is current and recorded in target doc frontmatter.
- Gather fresh component metadata and demo definitions.
- Provide legacy excerpts as context if automation cannot infer nuanced guidance.
- Run the related `scripts/generate-*.ts` command and inspect generated Markdown/SFC output.
- Log regeneration details in `src/content/docs/prompts/history.md` (Phase 2 scope).

## Component Specification Schema
- Component automation expects metadata that satisfies `component-spec.schema.json`.
- Specs list `props`, `slots`, `events`, `tokens`, `states`, `variants`, and `dependencies`.
- Scripts validate structure downstream; keep additions backward compatible.

## Automation Commands
- `npm run docs:generate` runs all prompt-driven generators.
- Individual commands: `docs:components:generate`, `docs:foundations:generate`, `docs:demos:generate`.
- Outputs land under `src/content/docs/**`, `src/components/docs/demos/`, and `scripts/output/`.

## Orientation
- Read `docs-system-overview.md` for a high-level map of guidelines, prompts, and automation before starting new work.
- Review `src/content/docs/prompts/migration-map.md` to confirm which prompts still need manual enrichment.

## New Component Onboarding
- Draft or update the component spec (`component-spec.schema.json`) alongside the SFC implementation.
- Run `npm run docs:demos:generate` to scaffold demo assets, then implement required variants/states.
- Execute `npm run docs:components:generate` to populate documentation scaffolds.
- Capture manual notes in Changelog sections and update `migration-map.md`.
- Optional: hook scripts into CI to detect new components and trigger prompt regeneration.

## Maintenance for Evolving DS
- Update prompts when component APIs materially change or new variants launch.
- Revise foundations prompts after token restructures or CSS layer updates.
- Review legacy source directories quarterly to identify content requiring migration.
- Coordinate with automation updates so `promptVersion` and script expectations stay aligned.
