---
title: ccmFooter
description: "Documentation scaffold for ccmFooter"
status: draft
promptId: component-docs
promptVersion: 1.1.0
promptRunId: component-docs-1762805856814
lastPromptRun: "2025-11-10T20:17:36.891Z"
componentVersion: 0.0.0
demoComponent: src/components/docs/demos/ccm-footer-demo.vue
legacySource: ../../../../_process/docs-deprecated/components/ccm-footer.md
dataHash: 5a1f2e315f7a372a793c927dedc34a9e79eaad1fd262e6112651b82f23315cf8
componentId: ccmFooter
---

## TL;DR
- Provides a semantic `footer` region with configurable padding and background tokens.
- Acts as the base layout for service footers inspired by GOV.UK and USWDS shells.
- Bundles a centred container so content stays aligned with the global grid.
- Plays nicely with `ccmByLine` and future navigation blocks.

## Overview
ccmFooter wraps bottom-of-page content in a styled `footer` element. It centralises spacing, theme tokens, and accessibility so teams can layer navigation, legal copy, or bylines without repeating boilerplate.

## When to use
- Add a consistent footer baseline across pages or Nuxt layouts.
- Present legal information, secondary navigation, or product credits.
- Provide visual separation between main content and closing messaging.
- Create themed landing pages that need alternative footer palettes.

## When not to use
- Micro components requiring only a byline—use `ccmByLine` alone.
- Portals embedding third-party footers (avoid nesting landmarks).
- Sticky action bars or banners that should remain fixed; use a dedicated component instead.
- Pages where the parent shell already defines a `footer` landmark.

## Anatomy
- **`<footer>` wrapper** – Defines the landmark with `role="contentinfo"`.
- **Clustered container** – `.center` utility aligns content for responsive layouts.
- **Default children** – Placeholder heading and `ccmByLine`; swap with slots or composition in consuming layouts.
- **Tokens** – CSS variables `--_ccm-footer-padding-block` and `--_ccm-footer-background-color` respond to props and design token overrides.

## Variants
- **Default** – Transparent background, `size = l` padding.
- **Themed** – Apply `backgroundColor` tokens (`color-neutral-950`, `color-primary-tint-20`, etc.) to match brand palettes.
- **Compact or spacious** – Use size presets (`xs`…`3xl`) to tighten or expand vertical rhythm based on page density.

## States
- **Idle** – Renders configured padding/background tokens.
- **Themed backgrounds** – When `backgroundColor` is set, applied via CSS custom property.
- **Responsive** – Container keeps content centred; ensure nested elements use appropriate layout utilities.

## API
| Name | Type | Default | Description | Required |
|------|------|---------|-------------|----------|
| `backgroundColor` | `string` | `'transparent'` | Background color token name (without var()). When provided, the footer
background will use the CSS variable `--<token>` via `var(--<token>)`.
Examples: `color-neutral-950`, `color-primary-tint-20`.
Default `transparent` leaves background unchanged. | No |
| `size` | `string` | `'l'` | Vertical padding size scale applied via CSS variables.
Valid values: `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl`. | No |
## Accessibility
- Declares `role="contentinfo"` automatically; ensure only one footer landmark per page shell.
- Provide descriptive content inside (e.g., contact links, service owner) to satisfy GOV.UK footer guidelines.
- Maintain link contrast against chosen background tokens, especially for dark themes.
- When localising, ensure language attributes or translation wrappers apply to footer content.

## Content guidance
- Group footer links by theme (About, Support, Policies) per USWDS footer playbook.
- Keep copy concise; avoid repeating navigation already present in the header.
- Include contact or accessibility statements where policy requires.
- Localise legal copy and update dates consistently with `ccmByLine`.

## Implementation notes
- Component source: `src/components/ds/organisms/ccmFooter.vue`
- Uses CSS variables for theming; set project-level overrides in tokens rather than editing this component.
- Replace the stub `<h1>` content when embedding—using slots or composition ensures consistent markup.
- Combine with `ccmByLine`, navigation lists, or newsletter forms as needed.

## Demo
- Demo in `src/components/docs/demos/ccm-footer-demo.vue` illustrates size presets, colour themes, and composed content.

## Cross-links
- [ccmByLine](/docs/components/ccm-by-line)
- [ccmSection](/docs/components/ccm-section)
- [Footer content guidance](/docs/guidelines/content-footers)

## Validation checklist
- [ ] `npm run docs:components:generate`
- [ ] `npm run docs:demos:generate`
- [ ] `npm run docs:scan-todos`
- [ ] `npx eslint src --ext .ts,.vue,.md`
- [ ] `npm run lint:css`
- [ ] `npm run typecheck`
- [ ] Manual QA: `/docs/components/ccm-footer` and `/docs/demos/ccm-footer-demo`

## Changelog
- 2025-11-03: Authored narrative for footer usage, variants, and accessibility.
- 2025-11-03T01:19:36.968Z: Generated scaffold via `component-docs` v1.0.0.