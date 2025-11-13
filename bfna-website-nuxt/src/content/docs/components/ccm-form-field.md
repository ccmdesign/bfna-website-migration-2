---
title: ccmFormField
description: "Slot-first form field wrapper with labels, validation messages, and a11y wiring. Wraps any input/textarea/select via the default slot and provides automatic label association, aria-describedby wiring for help/validation messages, and consistent styles across sizes and validation states. Gracefully degrades by rendering a default text input when no slot content is provided."
status: draft
promptId: component-docs
promptVersion: 1.1.0
promptRunId: component-docs-1762805856814
lastPromptRun: "2025-11-10T20:17:36.865Z"
componentVersion: 0.0.0
demoComponent: src/components/docs/demos/ccm-form-field-demo.vue
legacySource: ../../../../_process/docs-deprecated/components/ccm-form-field.md
dataHash: 0e933b1ba48ce4c395e783dca49f60afaf51719822cc6fbe764f33143300e500
componentId: ccmFormField
---

## TL;DR
- Slot-first field wrapper that handles label, helper, and validation wiring automatically.
- Generates stable IDs for inputs and ties them to accessible descriptions.
- Supports multiple label positions and validation states inspired by GOV.UK/USWDS forms.
- Ships scoped CSS tokens for consistent spacing and iconography across the form system.

## Overview
ccmFormField encapsulates the boilerplate around individual form controls. It centralises label placement, validation messaging, scoped tokens, and fallback inputs so any field inside the design system adheres to accessibility and visual guidelines.

## When to use
- Wrap native inputs, textareas, selects, or custom controls that need consistent labelling.
- Provide inline helper text or validation messages without repeating aria wiring.
- Build responsive forms where label placement must flip between stacked and inline modes.
- Prototype quickly by relying on the built-in text input fallback before slotting a bespoke control.

## When not to use
- Multi-field groups such as radio/checkbox clusters—use `ccmFormGroup`.
- Button rows or action bars; keep those outside of form field wrappers.
- Cases where a control already supplies its own label and messages (avoid double announcements).
- Layout-only wrappers; ccmFormField is opinionated about semantics and should not be used purely for spacing.

## Anatomy
- **Root container** – Flex column with token-driven padding/gap.
- **Label** – `<label>` element optionally hidden or inline; displays required indicator.
- **Input wrapper** – Hosts default slot and optional validation icon overlay.
- **Helper text** – Default-state description tied via `aria-describedby`.
- **Message area** – Success, error, or warning message with role (`status`/`alert`).
- **Scoped variables** – `--_ccm-form-field-*` tokens govern spacing, colours, and focus styles.

## Variants
- **Label positions** – `top` (default stacked), `inline` (label beside input), `hidden` (visually hidden but accessible).
- **Validation states** – `default`, `success`, `error`, `warning` adjust colours and icons per USWDS form guidance.
- **Size scale** – `s`, `m`, `l`, `xl` adapt typography and padding for compact or spacious layouts.
- **Icon slot** – Replace default ✓/✕/⚠ glyphs with custom SVGs to align with brand systems.

## States
- **Default** – Shows helper text, neutral border.
- **Focus** – Applies design token focus ring with accessible contrast.
- **Error** – Adds `aria-invalid`, red accents, and `role="alert"` message.
- **Success** – Uses green accent plus `role="status"` announcement.
- **Warning** – Amber accent and status role for cautionary feedback.
- **Disabled (delegate)** – Consumers should visually indicate disabled controls; wrapper keeps spacing consistent.

## API
| Name | Type | Default | Description | Required |
|------|------|---------|-------------|----------|
| `id` | `string` | `null` | Custom element id for the input. If omitted, a stable id is auto-generated and associated with the label. | No |
| `labelPosition` | `string` | `'top'` | Label placement. Valid values: top (default), inline, hidden | No |
| `label` | `string` | `''` | Visible label text. When labelPosition="hidden", keep for a11y but hide visually; also consider aria-label on the input. | No |
| `helpText` | `string` | `''` | Helper text shown only in the default validation state. Included in aria-describedby. | No |
| `errorMessage` | `string` | `''` | Error message shown when validationState="error". Included in aria-describedby and sets aria-invalid. | No |
| `successMessage` | `string` | `''` | Success message shown when validationState="success". Included in aria-describedby. | No |
| `warningMessage` | `string` | `''` | Warning message shown when validationState="warning". Included in aria-describedby. | No |
| `size` | `string` | `'m'` | Control spacing and typography scale. Valid values: s, m, l, xl | No |
| `validationState` | `string` | `'default'` | Visual and a11y state. Valid values: default, success, error, warning | No |
| `required` | `boolean` | `false` | Adds a visual asterisk in the label. Use native required on the input to enforce validation. | No |
| `showValidationIcon` | `boolean` | `true` | Toggle the inline validation icon for non-default states. | No |
## Accessibility
- Automatically associates label, helper, and validation messages via generated IDs.
- Emits `aria-invalid`, `role="alert"`, and `role="status"` to satisfy WCAG 3.3 guidelines.
- Hidden labels should be paired with additional context (placeholder alone is insufficient per GOV.UK advice).
- Custom controls placed in the slot must spread `inputProps` to preserve accessibility bindings.
- Required indicator uses `aria-label="required"`; ensure localised strings if not using English copy.

## Content guidance
- Label text should mirror the field prompt (“Email address”) and avoid punctuation.
- Helper text should be concise (≤90 characters) and describe format or intent.
- Error copy should state the issue and how to fix it (“Enter a government-issued email address”).
- Warning messages should clarify that submission is still possible but may need attention.
- Success messages are optional; use sparingly to avoid noisy forms.

## Implementation notes
- Component source: `src/components/ds/molecules/ccmFormField.vue`
- Scoped styles rely on semantic tokens; adjust tokens via `src/content/docs/guidelines/tokens.md` rather than editing CSS.
- Random id generation uses `Math.random`—consider injecting a deterministic generator in SSR contexts if required.
- Works alongside `ccmFormGroup` for grouped inputs and with DS validation composables.

## Demo
- Interactive examples live in `src/components/docs/demos/ccm-form-field-demo.vue`, covering label positions, validation states, icons, and size scale.

## Cross-links
- [ccmFormGroup](/docs/components/ccm-form-group)
- [ccmButton](/docs/components/ccm-button)
- [Form guidelines](/docs/guidelines/forms)

## Validation checklist
- [ ] `npm run docs:components:generate`
- [ ] `npm run docs:demos:generate`
- [ ] `npm run docs:scan-todos`
- [ ] `npx eslint src --ext .ts,.vue,.md`
- [ ] `npm run lint:css`
- [ ] `npm run typecheck`
- [ ] Manual QA: `/docs/components/ccm-form-field` and `/docs/demos/ccm-form-field-demo`

## Changelog
- 2025-11-03: Authored complete narrative for form field usage and accessibility.
- 2025-11-03T01:19:36.940Z: Generated scaffold via `component-docs` v1.0.0.