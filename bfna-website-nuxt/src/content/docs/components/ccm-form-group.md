---
title: ccmFormGroup
description: "Container component for grouping related buttons with shared borders and spacing. Groups multiple button elements together, removing border radius between them and applying negative margins to create a visually connected button group. Supports semantic variants via attribute selectors and customizable spacing through design tokens. Includes accessibility support with ARIA roles and labels. Use for action groups, toolbar-style controls, or any context where buttons should appear as a single cohesive unit."
status: draft
promptId: component-docs
promptVersion: 1.1.0
promptRunId: component-docs-1762805856814
lastPromptRun: "2025-11-10T20:17:36.868Z"
componentVersion: 0.0.0
demoComponent: src/components/docs/demos/ccm-form-group-demo.vue
legacySource: ../../../../_process/docs-deprecated/components/ccm-form-group.md
dataHash: 1dcc815d038c6c995d497cb3ca274f39e9f7e66abaf119219b35e9c442ceb39f
componentId: ccmFormGroup
---

## TL;DR
- Wraps sequential buttons and removes adjoining border radii for unified groups.
- Supports toolbar semantics and custom aria labels for assistive tech.
- Provides token hooks for radius, gap, and background alignment.
- Mirrors Shoelace button-group and USWDS toolbar patterns in Nuxt projects.

## Overview
ccmFormGroup bundles multiple actions into a single visual and semantic unit. It trims neighbouring borders, exposes ARIA hooks, and ensures grouped buttons look cohesive across GOV.UK- and USWDS-style services.

## When to use
- Present primary + secondary buttons side by side (“Cancel / Save”).
- Build compact editor toolbars using `role="toolbar"`.
- Create segmented controls or filter chips when each option is a button.
- Replace custom CSS hacks that join buttons while maintaining accessibility.

## When not to use
- Grouping controls that aren’t buttons (use flex utilities instead).
- Forms that need labelled control sets (use `ccmFormField` or `ccmFormGroup` in combination with fieldsets/legends).
- Navigation tabs—use `ccmTabs` which manages keyboard focus differently.
- Layout rows where spacing tokens alone suffice; reserve ccmFormGroup for cohesive button groups.

## Anatomy
- **Wrapper element** – Polymorphic tag (`div`, `nav`, `section`) with `.ccm-form-group` styles.
- **Default slot** – Buttons or button-like components arranged in sequence.
- **Token hooks** – CSS variables for border radius, padding, and gap (extend via project styles).
- **Accessibility props** – `role` and `aria-label` optional attributes for toolbars/groups.

## Variants
- **default** – Inline-flex group with negative margins to collapse borders.
- **Attached** (custom) – Style using `[variant='attached']` to remove spacing entirely.
- **Toolbar** – Apply `role="toolbar"` and set `ariaLabel` to describe the action set.
- **Segmented** – Combine with `ccmButton` outline variants for toggle-style controls.

## States
- **Idle** – Buttons retain their individual focus/hover states while appearing connected.
- **Hover/Focus** – Each child button handles interaction styling; ensure adjacent buttons maintain visible focus (consider outline offsets).
- **Disabled children** – Place disabled buttons as needed; the group wrapper remains unaffected.

## API
| Name | Type | Default | Description | Required |
|------|------|---------|-------------|----------|
| `is` | `string` | `'div'` | Root HTML element tag for the group container. Common values: 'div', 'nav', 'section'. | No |
| `size` | `string` | `'m'` | Padding scale for the group container; uses space tokens (e.g., 2xs, xs, s, m, l). Maps to --_ccm-form-group-padding. | No |
| `variant` | `string` | `'default'` | Presentation style variant. Use attribute selectors in CSS to style variants (e.g., [variant='attached']). | No |
| `gap` | `string` | `'xs'` | Gap spacing between grouped buttons; uses space tokens (e.g., 2xs, xs, s, m, l). Maps to --_ccm-form-group-gap. | No |
| `backgroundColor` | `string` | `'transparent'` | Background color design token name (without -- prefix). Example: 'color-surface-subtle' or 'color-brand-500'. Maps to --_ccm-form-group-background-color. | No |
| `borderRadius` | `string` | `'m'` | Border radius token for outer corners (e.g., s, m, l, pill). Maps to --_ccm-form-group-border-radius. | No |
| `ariaLabel` | `string` | `null` | Accessible label for the group when no visible label exists. Recommended for toolbar or split button variants. | No |
| `role` | `string` | `null` | ARIA role for the container. Common values: 'group', 'toolbar'. Use 'toolbar' for action toolbars. | No |
## Accessibility
- Use `role="group"`