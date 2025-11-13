---
title: ccmCard
description: "Documentation scaffold for ccmCard"
status: draft
promptId: component-docs
promptVersion: 1.1.0
promptRunId: component-docs-1762805856814
lastPromptRun: "2025-11-10T20:17:36.888Z"
componentVersion: 0.0.0
demoComponent: src/components/docs/demos/ccm-card-demo.vue
legacySource: ../../../../_process/docs-deprecated/components/ccm-card.md
dataHash: f755d21af292c4d2bedb66ce8b4725d400b11282880dd8f41cc26955bcb9c6bb
componentId: ccmCard
---

## TL;DR
- Clickable teaser card that turns an entire block into a keyboard-accessible link.
- Provides media, body, and CTA slots matching Nuxt UI and Shoelace card conventions.
- Spacing, colours, and id generation are token-driven for consistency across services.
- Ensures the CTA text is announced to assistive tech via `aria-describedby`.

## Overview
ccmCard is the design system’s link-first content teaser. It packages imagery, copy, and a call-to-action into a single NuxtLink that responds to GOV.UK and USWDS accessibility guidance while remaining visually flexible.

## When to use
- Highlight feature content, blog entries, or documentation hubs in a grid.
- Promote cross-sell content inside marketing sections built with `ccmSection`.
- Surface related tasks on service landing pages where cards feel more approachable than tabular lists.
- Replace homemade card markup so content strategists can rely on a single accessible pattern.

## When not to use
- Dense data display—prefer `ccmTable` or a custom list.
- Multi-step task navigation where `ccmTaskList` (planned) better communicates progress.
- Inline contextual links inside paragraphs.
- Actions that don’t navigate; use `ccmButton` for immediate commands.

## Anatomy
- **NuxtLink wrapper** – Entire card is interactive and focusable.
- **Image slot / default image** – 16:9 media region with background token fallback.
- **Content slot** – Primary heading/description area; inherits typography tokens.
- **Action slot** – CTA footer text referenced by `aria-describedby`.
- **CSS variables** – `--_ccm-card-padding`, `--_ccm-card-border-radius`, `--_ccm-card-background-color` etc. supply spacing + colour.

## Variants
- **Default** – Solid border, token-driven padding (`size = l`).
- **Size overrides** – `size` prop adjusts spacing (`s`, `m`, `l`, `xl`).
- **Media treatments** – Provide a custom `#image` slot for illustrations/video thumbnails, or rely on the background colour fallback for iconography.
- **Theming** – Use `backgroundColor` to align with brand palettes in the same way USWDS accent cards vary by token.

## States
- **Idle** – Card obeys base tokens for border and text colour.
- **Hover** – Cursor pointer on children and subtle colour emphasis per CSS tokens.
- **Focus** – Outline uses `--color-primary` to meet WCAG 2.1 guidance.
- **Visited** – NuxtLink handles visited state; adjust tokens if branding requires a distinction.
- **Fallback media** – When `image` is missing, the background swatch ensures the layout remains balanced.

## API
| Name | Type | Default | Description | Required |
|------|------|---------|-------------|----------|
| `to` | `string` | `-` | Destination path or absolute URL for the card link.
Use app-relative routes (e.g., "/blog/post") or full URLs (e.g., "https://example.com"). | No |
| `title` | `string` | `-` | Human-readable title used for the link's aria-label and the image alt text.
Also used to generate a stable id for the CTA description. | No |
| `image` | `string` | `-` | Image URL used by the default image rendering. Provide this when not supplying the #image slot. | No |
| `action` | `string` | `''` | CTA copy rendered in the `action` area and referenced by aria-describedby.
Provide a short, imperative phrase (e.g., "Read more →"). | No |
| `size` | `string` | `'l'` | Spacing scale key controlling internal padding and gaps.
Valid values typically include: "s", "m", "l", "xl". Default is "l". | No |
| `backgroundColor` | `string` | `'color-primary-tint-20'` | Design token name (without the var(--) wrapper) controlling the image area's background color.
Example: "color-neutral-tint-90" → applied as var(--color-neutral-tint-90). | No |
## Accessibility
- Entire card is one focusable element; keyboard activation uses native link semantics.
- CTA text is referenced by `aria-describedby` so screen readers hear “Read more →” style copy.
- Default image alt inherits from `title`; supply a dedicated slot for decorative imagery to avoid redundant text.
- Focus outline meets GOV.UK 3:1 contrast guidance and is visible on dark backgrounds.
- Ensure multiple cards maintain heading order (e.g., `<h3>` inside slot) for screen-reader navigation.

## Content guidance
- Titles should be action-oriented yet concise (≤55 characters) similar to USWDS card copy.
- Body text should summarise value in one or two sentences; avoid duplicating CTA text.
- Keep CTA phrases imperative (“Read more →”, “Explore dataset”).
- Localise arrow glyphs or text as needed; provide fallback text if icons become language-dependent.
- When cards form a group, align verb tense and length to reduce cognitive load.

## Implementation notes
- Component source: `src/components/ds/organisms/ccmCard.vue`
- Utilises `useSlugify` to derive stable IDs; ensure slug logic remains collision-resistant when customising.
- Scoped CSS defines focus ring; adjust via tokens rather than editing component styles directly.
- Works well with `ccmSection` grid utilities or CSS Grid wrappers.
- Add regression tests for new props in `src/tests/components/ds` before shipping.

## Demo
- Example scenarios live in `src/components/docs/demos/ccm-card-demo.vue`, covering size variants, custom imagery, and CTA slots.

## Cross-links
- [ccmSection](/docs/components/ccm-section)
- [ccmButton](/docs/components/ccm-button)
- [Content card guidance](/docs/guidelines/content-cards)

## Validation checklist
- [ ] `npm run docs:components:generate`
- [ ] `npm run docs:demos:generate`
- [ ] `npm run docs:scan-todos`
- [ ] `npx eslint src --ext .ts,.vue,.md`
- [ ] `npm run lint:css`
- [ ] `npm run typecheck`
- [ ] Manual QA: `/docs/components/ccm-card` and `/docs/demos/ccm-card-demo`

## Changelog
- 2025-11-03: Authored usage guidance and accessibility notes for ccmCard.
- 2025-11-03T01:19:36.966Z: Generated scaffold via `component-docs` v1.0.0.