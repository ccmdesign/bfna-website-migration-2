---
title: ccmTopbar
description: "Topbar navigation component providing site header with logo and main navigation. A horizontal navigation bar component that displays the site logo/branding on the left and primary navigation links on the right. Uses CUBE CSS cluster utility for flexible layout. Includes semantic HTML with proper navigation role for accessibility. The logo slot allows custom branding content, defaulting to a site name link. Navigation menu items use semantic link styling with hover states. Designed to work seamlessly within layout components like ccmHero or standalone in page headers."
status: draft
promptId: component-docs
promptVersion: 1.1.0
promptRunId: component-docs-1762805856814
lastPromptRun: "2025-11-10T20:17:36.884Z"
componentVersion: 0.0.0
demoComponent: src/components/docs/demos/ccm-topbar-demo.vue
legacySource: ../../../../_process/docs-deprecated/components/ccm-topbar.md
dataHash: 5936c7379f557c3697d29d64cfdb29c0f842ee71edd36b467f597d8b1e3d4cf9
componentId: ccmTopbar
---

## TL;DR
- Provides a responsive top navigation bar with branding and primary links.
- Slot allows teams to drop in custom logos or product names.
- Uses cluster utility tokens so spacing matches GOV.UK and USWDS headers.
- Designed to compose into `ccmHero` or standalone layout shells.

## Overview
ccmTopbar is the lightweight header bar for design system sites. It surfaces brand identity on the left and a concise navigation cluster on the right, making it ideal for documentation sites, marketing pages, or internal tools.

## When to use
- Present global navigation links at the top of a layout or hero.
- Embed consistent branding across multiple Nuxt pages.
- Provide quick access to top-level routes (Home, Docs, Blog, etc.).
- Prototype headers without wiring an entire layout system.

## When not to use
- Complex mega menus; build a dedicated navigation system instead.
- Applications that already define a shell header (avoid duplicates).
- Mobile-first experiences requiring hamburger menus—extend with responsive logic.
- Contexts where the header must include search/forms; compose additional components alongside the topbar.

## Anatomy
- **Wrapper (`.topbar`)** – Cluster layout aligning logo and navigation horizontally.
- **Logo slot** – Defaults to a NuxtLink “site name”; replace with `<img>` or `<ccmLogo>` as needed.
- **Navigation (`<nav>`)** – Unordered list of NuxtLinks using `.menu__item` styling.
- **Tokens** – Link colours, spacing, and typography driven by design tokens.

## Variants
- **Default** – Inline links with underline on hover; works on light backgrounds.
- **Hero integration** – Slot into `ccmHero`’s `#top-bar` for hero experiences.
- **Dark theme** – Override `--link-color`/`--link-color-visited` tokens globally for dark backgrounds.

## States
- **Idle** – Text inherits base colour tokens.
- **Hover** – Link underlined to align with GOV.UK link guidelines.
- **Visited** – Colour token `--link-color-visited` differentiates visited pages.
- **Focus** – Rely on shared focus outline tokens; ensure they remain visible atop hero backgrounds.

## API
| Name | Type | Default | Description | Required |
|------|------|---------|-------------|----------|
| _TBD_ | `unknown` | `-` | Populate after running prompts. | No |
## Accessibility
- Navigation wrapper uses `<nav role="navigation">`; ensure only one landmark per region or add `aria-label` when composing multiple navs.
- Provide alt text for custom logos and ensure focus order flows left-to-right.
- Links are real `NuxtLink`/`<a>` elements with keyboard/focus support.
- On small screens, consider adding additional responsive behaviour (e.g., collapse into menu) in a host component.

## Content guidance
- Limit navigation items to 3–5 top-level routes; overflow menus degrade discoverability.
- Use concise nouns (“Docs”, “Blog”, “Pricing”) and sentence case.
- Align the brand tone with GOV.UK/USWDS headers—avoid all caps or decorative text.
- Localise route labels and ensure the logo slot displays locale-specific branding if required.

## Implementation notes
- Component source: `src/components/ds/molecules/ccmTopbar.vue`
- Built with `.cluster` utility; adjust spacing by overriding design tokens rather than editing component CSS.
- Extend by wrapping in a higher-order header component that injects search or profile menus.
- Integrates with `ccmHero` and `ccmSection` so top-level pages share consistent structure.

## Demo
- `src/components/docs/demos/ccm-topbar-demo.vue` shows default and custom logo usage.

## Cross-links
- [ccmHero](/docs/components/ccm-hero)
- [ccmSection](/docs/components/ccm-section)
- [Navigation guidelines](/docs/guidelines/navigation)

## Validation checklist
- [ ] `npm run docs:components:generate`
- [ ] `npm run docs:demos:generate`
- [ ] `npm run docs:scan-todos`
- [ ] `npx eslint src --ext .ts,.vue,.md`
- [ ] `npm run lint:css`
- [ ] `npm run typecheck`
- [ ] Manual QA: `/docs/components/ccm-topbar` and `/docs/demos/ccm-topbar-demo`

## Changelog
- 2025-11-03: Authored topbar usage narrative and accessibility notes.
- 2025-11-03T01:19:36.961Z: Generated scaffold via `component-docs` v1.0.0.