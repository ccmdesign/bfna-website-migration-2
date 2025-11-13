---
title: Documentation Governance
description: Policy for authoring, reviewing, and maintaining CCM documentation and agent guides.
status: draft
promptId: foundations-docs
promptVersion: 1.0.0
lastPromptRun: null
legacySource: []
---

## Scope & Purpose
- Applies to every Markdown page under `src/content/docs/**` (guidelines, components, tokens, AI guidance) and their mirrors in `src/content/docs/prompts/`.
- Defines ownership, workflow, validation, and archival rules so docs stay accurate for humans and LLM automations.
- Complements the prompts pipeline: when automated scaffolds run, this policy governs how we review, merge, and communicate the results.

## Collections & Ownership
| Collection | Location | Maintainers | Review cadence |
| --- | --- | --- | --- |
| Guidelines | `src/content/docs/guidelines/` | Design system docs team | Quarterly or when workflows change |
| Tokens | `src/content/docs/guidelines/tokens.md` + supporting exports | Token owners (Design Ops + DS engineering) | After each token release |
| CUBE CSS & Utilities | `src/content/docs/guidelines/cube-css.md`, `utilities.md` | Front-end platform | Quarterly |
| Component docs | `src/content/docs/components/` | Component engineering + docs maintainers | With every component release |
| AI guidance | `src/content/docs/ai-guidelines/` | AI enablement + docs maintainers | When human docs change |

Ownership expectations:
- Each maintainer group assigns a publishing owner who signs off on accuracy, metadata, and changelog updates.
- Cross-functional updates (e.g., token + component + AI docs) require sign-off from every affected owner before merge.
- Log governance-level decisions in `src/content/docs/prompts/migration-map.md` or an ADR file so future contributors understand context.

## Authoring Workflow
1. **Draft**
   - Start from the appropriate template under `src/content/docs/templates/` (guidelines, utilities, AI, etc.).
   - Populate complete frontmatter (title, description, status, type if applicable, prompt metadata, version, last updated, tags, related docs).
   - Structure content using the General Documentation Blueprint: overview → rules → examples → appendices.
2. **Internal review**
   - Request peer review from the maintainer group listed above; include the checklist below in the PR.
   - Ensure internal links use the path-token helpers provided by `src/utils/docsPathTokens.ts` (tokens such as `${PATH_DOCS_COMPONENT_OVERVIEWS}`) or absolute paths.
   - Verify examples reference canonical components, demos, or token names that actually exist.
3. **Validation**
   - Run `npm run docs:generate` when prompts or metadata changed, `npm run docs:demos:generate` if demos are affected.
   - Execute `npx eslint src --ext .ts,.vue,.md` and `npm run lint:css` if CSS snippets were added.
   - Use `npm run validate:tokens` whenever token names or usages change.
   - Optional: run the link checker (`node scripts/docs-extract.ts --check-links`) when adding external URLs.
4. **Publish**
   - Bump `lastPromptRun`, `promptRunId`, or version metadata as needed; add a changelog entry at the bottom of the doc.
   - Update AI mirrors (`src/content/docs/ai-guidelines/**`) if content impacts agent instructions.
   - Announce major updates (breaking guidance, new workflows) in the team channel or release notes.

### PR Checklist (copy into descriptions)
```
- [ ] Frontmatter complete (title, description, status, prompt metadata, version, last updated, tags, related docs)
- [ ] Internal links use path tokens or absolute URLs
- [ ] Validation commands executed and results attached
- [ ] AI guidance reviewed/updated if applicable
- [ ] References and changelog entries added
```

## Quality Gates
### Automated
| Tool | Command | Purpose |
| --- | --- | --- |
| Docs generator | `npm run docs:generate` | Refreshes component, foundation, and demo outputs so prompt metadata stays accurate. |
| ESLint | `npx eslint src --ext .ts,.vue,.md` | Lints Markdown headings, code fences, and ensures tokens resolve. |
| CSS lint | `npm run lint:css` | Required if CSS snippets/utilities were edited. |
| Token validator | `npm run validate:tokens` | Mandatory when docs cite new token identifiers. |

### Manual
- Click every link and embedded demo updated in the change.
- Confirm tables include headers, code blocks specify languages, and prose remains accessible.
- Keep `src/content/docs/prompts/history.md` in sync with manual edits by adding changelog entries noting prompt versions and authors.
- Ensure AI guidance mirrors are updated or an issue is filed.

## Regeneration Cadence
- **Components**: regenerate documentation and demos when component APIs change or at least quarterly.
- **Foundations**: rerun `docs:foundations:generate` after token or CSS layer updates.
- **AI guidance**: refresh when human docs change to avoid drift between human and agent instructions.

## Demo Validation Steps
1. Run `npm run docs:demos:generate`.
2. Visit affected docs routes locally, verifying each variant/state renders per the prompt specs.
3. Confirm metadata JSON captures tokens, states, and variants, and capture static HTML snapshots in `src/public/component-docs/` when helpful.
4. Update migration status in `src/content/docs/prompts/migration-map.md` after review.

## Versioning & Changelog Policy
- Use `YYYY.MM[.increment]` when tracking significant governance updates; patch releases document urgent fixes.
- Add a `## Changelog` section (or append to existing one) with date, author, summary, prompt metadata.
- Mark `status` as `canonical` only after full maintainer approval; use `deprecated` with a redirect when retiring content.

## Retirement & Archiving
1. Mark the doc `status: deprecated` with a banner linking to the successor.
2. Log the decision (rationale, owner, follow-up) in an ADR or `migration-map.md`.
3. Move the file to `_archive/docs-archive/` preserving directory structure.
4. Update navigation and AI mirrors to point to the replacement.

## Automation & LLM Guidance
- Use the path tokens defined in `src/utils/docsPathTokens.ts` anywhere automation should swap paths at build time.
- Maintain structured sections and consistent headings so prompts and agents can locate data deterministically.
- Record prompt execution metadata (`promptRunId`, `promptVersion`, `dataHash`) in frontmatter and append runs to `src/content/docs/prompts/history.md`.
- When automation scripts fail, document manual steps required to reconcile outputs (include commands, file paths, expected artifacts).

## Roles & Responsibilities
- **Docs maintainers**: steward governance docs, review prompts, ensure changelog accuracy.
- **Component authors**: keep specs, demos, and component docs current when code changes ship.
- **Automation contributors**: evolve scripts under `scripts/generate-*.ts` and coordinate prompt updates with docs owners.
- **AI enablement**: mirror human docs for agent workflows and surface drift alerts.

## References
- `src/content/docs/prompts/migration-map.md`
- `src/content/docs/prompts/review-checklist.md`
- `scripts/generate-component-docs.ts`, `scripts/generate-foundations-docs.ts`, `scripts/generate-component-demos.ts`
- `src/utils/docsPathTokens.ts`
- `npm run docs:generate`, `npm run docs:demos:generate`, `npm run validate:tokens`
