---
title: ccmSection
description: "Layout section component with flexible content areas and optional side images. Provides a structured container for page sections with configurable padding and background. Supports three content slots (default, left, right) for flexible layouts. When image props are provided, they render in the left/right slots automatically. Uses semantic design tokens for consistent spacing and theming across the application. Follows all 10 Component Standards with positional slot naming and CSS variable patterns."
status: draft
promptId: component-docs
promptVersion: 1.1.0
promptRunId: component-docs-1762805856814
lastPromptRun: "2025-11-10T20:17:36.896Z"
componentVersion: 0.0.0
demoComponent: src/components/docs/demos/ccm-section-demo.vue
legacySource: ../../../../_process/docs-deprecated/components/ccm-section.md
dataHash: 371e58a745a130bc40669671a096bd0a2b5e7baa88b5c8ffa315a35d594837d2
componentId: ccmSection
---

## TL;DR
- Token-driven section wrapper that keeps content aligned with the design grid.
- Supports optional left/right media slots with accessible alt handling.
- Allows background and spacing variations without rewriting layout CSS.
- Ideal building block for GOV.UK- and USWDS-style landing sections in Nuxt.

## Overview
ccmSection standardises page sections with consistent padding, background theming, and optional side imagery. It sits between the hero and detailed content blocks, giving teams a reusable scaffold for marketing, documentation, or product pages.

## When to use
- Create alternating content blocks (text + media) on landing pages.
- Present product highlights or case studies using left/right imagery.
- Wrap dense subsections that require distinct background colours.
- Pair with `ccmCard` or `ccmButton` clusters for call-to-action rows.

## When not to use
- Tiny content snippets that only need margin adjustments—use utility classes instead.
- Layouts requiring complex grid behaviour beyond three slots.
- Full-page hero areas (use `ccmHero`).
- Forms or tables; embed those inside the default slot rather than using the section as a form container.

## Anatomy
- **`<section>` wrapper** – Applies padding, background, and `full-width` attribute.
- **Container (`.center`)** – Keeps content within the layout grid unless `fullWidth` is true.
- **Left slot** – Renders `imageLeft` automatically or accepts custom slot markup.
- **Default slot** – Main column for headings, copy, or cards.
- **Right slot** – Mirrors left behaviour using `imageRight`.
- **Token hooks** – `--_ccm-section-padding-block`, `--_ccm-section-background-color` for easy theming.

## Variants
- **Standard** – Constrained width with balanced columns (default).
- **Full width** – `fullWidth` expands background to viewport edges while content stays centred via `.center`.
- **Media emphasis** – Provide `imageLeft`/`imageRight` or slot custom media components (video, charts).
- **Stacked** – On narrow viewports the slots stack vertically per CSS flex behaviour.

## States
- **Default** – Transparent background, `size = l` padding.
- **Coloured** – Background token adds visual separation between sections.
- **Media-hover** – Images scale on hover via built-in transition.
- **Responsive** – Layout collapses to single column; ensure alt text remains meaningful when imagery stacks.

## API
| Name | Type | Default | Description | Required |
|------|------|---------|-------------|----------|
| `size` | `string` | `'l'` | Padding size using design token scale (s, m, l, xl, 2xl). Controls vertical padding via --space-{size} token. | No |
| `backgroundColor` | `string` | `'transparent'` | Background color token name (e.g., 'color-surface', 'color-primary'). Maps to --{backgroundColor} CSS variable. | No |
| `fullWidth` | `boolean` | `false` | When true, section spans full viewport width. When false, content is constrained to container max-width. | No |
| `imageLeft` | `string` | `''` | Source URL for left-side image. Renders in #left slot when provided. | No |
| `imageLeftAlt` | `string` | `''` | Alt text for left-side image. Required for accessibility when imageLeft is provided. | No |
| `imageRight` | `string` | `''` | Source URL for right-side image. Renders in #right slot when provided. | No |
| `imageRightAlt` | `string` | `''` | Alt text for right-side image. Required for accessibility when imageRight is provided. | No |
## Accessibility
- Ensure each provided image has meaningful alt text or mark it decorative (empty alt) if purely decorative.
- Avoid duplicating headings across consecutive sections; use logical heading levels inside the default slot.
- When using `fullWidth`, ensure link/font colours maintain contrast against new backgrounds.
- For sections acting as major landmarks, consider adding `aria-labelledby` pointing to the main heading within the slot.

## Content guidance
- Keep section headings succinct (≤8 words) and descriptive (“How the service works”).
- Alternate background colours to aid scannability, similar to GOV.UK step-by-step guides.
- Use the left slot for supporting imagery or icon lists that reinforce the copy.
- Align CTAs within the default slot and maintain consistent button styling (primary vs secondary).
- Localise content and alt text per locale; avoid embedding text inside images when possible.

## Implementation notes
- Component source: `src/components/ds/organisms/ccmSection.vue`
- Utilises `.center` utility to respect global max-width; adjust container behaviour in the layout utilities if needed.
- Extend CSS variables to modify hover transitions or add grid-based layout enhancements.
- Combine with `ccmHero` to create holistic landing-page narratives.

## Demo
- `src/components/docs/demos/ccm-section-demo.vue` demonstrates alternating layouts, background themes, and full-width usage.

## Cross-links
- [ccmHero](/docs/components/ccm-hero)
- [ccmCard](/docs/components/ccm-card)
- [Layout guidelines](/docs/guidelines/layout)

## Validation checklist
- [ ] `npm run docs:components:generate`
- [ ] `npm run docs:demos:generate`
- [ ] `npm run docs:scan-todos`
- [ ] `npx eslint src --ext .ts,.vue,.md`
- [ ] `npm run lint:css`
- [ ] `npm run typecheck`
- [ ] Manual QA: `/docs/components/ccm-section` and `/docs/demos/ccm-section-demo`

## Changelog
- 2025-11-03: Authored ccmSection narrative including media slots and accessibility guidance.
- 2025-11-03T01:19:36.974Z: Generated scaffold via `component-docs` v1.0.0.