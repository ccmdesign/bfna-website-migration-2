---
promptId: update-component
version: 0.2.0
updatedAt: 2025-11-03
derivedFrom: build-component.prompt.md
---

# Update Component Prompt (Comments + Narrative Hydration)

You are updating an existing CCM design-system component. Refresh inline documentation in the SFC and ensure the published Markdown doc has no TODOs.

## Inputs Provided
- Component name (PascalCase) and optional path hints.
- Current component spec JSON (props, slots, states, variants, tokens, dependencies) matching `component-spec.schema.json`.
- References to affected docs or demos when available.
- The current component documentation page (if it exists).

## Tasks
1. Locate `src/components/ds/**/<ComponentName>.vue` and enrich JSDoc-compatible block comments:
   - Top-level block above `<script setup>` with overview, usage guidance, anatomy, accessibility, content guidance, and `@component`, `@category`, `@standards`.
   - Prop/emits documentation (description, default, type nuances, variant/state interactions).
   - `@usage` / `@snippet` tags where practical.
2. Narrative Hydration of `src/content/docs/components/<slug>.md`:
   - Preserve frontmatter keys and section order.
   - Replace only sections that are blank or contain TODOs (Overview, When to use, When not to use, Anatomy, Variants, States, Accessibility, Content guidance, Implementation notes, Demo, Cross-links, Validation checklist, Changelog).
   - Keep the `## API` table shape; refresh row content using the spec and inline comments.
   - Remove every TODO placeholder.
3. List any demo or metadata follow-ups and the commands required to validate the update.

## Narrative Hydration Protocol
- Keep frontmatter fields intact (`title`, `description`, `status`, `promptId`, `promptVersion`, `promptRunId`, `lastPromptRun`, `componentVersion`, `componentId`, `demoComponent`, `legacySource`, `dataHash`).
- Do not reorder headings or drop existing sections.
- Maintain fenced code blocks, callouts, links, and footnotes unless they conflict with new guidance.
- If a section already has accurate prose, leave it untouched.
- If the doc is missing, author a complete version (no TODOs) using the component-docs prompt as reference.

## Deliverables
1. Updated component SFC (or diff) showing the enriched comments.
2. Updated Markdown document for `src/content/docs/components/<component>.md` with hydrated narratives (no TODOs).
3. Bullet list of follow-up commands or checks required after the update.

## Output Format
1. Code block with the updated component SFC (or focused diff with clear context).
2. Code block containing the complete Markdown doc.
3. Bullet list of validation commands (checked/unchecked markers acceptable).

## Validation Checklist
- `npm run docs:components:generate`
- `npm run docs:demos:generate` (if variants/states changed)
- `npm run validate:tokens` (when referencing new tokens)
- `npx eslint src --ext .ts,.vue,.md`
- `npm run lint:css`
- `npm run typecheck`
- Manual QA of DocsTabs and the component demo route.

## References
- [GOV.UK Design System – Components](https://design-system.service.gov.uk/components/)
- [U.S. Web Design System](https://designsystem.digital.gov/)
- [Shoelace Component Library](https://shoelace.style/)
- [Nuxt UI Documentation](https://ui.nuxt.com/docs/getting-started)
- [shadcn/ui](https://ui.shadcn.com/)
