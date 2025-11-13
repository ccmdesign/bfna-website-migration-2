# Workflows Guide

Routes every request to the correct playbook and ensures we never skip validation. Start here before touching code or docs.

---

## 1. Triage Decision Tree

1. **Is this about a DS component (new, update, bugfix)?**
   - Yes → Follow `${PATH_AI_ROOT}/components.md`.
2. **Is this purely styling or token work?**
   - Yes → See `${PATH_AI_ROOT}/styling.md` for token/CUBE rules.
3. **Are you changing documentation pages or Nuxt Content entries?**
   - Yes → Use `${PATH_AI_ROOT}/content.md` for authoring workflow.
4. **Does the task focus on demos or interactive examples?**
   - Yes → Work through `${PATH_AI_ROOT}/demos.md`.
5. **Is this maintenance, migration, or audit work?**
   - Yes → Apply `${PATH_AI_ROOT}/maintenance.md`.
6. **Everything else** → Consult project owner; log the scenario in `_process/spec-drafts/` if it doesn’t map to existing guides.

Always note the chosen path in your working notes/PR so reviewers know which instructions you followed.

---

## 2. Intake Checklist

For any request:

1. **Clarify scope**
   - Restate the ask in your own words.
   - Identify dependencies in `${PATH_DOCS_GUIDELINES}` (e.g., component standards, implementation guide).
2. **Gather assets**
   - Component SFC (`${PATH_DS_COMPONENTS}`), demo (`${PATH_DS_DEMOS}`), docs route (`${PATH_DOCS_COMPONENT_OVERVIEWS}`), tests (`${PATH_TEST_COMPONENTS}`).
3. **Plan validation**
   - List commands from `${PATH_AI_ROOT}/validation.md` you will run.
   - Flag potential blockers (missing tokens, unknown design decisions) and log them early.
4. **Sync stakeholders**
   - If design review is needed, or the change touches production docs, ping owners before implementing.

Document this checklist in the PR or scratch pad before coding—it keeps surprises low.

---

## 3. Execution Flow

1. **Prep**
   - Pull latest main branch, install deps (`npm install`), ensure `npm run dev` can start.
   - Update path tokens if files moved. Keep `${PATH_AI_ROOT}/ai-guidelines-readme.md` current.
2. **Implement**
   - Follow the module-specific guide chosen in the decision tree.
   - Keep commits logical; do not mix component, demo, and doc changes without clear rationale.
3. **Validate**
   - Run every command in `${PATH_AI_ROOT}/validation.md`.
   - Perform manual QA steps (demos, tabs, a11y).
4. **Document**
   - Update changelog/version metadata in overviews.
   - Add notes to `${PATH_AI_ROOT}/maintenance.md` if the change affects long-term tracking.
5. **Review & Handoff**
   - Summarize work, tests, and known issues in PR description.
   - Attach screenshots or console output if relevant.

---

## 4. Escalation Matrix

| Situation | Escalate To | Notes |
| --- | --- | --- |
| Design uncertainty (tokens/variants) | Design system owner | Provide component spec + proposed API; log in `_process/spec-drafts/`. |
| Docs pipeline failures (`generate-component-docs` errors) | Platform/docs maintainer | Reference `${PATH_SCRIPTS_DOCS}` logs; link to `_process/spec-drafts/docs-spec/docs-pipeline-evaluation.md`. |
| Validation blockers (lint/test failures no one can resolve) | Tech lead | Include command output and suspected root cause. |
| Accessibility regressions | Accessibility champion / QA | Provide repro steps and affected components. |

Escalate early; don’t hold blockers silently.

---

## 5. Handoff Template

When opening or updating a PR, include:

```
## Summary
- What changed and why (1–2 bullets)

## Validation
- npx eslint src --ext .ts,.vue ✔️
- npm run lint:css ✔️
- npm run typecheck ✔️
- npx vitest run src/tests/components ✔️
- npm run docs:components:generate ✔️
- npm run validate:tokens ✔️
- Manual QA: /docs/demos/ccm-<name>-demo, /docs/components/<component>

## Follow-ups
- Outstanding tasks, risks, or tickets
```

Update the checklist with ❌ if something was skipped, and explain why.

---

## 6. Audit & Continuous Improvement

- After completing a task, note any guide gaps in `${PATH_AI_ROOT}/maintenance.md`.
- If instructions were unclear, open a docs issue or update the relevant module immediately.
- Reference `_process/spec-drafts/docs-spec/docs-pipeline-evaluation.md` for scheduled audits; feed discoveries back into this workflow.

Consistent process keeps agents aligned and maintainers confident. Run through this guide every time until the steps are second nature.