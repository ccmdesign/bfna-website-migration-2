---
title: Component Name
description: One-line summary of the component role.
status: draft
promptId: component-docs
promptVersion: 1.0.0
lastPromptRun: null
componentVersion: 0.0.0
demoComponent: src/components/docs/demos/ccm-component-demo.vue
---

## TL;DR
- Key usage highlight and primary value statement.

## Overview
- Expanded context, relationships to other components, design intent.

## Status
| Area | State |
| --- | --- |
| Implementation | draft/shipped |
| Docs | draft/completed |
| Demo | draft/planned/shipped |

## Usage Scenarios
### Do
- Positive scenario describing best practice outcomes.
### Don't
- Common misuse patterns to avoid.

## Anatomy
- Diagram reference description and structural callouts.

## API
| Name | Type | Default | Description | Required |
|------|------|---------|-------------|----------|
| `propName` | `string` | `''` | Explain how the prop affects rendering. | No |

## States
- Enumerate interaction states and visual behaviors.

## Variants
- Outline each variant with rationale, tokens, and responsive rules.

## Accessibility
- Keyboard support, ARIA attributes, focus order, and announcements.

## Content
- Localization guidance, tone notes, media handling expectations.

## Implementation
- Link to `src/components/ds/<component>.vue`, shared utilities/composables, and `src/public/component-docs/<component>.json`.
- Capture component category, primary tag/name, and any registries that list the component.

## Demo
- Reference the demo component path (`src/components/docs/demos/<component>-demo.vue`) and DocsTabs route.
- Note demo status (planned/shipped) and validation expectations.

## Changelog
- Document prompt-driven updates with date, prompt version, and author.
- Reference historical versions (e.g., 2025.11.0) when migrating legacy docs.
