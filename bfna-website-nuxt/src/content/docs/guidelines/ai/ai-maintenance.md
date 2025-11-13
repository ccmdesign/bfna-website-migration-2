---
title: AI Maintenance Guide
description: Keep AI-facing documentation, prompts, and automation outputs accurate.
status: draft
audience: docs-maintainers
promptId: ai-guidance
promptVersion: 0.1.0
lastPromptRun: null
scope: documentation
legacySource: []
---

## Purpose
- Provide a repeatable playbook for maintaining AI-facing docs and ensuring parity with human guidance.
- Define cadence, tooling, and escalation paths for prompt-driven workflows (`scripts/generate-*.ts`, docs regenerations, demo scaffolds).
- Treat generated assets (`src/public/component-docs/*.json`, docs Markdown, demos) as the source of truth—if guidance and source diverge, update the docs.

## Key Inputs
- `src/content/docs/prompts/README.md` – Prompt metadata conventions and regeneration workflow.
- `src/content/docs/prompts/history.md` – Ledger of prompt runs; confirm when automation last executed.
- `scripts/generate-component-docs.ts`, `scripts/generate-foundations-docs.ts`, `scripts/generate-component-demos.ts` – Automation entry points.
- `src/components/ds/**` + `src/components/docs/demos/**` – Authoritative implementations and demos.
- `src/utils/designSystemRegistry.ts`, `src/public/component-docs/*.json` – Generated metadata consumed by agents; validate after regeneration.

## Versioning Policy
1. Use `YYYY.MM.increment` (for example, `2025.11.0`) when versioning automation outputs or component docs. Increment the last segment for multiple updates in the same month.
2. Log version bumps in component JSDoc where available and in the maintenance report (see template below) so humans and bots share the same history.
3. Capture notable changes alongside regenerated assets—include date-stamped bullets in component docs or a central changelog.
4. Block merges if component APIs change without a matching version/log update.

## Deprecation & Removal Flow
1. **Proposal** – Document the intent in planning notes (create a spec in the docs workspace) and loop in design + engineering leads.
2. **Mark as Deprecated** – Flag the status in component docs and maintenance reports; update relevant guidelines so consumers know the replacement.
3. **Communicate** – Publish release notes, link to updated docs, and notify stakeholders in docs/design channels.
4. **Sunset** – Remove the SFC, demo, and generated JSON in one PR. Update the component status matrix and log the change in the maintenance report.

## Automation & Audit Schedule
| Frequency | Task | Command / Artifact |
| --- | --- | --- |
| Every docs-affecting PR | Regenerate impacted assets | `npm run docs:generate`, `npm run docs:demos:generate` |
| Weekly | Validate automation outputs | Review `src/content/docs/prompts/history.md`, inspect generated Markdown/SFCs |
| Weekly | Run lint/tests | `npx eslint src --ext .ts,.vue`, `npm run lint:css`, `npm run typecheck`, `npx vitest run`, `npm run validate:tokens` |
| Monthly | Docs pipeline audit | Execute the docs pipeline evaluation script if present, confirm component coverage in `src/utils/designSystemRegistry.ts` |
| Quarterly | Token/design review | Reconfirm semantic tokens and utilities with design; update governance docs as needed. |

## Workflow
1. **Plan** – Identify which prompts/scripts apply to the change (component, foundations, demos). Confirm required metadata (specs, tokens, demos) is current.
2. **Regenerate** – Run the relevant `npm run docs:*` commands. Inspect generated Markdown, JSON, and SFCs for anomalies.
3. **Validate** – Execute `npx eslint src --ext .ts,.vue,.md`, `npm run lint:css`, `npm run validate:tokens`, and any component-specific tests listed in the task.
4. **Document** – Update frontmatter (`promptRunId`, `promptVersion`, `lastPromptRun`, `dataHash`), append entries to `history.md`, and note changes in doc changelog sections.
5. **Sync AI Docs** – Ensure AI guidance docs (like this one) reference new processes or prompts; file follow-up tasks if large rewrites are needed.

## Guardrails
- No AI-generated update merges without human review using `src/content/docs/prompts/review-checklist.md`.
- Always compare regenerated content against prior versions; revert automation outputs if they diverge unexpectedly and investigate before shipping.
- Preserve migration status in `src/content/docs/prompts/migration-map.md` so future runs know which docs still require manual attention.
- When prompts change, bump `promptVersion` and highlight the update in both the prompt file and history log.

## Incident Response
1. **Detection** – Monitor CI, `history.md`, and staging docs for missing sections, malformed frontmatter, or outdated metadata.
2. **Immediate actions** – Re-run generators, revert if necessary, and notify maintainers in docs channel.
3. **Escalation** – Loop in automation contributors when scripts fail; involve docs maintainers if guidance docs require manual fixes.
4. **Postmortem** – Update this guide or prompts with lessons learned; ensure tests or validations are expanded to catch the issue next time.

## Reporting Template
Use this template for monthly/quarterly check-ins (store under `src/content/docs/guidelines/ai/maintenance-reports/` or in the project tracker):
```
## AI Maintenance Snapshot (YYYY-MM)
- Docs regenerated: components ✅ / foundations ✅ / demos ✅
- Prompt updates: component-docs v1.0.1 (metadata tweaks)
- Issues detected: ccmTable prompt missing new prop (opened #123)
- Follow-ups: Draft new AI guidance for demo accessibility audits
```

## Cleanup & Migration Notes
- When instructions move, copy the canonical content into `src/content/docs/guidelines/**` and leave an archival stub pointing here until the old path is retired.
- Cross-reference generated JSON (`src/public/component-docs/`) with demos (`src/components/docs/demos/`) whenever components move to ensure `/docs/<component>` still renders.
- Before deleting any doc or demo, search for incoming references (`rg '<slug>'`) and update them to the new location.

## References
- `src/content/docs/prompts/README.md`
- `src/content/docs/prompts/history.md`
- `src/content/docs/guidelines/documentation-governance.md`
- `npm run docs:generate`, `npm run docs:demos:generate`
- `npm run validate:tokens`, `npx eslint src --ext .ts,.vue,.md`
