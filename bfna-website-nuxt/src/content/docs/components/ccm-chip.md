---
title: ccmChip
description: "Documentation scaffold for ccmChip"
status: draft
promptId: component-docs
promptVersion: 1.1.0
promptRunId: component-docs-1762805856814
lastPromptRun: "2025-11-10T20:17:36.858Z"
componentVersion: 0.0.0
demoComponent: src/components/docs/demos/ccm-chip-demo.vue
legacySource: ../../../../_process/docs-deprecated/components/ccm-chip.md
dataHash: e4be0a71e7e6d5d521f6a5d48f095e0b6f2ee359abbd3da3025eb1eaa92bdf5a
componentId: ccmChip
---

## TL;DR
- Compact status/tag pill that can act as static metadata, a button, or a link.
- Ships filled, outlined, and minimal variants aligned with design tokens.
- Optional icons and dismiss affordance mirror Shoelace and shadcn chip patterns.
- Emits `click`/`dismiss` events when interactive to support filter UIs.

## Overview
ccmChip is the system’s token-driven badge component. It adapts to navigational, filter, or status use cases while maintaining consistent spacing, colour, and typography across GOV.UK- and USWDS-inspired applications.

## When to use
- Display taxonomy or status metadata near titles and tables.
- Provide selectable filters or toggles in search interfaces.
- Highlight live indicators (e.g., “Beta”, “Draft”) alongside headings.
- Surface quick navigation to related docs when `to` is supplied.

## When not to use
- Primary actions—use `ccmButton`.
- Large blocks of descriptive text; chips are intentionally terse.
- Dismissible alerts or banners—consider `ccmNotification` (planned).
- Cases requiring complex keyboard navigation across chip groups without additional management (roll your own roving tabindex if needed).

## Anatomy
- **Wrapper component** – Polymorphic (`span`, `button`, or `NuxtLink`).
- **Icon-before slot/prop** – Optional glyph leading the label.
- **Label span** – Defaults to `label` prop; keep text short.
- **Icon-after slot/prop** – Trailing glyph or dismiss button when `dismissible`.
- **CSS variables** – Control padding, font size, icon size, colours, and borders per variant.

## Variants
- **filled** – Solid background using tint tokens, inspired by USWDS status pills.
- **outlined** – Transparent background with token border for low-emphasis tags.
- **minimal** – Text-only appearance for subtle annotations.
- **Custom colour** – Use `customColor` to map to any design token while preserving readable foregrounds.

## States
- **Idle** – Base colour palette defined by variant + colour tokens.
- **Hover** – Slight opacity/border emphasised for interactive chips.
- **Focus** – Inherits global focus halo for WCAG compliance.
- **Active** – Emits `click` when used as interactive button/link.
- **Disabled** – Removes events and applies dimmed foreground.
- **Dismissible** – Injects an inline dismiss button with stop-propagation to prevent accidental navigation.

## API
| Name | Type | Default | Description | Required |
|------|------|---------|-------------|----------|
| `is` | `string` | `'span'` | Root HTML tag when not interactive or link.
Use 'button' only when you need custom semantics; otherwise set `interactive`.
Defaults to 'span'. | No |
| `to` | `string` | `null` | NuxtLink target. When provided, chip renders as `NuxtLink` and emits `click` on activation.
Example: '/docs/ccm-chip'. | No |
| `label` | `string` | `''` | Fallback text label if default slot is empty. Also used for `aria-label`
when `ariaLabel` is not provided. | No |
| `iconBefore` | `string` | `''` | Optional inline content rendered before the label when `icon-before` slot is unused.
Provide a short text/icon glyph. | No |
| `iconAfter` | `string` | `''` | Optional inline content rendered after the label when `icon-after` slot is unused.
Ignored when `dismissible` is true (dismiss button is shown instead). | No |
| `size` | `string` | `'s'` | Visual size preset.
Valid values: 'xs' | 's' | 'm'. Defaults to 'm'. | No |
| `variant` | `string` | `'filled'` | Visual style variant.
Valid values: 'filled' | 'outlined' | 'minimal'. Defaults to 'filled'. | No |
| `color` | `string` | `'neutral'` | Semantic color token name.
Valid values: 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info'. | No |
| `customColor` | `string` | `null` | Custom background color token name (without leading --). When set, overrides
variant/color mapping for background and uses a readable foreground.
Example: 'color-brand-500'. | No |
| `ariaLabel` | `string` | `null` | Explicit accessible name. Falls back to `label` or null when not provided. | No |
| `dismissible` | `boolean` | `false` | When true, displays a dismiss button and emits `dismiss` on activation. | No |
| `disabled` | `boolean` | `false` | Disables interaction and dims appearance. | No |
| `interactive` | `boolean` | `false` | Makes the chip keyboard/mouse interactive, rendering as a `button` when not a link. | No |
## Accessibility
- In interactive mode, chips behave as buttons or links with keyboard activation on `Enter`/`Space`.
- Provide meaningful `ariaLabel` when using icons without visible text.
- Dismiss button inherits the chip label to generate “Remove {label}”; ensure the label is concise.
- Focus outline meets WCAG contrast tokens and is large enough for touch targets per GOV.UK specs.
- Keep chip groups manageable—introduce ARIA list semantics if presenting long filter collections.

## Content guidance
- Use sentence case and limit labels to one or two words (“Design system”, “Beta”).
- Colour should map to meaning (success = green, warning = amber) to align with USWDS status colours.
- For dismissible chips, phrase labels as nouns so “Remove {label}” reads naturally.
- Localise icon glyphs if they include language-specific characters.

## Implementation notes
- Component source: `src/components/ds/molecules/ccmChip.vue`
- Token mappings live inside the component; adjust primary colours in the design token sheets, not here.
- Emits events via Vue’s `emit`; add tests when introducing new behaviours.
- Integrates well with `ccmTabs` filters or `ccmTable` row metadata.

## Demo
- Usage patterns demonstrated in `src/components/docs/demos/ccm-chip-demo.vue`, including interactive, dismissible, and colour variations.

## Cross-links
- [ccmButton](/docs/components/ccm-button)
- [ccmTabs](/docs/components/ccm-tabs)
- [Status badge guidance](/docs/guidelines/status-labels)

## Validation checklist
- [ ] `npm run docs:components:generate`
- [ ] `npm run docs:demos:generate`
- [ ] `npm run docs:scan-todos`
- [ ] `npx eslint src --ext .ts,.vue,.md`
- [ ] `npm run lint:css`
- [ ] `npm run typecheck`
- [ ] Manual QA: `/docs/components/ccm-chip` and `/docs/demos/ccm-chip-demo`

## Changelog
- 2025-11-03: Added narrative guidance and accessibility details for ccmChip.
- 2025-11-03T01:19:36.931Z: Generated scaffold via `component-docs` v1.0.0.