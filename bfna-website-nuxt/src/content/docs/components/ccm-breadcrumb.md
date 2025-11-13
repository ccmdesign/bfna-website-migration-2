---
title: ccmBreadcrumb
description: "Documentation scaffold for ccmBreadcrumb"
status: draft
promptId: component-docs
promptVersion: 1.1.0
promptRunId: component-docs-1762805856814
lastPromptRun: "2025-11-10T20:17:36.837Z"
componentVersion: 0.0.0
demoComponent: src/components/docs/demos/ccm-breadcrumb-demo.vue
legacySource: ../../../../_process/docs-deprecated/components/ccm-breadcrumb.md
dataHash: e08be0d317ea1e447ae7fcdbc7b08e0f97885c89c420a86106495242e4583c12
componentId: ccmBreadcrumb
---

## TL;DR
- Offers accessible wayfinding with an explicit `nav` landmark and clear aria labelling.
- Supports semantic JSON-LD so search engines understand the page hierarchy.
- Wrap variant and slot API match deep navigation scenarios without bespoke code.
- Plays nicely with GOV.UK, USWDS, and Shoelace guidance for consistent breadcrumb copy.

## Overview
ccmBreadcrumb presents the current page’s hierarchy as an inline trail of links. It is optimised for responsive Nuxt layouts and mirrors GOV.UK and USWDS guidance by keeping copy concise, separators readable, and structured data in sync with navigation.

## When to use
- Users need contextual awareness within multi-step flows or deep IA.
- You must expose a machine-readable hierarchy for analytics or SEO via JSON-LD.
- Pages reuse top-level layouts where primary navigation alone is insufficient.
- Service teams want a consistent breadcrumb pattern that aligns with GOV.UK and USWDS copy tone.

## When not to use
- The journey is linear with fewer than two hierarchical levels (use back links instead).
- Navigation is task-based rather than location-based (consider ccmTabs or task lists).
- Breadcrumb duplication would conflict with an existing global breadcrumb supplied by a host frame.
- There’s no stable IA—showing rapidly changing hierarchies can confuse screen-reader users.

## Anatomy
- **Wrapper (`nav`/`div`)** – Landmark element identified via `aria-label` and optional `is` prop.
- **List container** – `.cluster` layout manages spacing tokens (`--space-s`, `--space-2xs`).
- **Breadcrumb items** – Each link renders through ccmButton (link variant) to inherit focus styles that match Shoelace and shadcn expectations.
- **Separator** – Chevron icon, slash glyph, or slot-rendered custom content to echo GOV.UK’s “›” pattern.
- **JSON-LD script** – Optional structured data block managed through `includeJsonLd`.

## Variants
- **default** – Single-line layout ideal for up to five levels; matches Nuxt UI breadcrumb spacing.
- **wrap** – Allows line wraps for deep hierarchies while preserving semantic separators.
- **custom separator** – Slot-driven iconography when GOV.UK or Shoelace-inspired glyphs need localisation.

## States
- **Idle** – All links use semantic focus outlines per design tokens.
- **Current** – Final item exposes `aria-current="page"` and renders as plain text for WCAG 2.1 compliance.
- **Focus** – Follows GOV.UK focus style guidance with a visible outline and adequate contrast.
- **Disabled JSON-LD** – When `includeJsonLd` is `false`, the component omits structured data to avoid duplicates.

## API
| Name | Type | Default | Description | Required |
|------|------|---------|-------------|----------|
| `is` | `string` | `'nav'` | Root element tag rendered by `<component>`. Defaults to `nav` for landmark semantics; switch to `div`
when placing the breadcrumb inside an existing `nav` or header. | No |
| `items` | `BreadcrumbItem[]` | `() => []` | Ordered set of breadcrumb items. The final entry is surfaced as the current page (`aria-current`).
Provide `ariaLabel` when the visual label would be ambiguous or truncated. | No |
| `size` | `string` | `'s'` | Link size forwarded to `ccmButton` (link variant). `s` keeps breadcrumbs compact; `m` aligns with hero headers
and increases spacing tokens applied to the `.cluster` wrapper. | No |
| `variant` | `string` | `'default'` | Layout variant controlling line wrapping. Use `default` to keep all items on one line; use `wrap` to allow
multi-line breadcrumbs for deep IA while keeping tokens intact. | No |
| `separator` | `string` | `'chevron'` | Separator presentation. `chevron` uses an icon glyph, `slash` renders `/`, and `custom` defers entirely to the
`#separator` slot. Custom separators should follow iconography rules from the design system. | No |
| `iconName` | `string` | `'chevron_right'` | Icon glyph used when `separator` is `chevron`. Must map to a material/icon font name recognised by the `.icon` utility. | No |
| `itemPaddingInline` | `string` | `'2xs'` | Space token applied to inline padding on link items (`var(--space-{token})`). Reference semantic keys in
the tokens guideline to ensure consistency across navigation components. | No |
| `ariaLabel` | `string` | `'Breadcrumbs'` | Aria-label describing the breadcrumb navigation. Override when multiple breadcrumb regions exist on a page
(e.g., admin + marketing shells) to keep landmarks unique. | No |
| `includeJsonLd` | `boolean` | `true` | Toggles schema.org `BreadcrumbList` JSON-LD injection via `useHead`. Disable when another breadcrumb script
already exists to avoid duplicate structured data in the document head. | No |
| `baseUrl` | `string | null` | `null` | Absolute site origin used to convert relative `to`/`href` values into canonical URLs inside the JSON-LD payload.
Provide `null` to leave relative paths untouched (search engines may warn if they remain relative). | No |
## Accessibility
- Exposes a dedicated `nav` landmark with configurable `aria-label`, mirroring GOV.UK recommendations.
- Applies `aria-current="page"` to the terminal item; intermediate links remain keyboard focusable.
- Chevron separators are announced as `>` characters; provide custom slots for locales requiring alternate glyphs per USWDS guidance.
- Focus outlines meet WCAG 2.1 AA contrast via shared tokens (`--color-focus-ring`).
- JSON-LD output matches Google structured data expectations, reducing redundant announcements for screen readers.

## Content guidance
- Keep labels under 32 characters; GOV.UK advises sentence-case nouns without trailing punctuation.
- Use nouns that match page titles; avoid action verbs to prevent confusion with task lists.
- Localise separators and article words (“of”, “the”) in languages where breadcrumb grammar differs.
- Prefer “Home” for the first item to align with Shoelace and Nuxt UI examples unless a service brand requires otherwise.

## Implementation notes
- Component source: `src/components/ds/molecules/ccmBreadcrumb.vue`
- Relies on `ccmButton` for link visuals; ensure button tokens remain in sync when updating the design system.
- JSON-LD emitted through `useHead`; verify no duplicate breadcrumb scripts exist in parent layouts.
- Uses `.cluster` layout utility and spacing tokens from `src/content/docs/guidelines/tokens.md`.
- Unit coverage lives under `src/tests/components/ds/` (add scenarios when new variants ship).

## Demo
- Live example: `src/components/docs/demos/ccm-breadcrumb-demo.vue` demonstrates default and wrap variants with JSON-LD toggling.

## Cross-links
- [ccmTopbar](/docs/components/ccm-topbar)
- [ccmSection](/docs/components/ccm-section)
- [Navigation guidelines](/docs/guidelines/navigation)

## Validation checklist
- [ ] `npm run docs:components:generate`
- [ ] `npm run docs:demos:generate`
- [ ] `npm run docs:scan-todos`
- [ ] `npx eslint src --ext .ts,.vue,.md`
- [ ] `npm run lint:css`
- [ ] `npm run typecheck`
- [ ] Manual QA: `/docs/components/ccm-breadcrumb` + `/docs/demos/ccm-breadcrumb-demo`

## Changelog
- 2025-11-03: Hydrated narrative content to remove TODO placeholders and align with GOV.UK/USWDS patterns.
- 2025-11-03T01:19:36.909Z: Generated scaffold via `component-docs` v1.0.0.