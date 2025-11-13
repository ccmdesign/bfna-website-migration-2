---
title: Documentation Governance
description: Processes for authoring, reviewing, and maintaining CCM documentation outside component overviews.
category: Guidelines
type: standard
status: canonical
published: true
priority: High
version: 2025.11
last_updated: 2025-11-02
author: Documentation Team
tags:
  - documentation
  - governance
  - process
hero:
  brow: Guidelines
  title: Documentation Governance
  tagline: Keep CCM guidance consistent, current, and machine-readable
related_docs:
  - system-overview.md
  - implementation-playbook.md
  - tokens-governance.md
  - component-design-decisions.md
---

# Documentation Governance

This policy guarantees that every page under `${PATH_DOCS_GUIDELINES}`, `${PATH_DOCS_TOKENS}`, `${PATH_DOCS_UTILITIES}`, and related collections stays accurate, traceable, and consumable by humans and LLM agents. Follow these rules whenever you create, update, or retire documentation.

---

## 1. Taxonomy & Ownership

| Collection | Primary Purpose | Maintainer | Review Cadence |
| --- | --- | --- | --- |
| `${PATH_DOCS_GUIDELINES}` | Canonical standards, playbooks, and governance docs | Design System Docs Team | Quarterly or when workflows change |
| `${PATH_DOCS_TOKENS}` | Token architecture, usage, and maintenance guides | Token Owners (Design Ops + DS Engineering) | Monthly + after each token release |
| `${PATH_DOCS_UTILITIES}` | Layout utilities, spacing helpers, Every Layout reference | Front-end Platform Team | Quarterly |
| `${PATH_DOCS_COMPONENT_OVERVIEWS}` | Component overviews rendered via `<DocsTabs>` | Component Engineering + Docs Maintainers | With every component release |
| `${PATH_AI_ROOT}` | Agent-facing mirrors of canonical docs | AI Enablement | Sync after each human doc change |

Ownership expectations:

- Each maintainer group assigns a publishing owner who signs off on accuracy and metadata.
- Cross-functional updates (tokens + docs + demos) require sign-off from all affected maintainers.
- Record decisions or deviations in `${PATH_DOCS_GUIDELINES}/component-design-decisions` when documentation policy itself changes.

---

## 2. Authoring Workflow

1. **Draft**
   - Start from the appropriate template in `.ai/templates/` (guide, standard, runbook, ADR).
   - Populate complete frontmatter (`title`, `description`, `status`, `type`, `version`, `last_updated`, `tags`, `related_docs`).
   - Write in the structure defined by the General Documentation Blueprint (sections ordered by importance, no “see above/below”).
2. **Internal Review**
   - Request peer review from the maintainer group listed above.
   - Verify cross-links use `${PATH_*}` tokens rather than hard-coded relative paths.
   - Confirm examples reference canonical components, demos, or tokens already in the system.
3. **Validation**
   - Run `npx eslint src --ext .ts,.vue,.md` (configured to lint Markdown frontmatter/links).
   - Execute link checker script if the doc introduces external URLs (`node ${PATH_SCRIPTS_DOCS}/validate-links.mjs`).
   - For docs tied to automation (e.g., tokens), rerun domain-specific validation (`npm run validate:tokens`).
4. **Publish**
   - Merge the doc update with version bump, `last_updated`, and changelog entry.
   - Update `${PATH_AI_ROOT}` mirror if content affects agents.
   - Announce significant changes in the changelog or project communications channel as agreed with stakeholders.

Authoring checklist (include in PR description):

```
- [ ] Frontmatter complete and valid YAML
- [ ] Path tokens used for every internal link
- [ ] Headings follow the designated template for this doc type
- [ ] Related docs list updated
- [ ] Validation commands executed (paste output)
```

---

## 3. Quality Gates

### Automated

- `npx eslint src --ext .ts,.vue,.md` – catches Markdown formatting issues, broken tokens, and lint violations.
- `npm run lint:css` – required when docs reference CSS snippets to ensure examples compile.
- `npm run validate:tokens` – mandatory for any change involving token files or documentation referencing new token names.
- `node ${PATH_SCRIPTS_DOCS}/generate-component-docs.ts` – ensures DocsTabs output remains in sync when docs require regenerated excerpts.

### Manual

- **Link integrity** – Click through every Markdown link and DocsTabs embed added or edited.
- **Accessibility** – Ensure tables include headers, code blocks have language annotations, and content meets readability expectations.
- **Parity check** – Confirm the same guidance appears in `${PATH_AI_ROOT}` modules; update them in the same PR when possible.
- **Traceability** – If updating standards or governance, log the change in `${PATH_DOCS_GUIDELINES}/component-design-decisions` or `_process/spec-drafts/` as appropriate.

No doc ships until all automated and manual gates pass.

---

## 4. Versioning & Changelog Policy

- **version** – Use `YYYY.MM[.increment]` for major updates driven by quarterly planning; append patch segments for urgent fixes (`2025.11.1`).
- **last_updated** – ISO date of merge; bump on every publication.
- **status** – `draft`, `active`, `canonical`, `deprecated`. Move to `canonical` only after sign-off from maintainers.
- **Changelog logging** – Add a short entry to the bottom of the doc (or shared changelog if multiple docs share the change) describing what changed, why, and who approved it.
- **Breaking changes** – When guidance contradicts previous instructions or requires developers to take action, communicate via project announcements and update related docs simultaneously (e.g., standards, playbooks, AI mirrors).

---

## 5. Retirement & Archiving

Criteria for deprecation:

- Guidance no longer reflects active tooling or components.
- Workflow replaced by new playbooks (ensure successor doc exists).
- Doc duplicates canonical content elsewhere.

Retirement process:

1. Update frontmatter `status: deprecated` and add a banner at the top pointing to the replacement doc.
2. Record the decision in `${PATH_DOCS_GUIDELINES}/component-design-decisions` (include rationale and links).
3. Move the Markdown file to `_archive/docs-archive/` using the existing directory structure.
4. Update navigation indices (sidebars, quick links) to remove or relabel the doc.
5. Sync `${PATH_AI_ROOT}` mirrors—deprecated docs should clearly route agents to the new source of truth.

---

## 6. LLM & Automation Considerations

- **Path tokens** – Always use `${PATH_*}` tokens when referencing files, directories, or commands. This keeps AI instructions in sync when paths change.
- **Structured sections** – Follow the General Documentation Blueprint to ensure consistent heading order; agents rely on predictable structures to locate data.
- **Metadata parity** – Mirror frontmatter fields and doc IDs in `${PATH_AI_ROOT}`. Every human doc change should trigger an AI doc review.
- **Generator inputs** – When instructions rely on generated artifacts (DocsTabs JSON, demo snippets), document the exact command to refresh them and any manual steps required if automation fails.
- **Searchability** – Include relevant `tags` and `related_docs` to improve filtering for both humans and agents.

---

## Appendices

### Templates

- `.ai/templates/demo-page-llm-guide.md` – Reference for aligning human docs with agent instructions.
- `${PATH_DOCS_GUIDELINES}/component-standards` – Example of a standards doc applying the standard template.
- `${PATH_DOCS_GUIDELINES}/component-design-decisions` – Example ADR log.

### Review Checklist (Copyable)

```
- [ ] Frontmatter matches schema (title, description, status, type, version, last_updated, author, tags, related_docs)
- [ ] Links use `${PATH_*}` tokens or fully qualified URLs
- [ ] Section order matches document template (overview → rules → appendices)
- [ ] Validation commands executed and attached
- [ ] AI mirror updated or ticket created
```

### Tooling References

| Tool | Command | Notes |
| --- | --- | --- |
| Markdown lint | `npx eslint src --ext .ts,.vue,.md` | Enforces style, headings, fenced code blocks. |
| Link validation | `node ${PATH_SCRIPTS_DOCS}/validate-links.mjs` | Optional but recommended for outbound URLs. |
| Token validation | `npm run validate:tokens` | Required when docs mention new token names. |
| Docs generator | `node ${PATH_SCRIPTS_DOCS}/generate-component-docs.ts` | Keeps DocsTabs payloads aligned with component comments. |

Keep this governance doc close whenever you update CCM guidance. Consistency here prevents documentation drift and keeps automated consumers trustworthy.

