---
title: ccmByLine
description: "Footer byline component displaying copyright and attribution information. A simple, horizontal layout component that combines copyright notice with a link to the designer's site. Uses the cluster layout utility for automatic spacing and aligns the attribution link to the right. Ideal for page footers. Currently displays fixed content with dynamic year calculation. The cluster layout provides responsive spacing between copyright text and attribution link."
status: draft
promptId: component-docs
promptVersion: 1.1.0
promptRunId: component-docs-1762805856814
lastPromptRun: "2025-11-10T20:17:36.886Z"
componentVersion: 0.0.0
demoComponent: src/components/docs/demos/ccm-by-line-demo.vue
legacySource: ../../../../_process/docs-deprecated/components/ccm-by-line.md
dataHash: dc9c5138b275f10d69797eb4e0424ebea8022915843d8afe05263fb4913c2f3f
componentId: ccmByLine
---

## TL;DR
- Provides a compact copyright + attribution strip for service footers.
- Uses cluster layout spacing so items stay legible on narrow viewports.
- Mirrors GOV.UK and USWDS footer tone with clear ownership language.
- Ships with accessible link styling that adapts to dark or light themes.

## Overview
ccmByLine renders a copyright notice and attribution link using the design system’s cluster layout utility. It is optimised for inclusion at the base of ccmFooter or standalone layouts where concise attribution is required.

## When to use
- Add legal or editorial ownership to a service footer.
- Provide a link to the organisation or vendor responsible for the experience.
- Complement ccmFooter when only a single line of attribution is needed.
- Reinforce brand trust on microsites modelled after GOV.UK or USWDS frameworks.

## When not to use
- Full-width footers requiring navigation grids—use `ccmFooter` instead.
- Pages needing per-locale wording (translate the content and export a localised variant before use).
- Situations where dynamic links must be supplied by CMS entries—create a wrapper component that injects props.
- Legal notices longer than one sentence (use a stacked layout or dedicated footer card).

## Anatomy
- **Wrapper (`div.by-line`)** – Applies `.cluster` utility for horizontal spacing and wraps on small screens.
- **Copyright span** – Injects the current year via template interpolation.
- **Attribution link** – Styled anchor with focus and visited states that meet WCAG contrast.

## Variants
- **Default (light theme)** – Neutral text with standard link colour.
- **Dark theme** – Inherit from parent background; ensure `--link-color` tokens are set for dark mode.
- Custom wrappers can apply additional spacing or borders but reuse the same internal markup.

## States
- **Idle** – Text and link use base colour tokens.
- **Hover** – Link underlined to align with GOV.UK link guidance.
- **Focus** – Inherits global focus halo to guarantee 3:1 contrast.
- **Visited** – Uses `--link-color-visited` for clarity while respecting WCAG.

## API
| Name | Type | Default | Description | Required |
|------|------|---------|-------------|----------|
| _TBD_ | `unknown` | `-` | Populate after running prompts. | No |
## Accessibility
- Uses semantic text and anchor tags; no extra roles are required.
- Link hover/focus styles follow GOV.UK link guidance for keyboard and pointer users.
- Ensure the surrounding footer sets `aria-label` or landmark semantics; byline should live inside a `footer` element where possible.
- Update attribution wording to match locale requirements; screen readers read content verbatim.

## Content guidance
- Use “© {year} {organisation}” format recommended by USWDS.
- Keep attribution succinct (≤40 characters) and avoid marketing slogans.
- Localise the “by” phrasing for non-English locales.
- When linking to external partners, include descriptive link text (“by Example Studio”) rather than bare URLs.

## Implementation notes
- Component source: `src/components/ds/organisms/ccmByLine.vue`
- Relies on layout utility classes defined in `src/content/docs/guidelines/component-standards.md`.
- Adjust link colours by overriding `--link-color` / `--link-color-visited` tokens in the consuming layout.
- Expand via slots or props by wrapping the component—core implementation remains intentionally minimal.

## Demo
- Example usage: `src/components/docs/demos/ccm-by-line-demo.vue` showcases default and dark theme wrappers.

## Cross-links
- [ccmFooter](/docs/components/ccm-footer)
- [ccmSection](/docs/components/ccm-section)
- [Footer content guidance](/docs/guidelines/content-footers)

## Validation checklist
- [ ] `npm run docs:components:generate`
- [ ] `npm run docs:demos:generate`
- [ ] `npm run docs:scan-todos`
- [ ] `npx eslint src --ext .ts,.vue,.md`
- [ ] `npm run lint:css`
- [ ] `npm run typecheck`
- [ ] Manual QA: `/docs/components/ccm-by-line` and `/docs/demos/ccm-by-line-demo`

## Changelog
- 2025-11-03: Authored narrative guidance for footer attribution usage.
- 2025-11-03T01:19:36.963Z: Generated scaffold via `component-docs` v1.0.0.