---
title: CCM Utilities Catalogue
description: Outline for documenting CCM utility classes and composition helpers.
category: Guidelines
type: utilities
status: draft
published: false
priority: Medium
version: 2025.11
last_updated: 2025-11-02
author: Documentation Team
tags:
  - utilities
  - styling
  - cube-css
hero:
  brow: Guidelines
  title: CCM Utilities Catalogue
  tagline: Keep spacing, layout, and typography helpers centralized
related_docs:
  - cube-css.md
  - tokens.md
  - implementation-playbook.md
---

# CCM Utilities Catalogue (Outline)

> TODO: Populate with the authoritative utilities table extracted from `${PATH_PUBLIC_TOKENS}` and future generators.

---

## Purpose

- Centralize all utility classes available to feature teams.
- Explain when to reach for utilities vs composing DS components.
- Provide mapping between utilities and the CUBE CSS layer guidelines in `${PATH_DOCS_GUIDELINES}/cube-css.md`.

## Utility Categories

| Category | Description | Source |
| --- | --- | --- |
| Layout | Flex, grid, and spacing helpers | `${PATH_PUBLIC_TOKENS}/layout.css` (TODO) |
| Typography | Font stacks, weights, sizes | `${PATH_PUBLIC_TOKENS}/typography.css` (TODO) |
| Color | Background, border, text color helpers | `${PATH_PUBLIC_TOKENS}/color.css` (TODO) |
| Interaction | Focus, motion, accessibility utilities | Define once audits complete |

## Authoring Rules

- Utilities must use semantic token values when available.
- Class names follow `u-` prefix (confirm in `${PATH_DOCS_GUIDELINES}/documentation-governance.md`).
- Document usage scenarios; never duplicate component responsibilities.
- Add Vitest coverage (`${PATH_TEST_COMPONENTS}`) when utilities affect runtime behaviors.

## Change Management

1. Propose new utility in PR description referencing this doc.
2. Update this catalogue with description and usage example.
3. Notify AI guide maintainers to sync `${PATH_AI_ROOT}/styling.md`.

## Open Tasks

- Audit existing utilities from `src/public/css/`.
- Decide on automation strategy for generating this catalogue.
- Define cross-linking pattern with component docs once `<DocsTabs>` supports utility references.

## Appendix

- `${PATH_DOCS_GUIDELINES}/cube-css.md`
- `${PATH_DOCS_GUIDELINES}/tokens.md`
- `${PATH_AI_ROOT}/styling.md`

