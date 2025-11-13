---
title: ccmTable
description: "Accessible, token-driven table with slot-first API and data-driven fallback. Renders semantic table markup. When the default slot is provided, it renders the given table structure as-is. Otherwise, it can render a simple table from a 2D data structure via the `data` prop. Visuals are controlled via CSS tokens."
status: draft
promptId: component-docs
promptVersion: 1.1.0
promptRunId: component-docs-1762805856814
lastPromptRun: "2025-11-10T20:17:36.899Z"
componentVersion: 0.0.0
demoComponent: src/components/docs/demos/ccm-table-demo.vue
legacySource: ../../../../_process/docs-deprecated/components/ccm-table.md
dataHash: b6376622ef1d4e1213ab8faa77e6f0fbe0145c38760a215a123ac9d35d18c069
componentId: ccmTable
---

## TL;DR
- Slot-first table that falls back to a lightweight data renderer.
- Applies design tokens for colours, borders, and spacing to match DS themes.
- Supports captions, row headers, and variant styling aligned with GOV.UK table guidance.
- Ideal for quick prototypes: drop data arrays in dev, replace with semantic markup later.

## Overview
ccmTable standardises tabular presentation across the design system. It accepts full semantic markup via slots while providing an optional `data` prop for quick renders, ensuring teams keep tables accessible without bespoke CSS.

## When to use
- Display structured information where relationships are best represented in rows/columns.
- Prototype content quickly before building a dedicated table component.
- Present small data sets in documentation or admin dashboards.
- Style tables consistently across marketing and product pages using design tokens.

## When not to use
- Complex interactive grids; use a dedicated data grid solution.
- Layout tasks better served by definition lists or cards (USWDS recommends avoiding tables for general formatting).
- Large datasets requiring virtualisation or sorting/filtering—extend with a separate component.

## Anatomy
- **`<table>` element** – Root with `.ccm-table` class and token-based styling.
- **Caption** – Optional `<caption>` for descriptive labelling.
- **Default slot** – Accepts full `<thead>`, `<tbody>`, `<tfoot>` markup.
- **Data renderer** – When no slot is provided, `data.headers` + `data.rows` create semantic markup automatically.
- **CSS variables** – `--_ccm-table-*` tokens control colours, padding, and radii.

## Variants
- **primary** (default) – Adds outline and subtle row dividers.
- **secondary** – Renders separators only; extend via `[variant='secondary']` in CSS.
- **Custom appearence** – Override `backgroundColor`, `color`, `borderColor`, and `borderRadius` tokens for themed tables.
- Row header mode (`rowHeaders`) ensures first column uses `<th scope="row">` to align with GOV.UK accessibility rules.

## States
- **Default** – Transparent backgrounds, token-defined text colour.
- **Striped backgrounds** – Set `backgroundColor` to apply header and body fills automatically.
- **Responsive overflow** – Wrap in a horizontally scrollable container at layout level when tables exceed viewport width.
- **Focus outlines** – Manage cell focus states manually if adding interactive content inside cells.

## API
| Name | Type | Default | Description | Required |
|------|------|---------|-------------|----------|
| `data` | `TableData` | `undefined` | _Add description_ | No |
| `caption` | `string` | `null` | _Add description_ | No |
| `rowHeaders` | `boolean` | `false` | _Add description_ | No |
| `backgroundColor` | `string` | `null` | Token base name (e.g., "brand"). Derives header/body backgrounds automatically. | No |
| `color` | `string` | `'color-base'` | Text color token (e.g., "color-base"). | No |
| `borderColor` | `string` | `'color-base'` | Border color token base (e.g., "color-base"). | No |
| `borderRadius` | `string` | `'0'` | Border radius for outer table box. | No |
| `padding` | `string` | `'var(--space-s)'` | Cell padding for th/td (applies block and inline). | No |
| `variant` | `string` | `'primary'` | _Add description_ | No |
## Accessibility
- Always supply a descriptive caption or surrounding heading; GOV.UK recommends captions for clarity.
- Use `rowHeaders` or manually set `scope`/`headers` attributes when the first column labels rows.
- Ensure numeric data is right-aligned if it aids scanning; apply via slot markup.
- For responsive tables, provide alternative views (stacked cards) when horizontal scrolling hinders comprehension.
- Avoid using tables for layout: screen readers expect tabular semantics.

## Content guidance
- Keep column labels short and descriptive (“Status”, “Updated”).
- Provide units or context in headers rather than repeating them in every cell.
- When using the data renderer, ensure values are already human-readable (format numbers/currency before passing in).
- Localise headers and numeric formats per locale.

## Implementation notes
- Component source: `src/components/ds/organisms/ccmTable.vue`
- Token calculations use CSS `color-mix`; confirm browser support or provide fallbacks.
- Wrap tables in `ccmSection` or similar to control overflow with `overflow-x: auto` if needed.
- Extend variant styling in `src/assets/css` via attribute selectors.

## Demo
- Data and slot-driven examples live in `src/components/docs/demos/ccm-table-demo.vue`, including row header mode and themed variants.

## Cross-links
- [ccmSection](/docs/components/ccm-section)
- [Content tables guidance](/docs/guidelines/data-display)
- [ccmFormField](/docs/components/ccm-form-field)

## Validation checklist
- [ ] `npm run docs:components:generate`
- [ ] `npm run docs:demos:generate`
- [ ] `npm run docs:scan-todos`
- [ ] `npx eslint src --ext .ts,.vue,.md`
- [ ] `npm run lint:css`
- [ ] `npm run typecheck`
- [ ] Manual QA: `/docs/components/ccm-table` and `/docs/demos/ccm-table-demo`

## Changelog
- 2025-11-03: Authored ccmTable usage guidance with accessibility best practices.
- 2025-11-03T01:19:36.977Z: Generated scaffold via `component-docs` v1.0.0.