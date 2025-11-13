# Maintenance Guide

Long-term stewardship for the CCM design system. Use this playbook to manage versions, retire legacy APIs, and keep documentation synchronized with the code. Source always wins: defer to `${PATH_DS_COMPONENTS}`, `${PATH_DS_DEMOS}`, and generated assets when conflicts arise.

---

## 1. Key Inputs

- `${PATH_COMPONENT_MIGRATION_CHECKLIST}` – Canonical steps for migrating components to new standards.
- `${PATH_DOCS_COMPONENT_OVERVIEWS}` – Dynamic `/docs/<component>` route driven by generated JSON + demos (no per-component Markdown yet).
- `${PATH_COMPONENT_DOCS_OUTPUT}` – Generated JSON payloads describing props/slots/events.
- `${PATH_SCRIPTS_DOCS}` – Tooling (e.g., `generate-component-docs.ts`) that must be re-run after API changes.
- `${PATH_DOCS_GUIDELINES}` – Human-facing manuals that need updates when policies shift.

Keep these references open when planning maintenance tasks; they are the audit trail for the DS.

---

## 2. Versioning Policy

1. **Version Scheme** – Use `YYYY.MM.increment` (e.g., `2025.11.0`). Increment the final number when shipping multiple updates in a month.
2. **Dual Source** – Until structured metadata ships, log versions in:
   - Component JSDoc (`@version`) when available.
   - Maintenance reports (`_process/maintenance-report-*.md`) or the owning spec.
3. **Changelog Tracking** – Capture notable changes in `_process/spec-drafts/` with date-stamped bullets and ensure `${PATH_COMPONENT_DOCS_OUTPUT}` examples reflect those updates.
4. **Release Note** – Summaries of major shifts still go into `_process/spec-drafts/` or the docs status index so humans can track history.

If the component API changes without a version bump, block the merge until the version is updated.

---

## 3. Deprecation & Removal Flow

1. **Proposal** – Document the intent in `_process/spec-drafts/` and loop in design + engineering leads.
2. **Mark as Deprecated** – Add a `deprecated: true` flag (once schema supports it) or document the status in the maintenance report, and update `${PATH_DOCS_COMPONENT_STANDARDS}` / `${PATH_DOCS_GUIDELINES}` with the new guidance.
3. **Communicate** – Notify consumers via release notes and update any downstream content components.
4. **Sunset** – Remove the SFC, demo, and generated JSON in one PR. Update the component status matrix and mark the change in the maintenance report.

Never leave dead demos or docs behind; they confuse agents and humans alike.

---

## 4. Automation & Audit Schedule

| Frequency | Task | Command / Artifact |
| --- | --- | --- |
| Every DS PR | Regenerate docs assets | `npm run docs:components:generate` |
| Weekly | Run validation suite | `npx eslint src --ext .ts,.vue`, `npm run lint:css`, `npm run typecheck`, `npx vitest run`, `npm run validate:tokens` |
| Monthly | Docs pipeline audit | Execute the script planned in `_process/spec-drafts/docs-spec/docs-pipeline-evaluation.md`, review `_process/components-list.md` against `${PATH_UTILS_DS_REGISTRY}`. |
| Quarterly | Token/design review | Coordinate with design to reconfirm semantic tokens and utilities still match standards; update `${PATH_DOCS_TOKENS}` / `${PATH_DOCS_UTILITIES}` accordingly. |

Track results in the maintenance report (see below) to prevent drift.

---

## 5. Incident Response

1. **Detection** – Broken docs, missing demos, or generator failures are usually spotted via QA, user reports, or CI.
2. **Immediate Actions**
   - Re-run docs generator to ensure assets are fresh.
   - Roll back to the previous working version if the bug shipped (use Git revert on the offending component/demo/docs files).
   - Regenerate docs JSON + HTML so `/docs/<component>` reflects the rollback state.
3. **Escalation** – Loop in component owners and the documentation lead. For high-severity regressions (blocked release, broken accessible flow), open an incident entry in the project tracker and document steps in `_process/spec-drafts/`.
4. **Postmortem** – Update this guide or the relevant blueprint with lessons learned, especially if automation failed to catch the issue.

---

## 6. Reporting Template

Maintain a monthly summary (append to `_process/maintenance-report-YYYY.md` or similar):

```
## 2025-11 Maintenance Snapshot
- Coverage: 12/12 DS components render in `/docs/<component>` and have demos
- Versions updated: ccmBreadcrumb 2025.11.1 (JSON-LD fixes)
- Pending migrations: ccmTable accessibility overhaul (see spec #123)
- Docs debt: component-standards.md needs alignment with new token categories
- Next actions: Run docs audit, coordinate with design on new utilities
```

Share this with stakeholders to keep priorities aligned.

---

## 7. Cleanup & Migration Notes

- When moving instructions out of `_process/` or `.ai/`, ensure the new docs in `${PATH_DOCS_GUIDELINES}` contain the content and add deprecation stubs in the old files.
- Cross-reference `${PATH_COMPONENT_DOCS_OUTPUT}` and `${PATH_DS_DEMOS}` when components move to confirm `/docs/<component>` still loads correctly.
- Before deleting any doc/demo, verify no tests, scripts, or content components import it (search for the slug via `rg`). Update references to the new location if necessary.

---

Consistent maintenance keeps the DS trustworthy. Treat this playbook as mandatory—if you find a scenario it doesn’t cover, update the guide and notify the team so the next maintainer has a clear path.