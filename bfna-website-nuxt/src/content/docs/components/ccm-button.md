---
title: ccmButton
description: "Primary button component following all 10 Component Standards. A versatile button component that supports multiple variants, sizes, and colors. Can render as button, link (NuxtLink), or anchor based on props. Includes full accessibility support with proper ARIA attributes and keyboard navigation. Uses semantic color tokens for variants. Sizes follow s/m/l/xl scale. See Component Design Decisions for full rationale."
status: draft
promptId: component-docs
promptVersion: 1.1.0
promptRunId: component-docs-1762805856814
lastPromptRun: "2025-11-10T20:17:36.848Z"
componentVersion: 0.0.0
demoComponent: src/components/docs/demos/ccm-button-demo.vue
legacySource: ../../../../_process/docs-deprecated/components/ccm-button.md
dataHash: 615eeb39b6c09e81cb03173a94a4cff9e8d1810acc503f5f3bfb23fa451e1793
componentId: ccmButton
---

## TL;DR
- Polymorphic CTA component that renders as `<button>`, `<a>`, or `NuxtLink` without losing accessibility.
- Ships the token-driven visual system used across GOV.UK- and USWDS-inspired services.
- Handles toggle or disclosure buttons by wiring `aria-pressed` and `aria-expanded` automatically.
- Supports semantic colour, size, and variant palettes aligned with Shoelace and shadcn patterns.

## Overview
ccmButton is the primary call-to-action control for the design system. It provides a consistent visual language, interaction model, and accessibility surface area regardless of whether it navigates, submits, or toggles content.

## When to use
- Triggering the main action on a page or modal (submit, continue, save).
- Linking to high-priority destinations where inline links do not convey enough prominence.
- Converting legacy GOV.UK/USWDS button markup into a Nuxt-friendly component while retaining keyboard support.
- Building toggle or disclosure controls that must communicate pressed/expanded state.

## When not to use
- Presentational chips or filters—use `ccmChip`.
- Multi-choice navigation across views—use `ccmTabs` or `ccmTaskList` style patterns.
- Secondary inline navigation within prose; prefer anchor links styled via typography tokens.
- Continuous form progression (Back/Next) where smaller `s` buttons or `ccmLink` patterns suffice.

## Anatomy
- **Host component** – Polymorphic wrapper derived from `is`, `to`, or `href` props.
- **Core padding + radius** – Driven by `--_ccm-button-padding-*` and `--radius-*` tokens.
- **Content slot** – Defaults to the `label` prop but accepts icons or stacked content per Shoelace guidance.
- **State attributes** – `aria-pressed`, `aria-expanded`, and `aria-disabled` respond to behavioural props.
- **Background override** – Optional CSS variable to meet visual requirements when embedding over imagery.

## Variants
- **primary** (default) – Filled style for primary CTAs following Nuxt UI contrast recommendations.
- **secondary** – Outlined button used for supporting actions or GOV.UK’s secondary buttons.
- **ghost** – Minimal chrome for inline toolbar actions, similar to Shoelace “text” buttons.
- **link** – Styled as a link with button-like focus ring; follow USWDS guidance for inline CTAs.
- **unstyled** – Provides semantics only for bespoke visual treatments.

## States
- **Default** – High-contrast text/background pairings with 4.5:1 minimum ratio.
- **Hover** – Lighten/darken tokens applied via CSS to match the colour palette.
- **Focus** – Outline uses `--color-focus-ring` to mirror GOV.UK yellow halo.
- **Active/Pressed** – Applies subtle translateY and tracks `isPressed` for toggles.
- **Disabled** – Removes pointer events and sets `aria-disabled="true"`.
- **Disclosure** – `isExpanded` toggles expanded state for accordions or menus.

## API
| Name | Type | Default | Description | Required |
|------|------|---------|-------------|----------|
| `is` | `string` | `'button'` | HTML tag to render when not using to/href. Defaults to 'button' for standard button behavior. | No |
| `to` | `string|object` | `null` | Internal route for NuxtLink navigation. When provided, renders as NuxtLink component. | No |
| `href` | `string` | `null` | External URL for anchor link. When provided, renders as <a> tag with href attribute. | No |
| `label` | `string` | `''` | Button text label used as fallback when slot is empty. Takes precedence over slot content for accessibility. | No |
| `size` | `string` | `'m'` | Button size following the s/m/l/xl scale. Controls padding and font size. Valid values: s, m, l, xl | No |
| `color` | `string` | `'base'` | Color theme using semantic design tokens. Valid values: primary, secondary, base, accent, white, success, fail, warning, info | No |
| `backgroundColor` | `string` | `'transparent'` | Custom background color override using CSS custom property name (without -- prefix). Use 'transparent' for default behavior. | No |
| `variant` | `string` | `'primary'` | Visual style variant affecting appearance. Valid values: primary (filled), secondary (outlined), ghost (no border), link (text-only), unstyled (no styles) | No |
| `ariaLabel` | `string` | `null` | Custom aria-label for screen readers. Overrides automatic label generation. Use for buttons with icon-only content. | No |
| `isPressed` | `boolean` | `null` | Toggle button pressed state. Set to true/false for toggle buttons, null for non-toggle buttons. Controls aria-pressed attribute. | No |
| `isExpanded` | `boolean` | `null` | Expandable button expanded state. Set to true/false for expandable buttons, null for non-expandable buttons. Controls aria-expanded attribute. | No |
| `disabled` | `boolean` | `false` | Disable the button and prevent all interactions. Sets aria-disabled and removes pointer events. | No |
## Accessibility
- Keyboard support mirrors native buttons, including `Space` and `Enter` activation.
- Focus ring uses GOV.UK yellow halo but adapts for dark mode to maintain 3:1 contrast.
- Toggle states expose `aria-pressed`; disclosure controls expose `aria-expanded` and must control focus target content.
- Icon-only buttons must pass a meaningful `ariaLabel`; humanised URLs cover links per USWDS guidance.
- Disabled state sets `aria-disabled` and removes interactive handlers while keeping the control tabbable only if required by context.

## Content guidance
- Action text should be imperative verbs (“Save”, “Continue”, “Download report”).
- Keep labels short (≤25 characters) in line with GOV.UK’s button content rules.
- Use sentence case except for proper nouns; avoid all-caps per accessibility best practice.
- Pair iconography with text unless the icon alone is universally understood.
- Localise verbs and ensure translation still fits within the allowed width for the chosen size.

## Implementation notes
- Component source: `src/components/ds/molecules/ccmButton.vue`
- Uses `.ccm-button` scoped styles with semantic design tokens (`--color-*`, `--space-*`).
- Inherits Nuxt routing context to resolve `to` values via `useRouter`.
- Consider adding tests in `src/tests/components/ds/ccmButton.spec.ts` when new variants or behaviours land.
- Works with `ccmButtonGroup` pattern (planned) to mirror Shoelace button groups.

## Demo
- Interactive scenarios: `src/components/docs/demos/ccm-button-demo.vue` covers variants, sizes, and toggle behaviours.

## Cross-links
- [ccmFormField](/docs/components/ccm-form-field)
- [ccmTabs](/docs/components/ccm-tabs)
- [Interaction guidelines](/docs/guidelines/component-standards)

## Validation checklist
- [ ] `npm run docs:components:generate`
- [ ] `npm run docs:demos:generate`
- [ ] `npm run docs:scan-todos`
- [ ] `npx eslint src --ext .ts,.vue,.md`
- [ ] `npm run lint:css`
- [ ] `npm run typecheck`
- [ ] Manual QA: `/docs/components/ccm-button` and `/docs/demos/ccm-button-demo`

## Changelog
- 2025-11-03: Hydrated narrative content and aligned usage guidance with GOV.UK/USWDS button patterns.
- 2025-11-03T01:19:36.919Z: Generated scaffold via `component-docs` v1.0.0.