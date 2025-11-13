---
title: Tokens Governance
description: Policy for proposing, updating, and retiring CCM design tokens.
status: draft
legacySource: []
---

## Scope
- Covers semantic, primitive, and theme token files under `src/public/css/tokens/`.  
- Applies to automation outputs (`scripts/output/tokens.json`) and documentation in `tokens.md`, `styling-cube-css.md`, and AI mirrors.  
- Use this guide alongside `documentation-governance.md` and `ai/styling.md`.

## Principles
- **Semantic-first** – Consumers reference semantic tokens; primitives exist only to build semantics.  
- **Traceable changes** – Every token edit must include rationale, validation output, and changelog updates.  
- **Validated automation** – Regenerate and commit `scripts/output/tokens.json` and downstream docs whenever token values change.  
- **Accessibility + brand compliance** – Tokens must meet contrast ratios and align with approved brand palettes before merge.

## Roles & Ownership
| Area | Primary owner | Collaborators |
| --- | --- | --- |
| Semantic color palette | Design system engineering | Brand design, accessibility reviewer |
| Spacing & sizing scales | Front-end platform | Design ops |
| Typography tokens | Brand design | Docs maintainers |
| Theming overrides | Design system engineering | Feature teams using themes |

Each change requires sign-off from the primary owner and at least one collaborator. Capture approvals in the PR description or linked spec.

## Change Workflow
1. **Propose**  
   - Open a spec in `_process/spec-drafts/` or issue describing the need, affected components/demos, and desired names.  
   - Validate there is no existing semantic token fulfilling the requirement.
2. **Design review**  
   - Collect color contrast findings, spacing scale comparisons, or typographic samples as evidence.  
   - Attach design mocks or theme references if applicable.
3. **Implement**  
   - Update the relevant CSS files under `src/public/css/tokens/`.  
   - Adjust theme overrides (`src/public/css/themes/`) when necessary.  
   - Update `scripts/output/tokens.json` through existing scripts or manual edits if automation has not run yet.
4. **Documentation**  
   - Update `src/content/docs/guidelines/tokens.md` with new entries and rationale.  
   - Note token usage in affected component docs, demos, or AI guides.  
   - Add changelog entries at the bottom of `tokens.md` or related docs.
5. **Validation**  
   - Run:
     ```bash
     npm run validate:tokens
     npm run docs:generate
     npm run lint:css
     npx eslint src --ext .ts,.vue
     npm run typecheck
     ```
   - For color updates, capture contrast reports (WCAG AA/AAA) and attach to the PR.
6. **Communicate**  
   - Post a summary in the release notes, team channel, or maintenance report (`ai/maintenance.md`).  
   - Provide migration guidance when tokens replace primitives or rename existing semantics.

## Naming & Structure Rules
- Use human-readable, intent-based names (`action/background/default`, `surface/border/strong`).  
- Keep hierarchy consistent: `namespace/use/state` or `namespace/axis/step` for spacing.  
- Mirror naming between semantic CSS files and documentation tables.  
- Introduce corresponding component-scoped variables only when semantics cannot express the need.

## Deprecation Process
1. Mark the token as deprecated in documentation with the successor reference.  
2. Provide shims or fallbacks in component code until consumers migrate.  
3. Remove references in demos, DocsTabs metadata, and AI guides.  
4. Delete the token from CSS files and automation outputs after migration completes.  
5. Record the removal in `tokens.md` changelog and the maintenance report.

## Incident Response
- **Validation failure** – Block release, fix CSS syntax or token collisions, rerun `npm run validate:tokens`.  
- **Contrast regression** – Revert the change or supply accessible alternatives before merge.  
- **Automation drift** – Regenerate docs (`npm run docs:generate`) and verify `scripts/output/tokens.json` matches source CSS.  
- Log all incidents and resolutions in `_process/spec-drafts/` or `ai/maintenance.md`.

## References
- `src/public/css/tokens/`
- `scripts/output/tokens.json`
- `src/public/css/themes/`
- `src/content/docs/guidelines/tokens.md`
- `src/content/docs/guidelines/styling-cube-css.md`
- `src/content/docs/guidelines/ai/styling.md`
