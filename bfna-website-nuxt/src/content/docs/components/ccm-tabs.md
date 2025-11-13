---
title: ccmTabs
description: "Tabs component following all 10 Component Standards. A flexible tabs component that supports three configuration modes: JSON tabs prop, custom navigation/content slots, or auto-generated fallback navigation from content sections. Provides full keyboard navigation (Arrow keys, Home, End, Enter/Space) and comprehensive ARIA attributes for accessibility. Supports disabled tabs, external link detection, and programmatic tab selection. Style-agnostic design relies on CSS variables for visual customization."
status: draft
promptId: component-docs
promptVersion: 1.1.0
promptRunId: component-docs-1762805856814
lastPromptRun: "2025-11-10T20:17:36.883Z"
componentVersion: 0.0.0
demoComponent: src/components/docs/demos/ccm-tabs-demo.vue
legacySource: ../../../../_process/docs-deprecated/components/ccm-tabs.md
dataHash: 458c6d2be22fa81ec1eb72dc72e4c117e8c71fff9654c3f36055911bc19a7d1d
componentId: ccmTabs
---

## TL;DR
- Fully accessible tab system supporting JSON configs, slots, or auto-generated nav.
- Implements WAI-ARIA keyboard patterns (Arrow keys, Home/End, Enter/Space).
- Keeps styling token-driven so teams can align with GOV.UK, USWDS, or Shoelace tabs.
- Emits change events and handles disabled tabs for interactive dashboards.

## Overview
ccmTabs wraps content into an accessible tab interface that works with multiple authoring strategies. Use it with JSON data for quick prototypes, with navigation/content slots for handcrafted layouts, or let it generate navigation labels from content sections automatically.

## When to use
- Switch between related content panels without leaving the page.
- Present documentation detail (usage/code/guidance) inside DocsTabs.
- Build compact dashboards or settings pages where categories fit horizontally.
- Replace legacy tab implementations lacking ARIA-compliant keyboard support.

## When not to use
- Long-form content better suited to accordions or anchored sections.
- Processes requiring sequential steps; prefer wizards or page navigation.
- When more than a dozen tabs are required—consider alternative IA or nested navigation.
- If content must be simultaneously visible; use stacked sections instead.

## Anatomy
- **Wrapper (`div.ccm-tabs`)** – Hosts tablist and content region.
- **Tablist (`role="tablist"`)** – Contains `<ul>` navigation built from `tabs`, `#navigation`, or fallback sections.
- **Tab items (`role="tab"`)** – `ccmButton` elements managing focus, disabled states, and selection.
- **Tabpanels (`role="tabpanel"`)** – Sections rendered from JSON content or `#content` slot.
- **CSS hooks** – Provide tokens for spacing/colour via global styles; component itself remains style-agnostic.

## Variants
- **JSON mode** – Pass an array of `{ label, content, disabled? }` objects to render nav and panels automatically.
- **Slot mode** – Provide custom `<li>` navigation and `<section>` content via `#navigation`/`#content` slots.
- **Auto-generated** – Drop `<section>` elements in `#content`; labels derive from `data-label`, `id`, or fallback numbering.
- Style variations managed via CSS (e.g., underline, pills) using `[role="tab"]` states.

## States
- **Active tab** – `aria-selected="true"`, `tabindex="0"`, and matching panel visible.
- **Inactive tab** – `tabindex="-1"`, hidden panel.
- **Disabled tab** – `aria-disabled="true"`; click events ignored in JSON mode.
- **Focus** – Arrow keys cycle focus; Home/End jump to first/last tab; Enter/Space activate.
- **External link detection** – Navigation items containing absolute URLs bypass tab behaviour.

## API
| Name | Type | Default | Description | Required |
|------|------|---------|-------------|----------|
| `defaultTab` | `number` | `0` | Index of the initially active tab (0-based). Defaults to 0 (first tab). | No |
| `ariaLabel` | `string` | `'Tabs'` | ARIA label for the tablist element. Provides accessible name for screen readers. Defaults to 'Tabs'. | No |
| `tabs` | `TabData[]` | `null` | Array of tab objects for JSON-based configuration. Each tab object: { id?: string, label: string, content: string, name?: string, disabled?: boolean }.
When provided, automatically generates navigation and content panels. Takes priority over slots.
If null, component uses navigation/content slots or auto-generates navigation from content sections. | No |
## Accessibility
- Follows WAI-ARIA Authoring Practices for tabs (keyboard shortcuts, focus management, ARIA attributes).
- Panels toggle `hidden` and manage `tabindex` to keep focus within active content.
- Provide meaningful labels (via data-label or id) when using auto-generated navigation.
- Disabled tabs expose `aria-disabled` and skip selection; ensure alternative access to disabled content if required.
- Screen readers announce tab position automatically (“Tab 2 of 4”); maintain tidy DOM order to match UI order.

## Content guidance
- Keep tab labels short (≤16 characters) to avoid wrapping; use sentence case per GOV.UK style.
- Align tab order with user priorities—primary content first, supplemental info later.
- If content is dense (e.g., tables), ensure panel heights remain manageable or include subheadings.
- Avoid nesting interactive tabsets within each panel unless clearly signposted; consider step-by-step pages instead.
- Translate labels and panel content for each locale; tabs handle text direction automatically.

## Implementation notes
- Component source: `src/components/ds/molecules/ccmTabs.vue`
- Uses `ccmButton` for nav items; customise styling by targeting `.ccm-tabs__navigation ccm-button`.
- For analytics, listen to the `change` event or observe mutations on the active index.
- Auto-generation uses DOM queries; ensure sections exist before mounting (avoid `v-if` removing panels unexpectedly).
- Add tests when extending keyboard behaviour or introducing new variants.

## Demo
- `src/components/docs/demos/ccm-tabs-demo.vue` covers JSON mode, custom slot navigation, disabled tabs, and keyboard interaction.

## Cross-links
- [ccmButton](/docs/components/ccm-button)
- [ccmSection](/docs/components/ccm-section)
- [Docs layout guidance](/docs/guidelines/component-standards)

## Validation checklist
- [ ] `npm run docs:components:generate`
- [ ] `npm run docs:demos:generate`
- [ ] `npm run docs:scan-todos`
- [ ] `npx eslint src --ext .ts,.vue,.md`
- [ ] `npm run lint:css`
- [ ] `npm run typecheck`
- [ ] Manual QA: `/docs/components/ccm-tabs` and `/docs/demos/ccm-tabs-demo`

## Changelog
- 2025-11-03: Authored tab component guidance including keyboard behaviour and configuration modes.
- 2025-11-03T01:19:36.960Z: Generated scaffold via `component-docs` v1.0.0.