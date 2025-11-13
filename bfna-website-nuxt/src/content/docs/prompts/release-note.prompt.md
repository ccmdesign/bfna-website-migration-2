promptId: release-note
version: 0.1.0
updatedAt: 2025-01-16
---

# Release Note Prompt

## Summary
- Provide a concise headline describing the design system update.
- Include the impacted component or guideline scope.

## Audience
- Specify who needs this information (designers, engineers, stakeholders).
- Note rollout or adoption timelines.

## Change Details
- Bullet the key changes, linking to updated docs where possible.
- Mention new prompts, components, or tokens that shipped.

## Action Items
- List required follow-up tasks for consumers of the release.
- Highlight migration steps or testing expectations.

## Validation
- Describe how the update was verified (tests, demos, audits). Include required commands: `npx eslint`, `npm run lint:css`, `npm run typecheck`, `npx vitest run`, `npm run docs:generate`, `npm run validate:tokens`.
- Point to automation outputs or review sign-offs, including DocsTabs checks and demo walk-throughs.

## References
- Link to regenerated docs, PRs, or issue trackers.
- Cite legacy content or prompts used to prepare the release.

## Intake Checklist
1. Restate the scope and dependencies (components, tokens, docs routes).
2. Gather assets: SFC, demo, generated JSON, and relevant tests.
3. Plan validation—list the commands above plus any component-specific scripts.
4. Sync stakeholders (design, docs owners) before drafting the note.

## Escalation Matrix
| Situation | Escalate To | Notes |
| --- | --- | --- |
| Design uncertainty (tokens/variants) | Design system owner | Provide component spec + proposed API. |
| Docs pipeline failures | Platform/docs maintainer | Attach generator logs and failing command output. |
| Validation blockers | Tech lead | Include evidence and suspected root cause. |
| Accessibility regressions | Accessibility champion / QA | Supply repro steps and impacted components. |

## Handoff Template
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
- Manual QA: /docs/demos/<component>, /docs/components/<component>

## Follow-ups
- Outstanding tasks, risks, or tickets
```

## Continuous Improvement
- After publishing the release note, log any gaps discovered in component or guidance docs.
- Update relevant prompts or workflows if new steps emerged during the release.
