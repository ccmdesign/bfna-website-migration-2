# CCM Documentation System Primer

Use this guide as the first stop before collaborating on CCM documentation or component work. It explains the living sources of truth, how automation and prompts fit together, and where to find the policies that govern output quality.

## 1. Core Goals
- Keep human-authored guidelines, component docs, and AI outputs aligned.
- Reuse canonical data (tokens, layers, specs) instead of duplicating details in prompts.
- Capture every automated run so updates stay traceable (`history.md`, changelog entries).

## 2. Directory Map
| Area | Purpose |
| --- | --- |
| `src/content/docs/guidelines/` | Canonical standards and playbooks (tokens, CUBE CSS, documentation governance, AI maintenance). |
| `src/content/docs/guidelines/ai/` | AI-focused guidance (`ai-maintenance.md`) and templates for new automation docs. |
| `src/content/docs/components/` | Per-component Markdown generated from specs; fill TODOs using design system references. |
| `src/components/docs/demos/` | Vue demos and metadata consumed by docs pages. |
| `src/content/docs/prompts/` | Prompt templates, automation history, migration tracking, and action-oriented instructions (`build-component`, `component-docs`, etc.). |
| `scripts/generate-*.ts` | Automation scripts that run prompts and emit Markdown/SFC/JSON outputs. |
| `scripts/output/` | Latest design token/layer exports consumed by guidelines. |

## 3. Prompts & Automation
- **Prompt library**: `PROMPTS_INDEX.md` lists available prompts (`build-component`, `component-docs`, `component-demo`, `foundations`, `release-note`).
- **Metadata conventions**: `README.md` defines prompt frontmatter, regeneration checklist, and automation commands.
- **Run history**: `history.md` logs every generator invocation with `promptRunId`, version, and hashes. Update it whenever a prompt runs manually.
- **Migration status**: `migration-map.md` tracks legacy → new doc progress; update it after completing docs or AI guidance.

## 4. Guidance Sources (read before writing)
- **Tokens**: `src/content/docs/guidelines/tokens.md` — semantic vs. primitive usage, governance, validation steps.
- **CUBE CSS**: `src/content/docs/guidelines/cube-css.md` — layer responsibilities, utility usage, change management.
- **Documentation governance**: `src/content/docs/guidelines/documentation-governance.md` — authoring workflow, validation gates, versioning, retirement.
- **AI Maintenance**: `src/content/docs/guidelines/ai/ai-maintenance.md` — cadence for prompts and automation outputs.

Reference these docs instead of restating rules in prompts or component notes.

## 5. Standard Workflow
1. **Clarify** the task and gather specs (component JSON, design references, tokens/layers exports).
2. **Select prompts** from `src/content/docs/prompts/` (e.g., `build-component.prompt.md` for new components, `component-docs.prompt.md` for docs regeneration).
3. **Run automation** via `npm run docs:generate` (all generators) or individual commands (`docs:components:generate`, `docs:foundations:generate`, `docs:demos:generate`).
4. **Review outputs** using `review-checklist.md` and, for demos, `demo-verification.md`.
5. **Update docs** manually where prompts leave TODOs, citing guideline sections as needed.
6. **Record changes** in doc changelogs and append prompt run info to `history.md`.

## 6. Validation Commands
Run the relevant commands before shipping:
- `npm run docs:generate`
- `npm run docs:demos:generate`
- `npm run validate:tokens`
- `npm run lint:css`
- `npx eslint src --ext .ts,.vue,.md`
- `npx vitest run` or targeted tests when components change

## 7. Deliverable Expectations
Every task should include:
- Updated source files (components, demos, docs) referencing semantic tokens and utilities.
- Documented follow-up items in the component doc changelog and migration map.
- Validation checklist results (pass/fail) and notes on manual QA (docs routes, demos, accessibility).

## 8. When in Doubt
- Use `build-component.prompt.md` to generate initial code scaffolding guided by tokens/CUBE CSS.
- Consult governance and AI maintenance docs to ensure process alignment.
- If automation fails or guidance is unclear, document the gap in `ai-maintenance.md` and create follow-up issues.

Keep this primer handy; it anchors every new session so the LLM stays aligned with the CCM documentation system.
