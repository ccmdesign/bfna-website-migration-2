---
promptId: component-demo
version: 2.0.0
updatedAt: 2025-11-03
---

# Component Demo Prompt

You are drafting a single, handcrafted Vue SFC that serves as the canonical demo for a CCM design-system component. Automation that previously emitted placeholder demos has been retired—your output is the source of truth that DocsTabs and the `/docs/demos/<slug>-demo` route will render directly.

## Inputs Provided
- Component name and public API expectations (props, slots, emitted events).
- Current documentation or specs calling out variants, tokens, accessibility guarantees, and real-world compositions.
- Optional change summary highlighting new scenarios to highlight in the demo.

## Guiding Principles
1. **Declarative first** – Write explicit markup for each scenario. Avoid reactive state or generators unless absolutely necessary for the story being told.
2. **Design-system utilities** – Structure the page with `ccm-section`, `stack`, `cluster`, and `grid` helpers. Use semantic `data-space` tokens and inline comments when you intentionally diverge from defaults.
3. **Zero custom CSS** – Do not add `<style>` blocks or inline styles. Lean entirely on existing utilities and component props to control spacing, layout, and theming.
4. **Comprehensive coverage** – Showcase baseline usage, variants, sizes, states, and at least one real-world composition that mirrors production consumption. Provide concise captions or helper text when context is useful.
5. **Accessibility on display** – Include focusable examples, keyboard flows, aria attributes, and any live regions the component exposes. Never hide outlines; add instructions when a keyboard sequence matters.
6. **Copyable reference** – Someone should be able to paste any section into an app and get the expected behaviour without extra wiring.

## Tasks
1. Review the component implementation and docs to choose the scenarios that must be visualised.
2. Sketch the page sections (variants, states, compositions, accessibility, etc.) and assign layout helpers so content stays readable at desktop and tablet breakpoints.
3. Author the Vue SFC with static markup. Use `<script setup>` only when you need small data collections or inline utilities; keep logic minimal and local.
4. Exclude `<style>` blocks; rely on layout utilities and component props for presentation.
5. Annotate tricky spots with short HTML comments explaining intent (e.g., “Disabled to show aria-disabled copy”).
6. Confirm the markup imports only the design system component(s) required for the demo. If you must register extra helpers, do it explicitly inside the script block.
7. Validate keyboard/touch flows manually once the demo renders; adjust copy or layout to call out expected behaviour.

## Page Skeleton
```vue
<template>
  <section class="docs-component-demo">
    <ccm-section>
      <div class="stack" data-space="m">
        <h2>Variants</h2>
        <div class="cluster" data-space="s">
          <ccm-button>Primary</ccm-button>
          <ccm-button variant="secondary">Secondary</ccm-button>
        </div>
      </div>
    </ccm-section>

    <!-- Add more sections for sizes, states, compositions, etc. -->
  </section>
</template>

<script setup lang="ts">
// Import only when needed for helper data or additional DS components.
</script>

```

Treat the skeleton as a starting point—expand with multiple `<ccm-section>` blocks, grids, and explanatory text that mirror the `_process/demo-examples` style. Remember: avoid `<style>` blocks; composition classes should provide sufficient layout control.

## Required Content Blocks
- **Baseline usage** – Default configuration with minimal props.
- **Variants matrix** – Grouped examples showing how props change visuals (e.g., `variant`, `color`).
- **Size coverage** – Demonstrate each supported size token.
- **States & interactions** – Disabled, loading, pressed, validation errors, focus-visible, hover. Use concise captions where behaviour isn’t obvious.
- **Compositions** – Embed the component inside representative layouts (forms, toolbars, cards, etc.).
- **Accessibility callouts** – Copy that explains keyboard order, aria hooks, or screen-reader messaging.

Optional additions: responsive breakpoint notes, iconography variants, event logging snippets, or quick-start tips for integrators. Keep them utility-driven with no custom CSS.

## Deliverable
- One Vue SFC at `src/components/docs/demos/<component>-demo.vue`. No metadata JSON or secondary files are produced.

## QA & Validation
### Manual
- [ ] Load `/docs/demos/<component>-demo` and `/docs/components/<component>`; confirm the demo renders without console warnings.
- [ ] Exercise keyboard navigation, hover/focus states, and any interactive controls.
- [ ] Review at common breakpoints (≥320px, 768px, 1280px) to ensure layout utilities behave as intended.
- [ ] Confirm the demo contains no `<style>` block or inline CSS.

### Automated (recommended before shipping)
- `npx eslint src --ext .ts,.vue`
- `npm run lint:css`
- `npx vitest run src/tests/components/ds --run`

## Maintenance
- Update the demo whenever component props, visuals, or behavioural guarantees change; demo regressions are product bugs.
- Keep section headings and copy aligned with the component docs so DocsTabs feels cohesive.
- Note any follow-up tasks (screenshots, guideline updates) alongside the PR so reviewers know what to verify.
- If you discover the need for custom styling, escalate the requirement instead of adding CSS locally.
