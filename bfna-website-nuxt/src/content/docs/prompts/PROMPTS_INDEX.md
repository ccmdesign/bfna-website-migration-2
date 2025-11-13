# Prompt Index

| Prompt file | Prompt ID | Intended output | Primary script |
|-------------|-----------|-----------------|----------------|
| `component-docs.prompt.md` | `component-docs` | Component documentation Markdown | `scripts/generate-component-docs.ts` |
| `build-component.prompt.md` | `build-component` | Vue design-system component implementation | _manual/LLM run_ |
| `update-component.prompt.md` | `update-component` | Refresh inline docs/comments for existing component | _manual/LLM run_ |
| `docs-system-overview.md` | n/a | Getting-started guide for LLM collaborators | Reference |
| `foundations.prompt.md` | `foundations-docs` | Foundations & guideline Markdown | `scripts/generate-foundations-docs.ts` |
| `component-demo.prompt.md` | `component-demo` | Vue SFC demos + metadata | `scripts/generate-component-demos.ts` |
| `release-note.prompt.md` | `release-note` | Release note drafts for DS updates | _TBD_ |

Update this index when new prompts are introduced or automation scripts change.
