---
title: ccmHero
description: "Hero section component for page headers and landing sections. A flexible banner component that provides structured slots for top navigation, main content, and bottom metadata. Supports multiple layout variants (default, minimal, full-screen) and size-based spacing. Uses semantic HTML with role=\"banner\" for accessibility. Default variant uses 16:7 aspect ratio. Minimal removes aspect ratio constraints. Full-screen variant stretches to 100vh for immersive landing experiences."
status: draft
promptId: component-docs
promptVersion: 1.1.0
promptRunId: component-docs-1762805856814
lastPromptRun: "2025-11-10T20:17:36.894Z"
componentVersion: 0.0.0
demoComponent: src/components/docs/demos/ccm-hero-demo.vue
legacySource: ../../../../_process/docs-deprecated/components/ccm-hero.md
dataHash: c680f3f742812fa7f6ec10abaa27afbaf185ecfb8e081d549f88f72dad72ff97
componentId: ccmHero
---

## TL;DR
- Banner component with built-in top, main, and bottom slots for page intros.
- Supports content-driven headings or slot-based custom markup.
- Offers default, minimal, and full-screen variants using spacing tokens.
- Mirrors GOV.UK and USWDS hero guidance with balanced typography and clear hierarchy.

## Overview
ccmHero establishes the hero section for a page or landing view. It provides structured slots for navigation, headline copy, and metadata while exposing design tokens so teams can adapt style without rewriting markup.

## When to use
- Introduce a service or page with a prominent heading and supporting copy.
- Provide a top navigation strip or breadcrumbs inside the hero area.
- Highlight a key CTA or summary before diving into page sections.
- Mirror marketing-style hero layouts used in Nuxt UI, Shoelace, or GOV.UK step-by-step patterns.

## When not to use
- Simple section headings; use `ccmSection` with `h2`/`h3` levels instead.
- Sticky headers or global navigation—they belong in layout components.
- Scenarios where the hero would duplicate top-level messaging already displayed elsewhere.
- Pages requiring multiple hero sections; limit to one `role="banner"` per page for accessibility.

## Anatomy
- **Header wrapper** – `<header role="banner">` with `variant`, `hide-top`, and `hide-bottom` attributes.
- **Top region** – Contains default `ccmTopbar` slot and optional `#top` slot for breadcrumbs or alerts.
- **Main region** – Houses default hgroup generated from `brow`, `title`, `tagline` props or custom slot content.
- **Bottom region** – Optional `#bottom` slot for CTAs, bylines, or metadata chips.
- **Token controls** – CSS variables `--_ccm-hero-padding-block`, `--_ccm-hero-background-color`, `--_ccm-hero-aspect-ratio` etc.

## Variants
- **default** – Sets 16:7 aspect ratio; good for marketing hero with imagery.
- **minimal** – Removes aspect ratio constraints for content-driven heights.
- **full-screen** – Expands to viewport height (`100svh`) for immersive landing pages.
- Additional theming achieved by setting `backgroundColor` tokens or overriding heading typography tokens.

## States
- **Idle** – Renders configured padding, background, and default slot content.
- **Hide top** – `hideTop` removes topbar and top slots (useful for clean hero intros).
- **Hide bottom** – `hideBottom` removes bottom callouts; default is `true` for lean heroes.
- **Responsive** – `.center` utility ensures content stays within the grid on large and small viewports.

## API
| Name | Type | Default | Description | Required |
|------|------|---------|-------------|----------|
| `brow` | `string` | `''` | Optional eyebrow text displayed above the main title. Renders as h4 when provided. | No |
| `title` | `string` | `''` | Main hero heading text. Renders as h1 when provided. Falls back to default slot if not provided. | No |
| `tagline` | `string` | `''` | Supporting tagline text displayed below the title. Renders as h3 when provided. | No |
| `backgroundColor` | `string` | `''` | Custom background color using CSS custom property name (without -- prefix). Overrides default background. | No |
| `size` | `string` | `'l'` | Padding size following the s/m/l/xl scale. Controls vertical padding via --space-{size} token. Valid values: s, m, l, xl | No |
| `variant` | `string` | `'default'` | Layout variant affecting aspect ratio and height. Valid values: default (16:7 aspect), minimal (auto height), full-screen (100vh) | No |
| `hideTop` | `boolean` | `false` | Hide the top section (top-bar and top slots). When true, top navigation and related content is hidden. | No |
| `hideBottom` | `boolean` | `true` | Hide the bottom section (bottom slot). When true, bottom metadata and CTAs are hidden. Defaults to true. | No |
## Accessibility
- Declares `role="banner"`; ensure only one hero per document to avoid landmark conflicts.
- Default headings follow logical order (h4 → h1 → h3); customise slot content to maintain accessible outline.
- When `hideTop` or `hideBottom`, verify that essential navigation or CTA content moves elsewhere.
- Background colours must preserve contrast for text; follow GOV.UK/HMG guidance on hero text legibility.
- Provide descriptive text for CTAs inside `#bottom`; avoid icon-only buttons without accessible names.

## Content guidance
- Brow should classify the context (“Service update”, “Case study”).
- Title should be action-oriented and under ~60 characters to mirror GOV.UK hero recommendations.
- Tagline should succinctly expand on the benefit or mission; keep to one or two sentences.
- Use `#bottom` for a primary CTA and optional secondary link; align verbs with `ccmButton` tone.
- Localise copy and ensure directionality (LTR/RTL) remains readable within slot markup.

## Implementation notes
- Component source: `src/components/ds/organisms/ccmHero.vue`
- Default `top-bar` slot renders `ccmTopbar`; override or remove via `hideTop` if navigation is elsewhere.
- Works with `ccmSection` to introduce subsequent content areas, maintaining consistent spacing.
- Update CSS tokens instead of editing component styles when adjusting spacing/colours.
- Add visual regression tests if variants evolve (e.g., hero with imagery overlays).

## Demo
- `src/components/docs/demos/ccm-hero-demo.vue` showcases each variant, size scaling, and slot customisations.

## Cross-links
- [ccmTopbar](/docs/components/ccm-topbar)
- [ccmSection](/docs/components/ccm-section)
- [Content guidance](/docs/guidelines/content-hero)

## Validation checklist
- [ ] `npm run docs:components:generate`
- [ ] `npm run docs:demos:generate`
- [ ] `npm run docs:scan-todos`
- [ ] `npx eslint src --ext .ts,.vue,.md`
- [ ] `npm run lint:css`
- [ ] `npm run typecheck`
- [ ] Manual QA: `/docs/components/ccm-hero` and `/docs/demos/ccm-hero-demo`

## Changelog
- 2025-11-03: Authored hero usage guide, covering variants and accessibility.
- 2025-11-03T01:19:36.972Z: Generated scaffold via `component-docs` v1.0.0.