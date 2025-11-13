---
promptId: component-docs
version: 1.1.0
updatedAt: 2025-11-03
---

# Component Documentation Prompt (Narrative Hydration)

You are generating canonical component documentation consumed by DocsTabs, design partners, and AI agents. Produce authoritative markdown that mirrors the component spec, demo coverage, and accessibility requirements.

## Inputs Provided
- Component source SFC under `src/components/ds/**/<Component>.vue` plus supporting composables/utilities.
- Component spec JSON (`src/public/component-docs/<component>.json`) conforming to `component-docs.schema.json`.
- Existing documentation (if any) and change summary highlighting new props, variants, or behaviours.
- Links to related demos or guideline pages that must remain in sync.
- (If available) Guidance fragment extracted from JSDoc (`src/pages/docs/demos/_docs/<component>.html`).

## Modes
- **Scaffold** – when no documentation exists, author every section end-to-end (no TODOs) using the references below.
- **Hydration** – when a doc exists, refresh only the sections that are empty or contain TODOs while preserving frontmatter, headings, and API tables.

## Tasks
1. Review the component implementation, generated spec JSON, demos, and guidance fragments to capture purpose, variants, tokens, accessibility, and content patterns. Cite canonical references (`src/content/docs/guidelines/tokens.md`, `cube-css.md`, `documentation-governance.md`, `ai/ai-maintenance.md`) rather than duplicating rules.
2. Fill every required section with decisive copy; no TODO text or placeholder bullets. Keep overview copy ≤2 sentences.
3. Maintain the `## API` table format (`Name | Type | Default | Description | Required`) while updating descriptions, defaults, and required flags from the spec.
4. Document accessibility affordances (roles, aria attributes, keyboard flows, live regions) and cite WCAG criteria where applicable.
5. Highlight related demos, variants, tokens, and utilities so downstream automation and DocsTabs stay in sync.
6. List the automated commands and manual QA required to validate the update.

## Required Sections
- **TL;DR** – 3–5 bullet summary of key actions or guarantees.
- **Overview** – concise purpose and design role, plus demo availability.
- **When to use** – recommended scenarios; link to tokens/patterns when helpful.
- **When not to use** – anti-patterns with alternate components.
- **Anatomy** – structural regions, DOM roles, slots, tokens/utilities.
- **Variants** – intent and differences for each variant, including dependencies.
- **States** – interactive and validation states with behavioural notes.
- **API** – Props/Slots/Events tables (keep table header, update row content).
- **Accessibility** – keyboard paths, aria guidance, announcements, WCAG refs.
- **Content guidance** – tone, localisation, copy length, iconography rules.
- **Implementation notes** – source files, composables, tests, metadata, registry hooks.
- **Demo** – live demo references and notable coverage gaps.
- **Cross-links** – related components, patterns, guidelines, migration docs.
- **Validation checklist** – automated commands + manual QA steps.
- **Changelog** – append timestamped entry summarising this run.

## Narrative Hydration Protocol
- Preserve frontmatter keys (`title`, `description`, `status`, `promptId`, `promptVersion`, `promptRunId`, `lastPromptRun`, `componentVersion`, `componentId`, `demoComponent`, `legacySource`, `dataHash`) and section order.
- Replace only narrative bodies that are blank or contain TODO placeholders; keep existing prose that remains accurate.
- Keep API table formatting, fenced code blocks, callouts, and footnotes; update only the textual content.
- Maintain links to demos and related docs unless they conflict with new guidance.
- When scaffolding from scratch, author all sections fully—no TODOs.

## Output Format
- Return a single Markdown document targeting `src/content/docs/components/<component>.md`.
- Do not include commentary outside the markdown.
- Remove all TODO strings and placeholder bullets.
- Use concise, action-oriented language and surface relevant tokens/utilities inline.

## Validation Checklist (post-run)
- `npx eslint src --ext .ts,.vue,.md`
- `npm run lint:css`
- `npm run typecheck`
- `npx vitest run src/tests/components/ds --run`
- `npm run docs:components:generate`
- `npm run docs:demos:generate` (if demo references changed)
- Manual QA of the component docs route and DocsTabs embed.

## Maintenance Notes
- Update documentation whenever props, variants, tokens, accessibility hooks, or demos evolve; bump `lastPromptRun` and `dataHash` accordingly.
- Log migrations or deprecations in `src/content/docs/prompts/migration-map.md` and align with design system registry updates.
- Coordinate with demo authors so documentation, demos, specs, and prompts stay synchronised; raise issues for regressions discovered via DocsTabs or visual diff workflows.

## References
- [GOV.UK Design System – Components](https://design-system.service.gov.uk/components/)
- [U.S. Web Design System](https://designsystem.digital.gov/)
- [Shoelace Component Library](https://shoelace.style/)
- [Nuxt UI Documentation](https://ui.nuxt.com/docs/getting-started)
- [shadcn/ui](https://ui.shadcn.com/)
