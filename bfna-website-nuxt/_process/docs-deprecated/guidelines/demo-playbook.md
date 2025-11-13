---
title: Demo Playbook
description: Authoring and maintaining `/docs/demos/*` pages that feed DocsTabs and showcase CCM components.
category: Guidelines
type: guide
status: canonical
published: true
priority: High
version: 2025.11
last_updated: 2025-11-02
author: Design System Team
tags:
  - demos
  - documentation
  - showcase
hero:
  brow: Guidelines
  title: Demo Playbook
  tagline: Build live examples that keep components, docs, and agents aligned
related_docs:
  - component-standards.md
  - component-development.md
  - documentation-governance.md
  - styling-cube-css.md
---

# Demo Playbook

Follow this playbook when creating or updating pages under `${PATH_DS_DEMOS}`. These demos feed DocsTabs, validate component behavior, and serve as the canonical reference for consumers.

---

## 1. Why Demos Matter

- **Single truth for behavior** – Demos show every prop, slot, and state combination. Docs, agents, and reviewers rely on them to confirm behavior.
- **DocsTabs integration** – `${PATH_DOCS_COMPONENT_OVERVIEWS}` embeds these demos directly; any mismatch breaks the docs experience.
- **Regression safety net** – QA teams and automated visual diff tooling target demo routes first.
- **Education & adoption** – Product engineers copy patterns from demos. If it’s not demonstrated, it’s effectively unsupported.

---

## 2. Page Template & Layout

- Every demo uses the `demo` layout (`<NuxtLayout name="demo" ...>`).
- Provide `component-name`, `description`, and `docs-path` props so the hero renders correctly.
- Structure content with `<ccmSection>` wrappers and CUBE CSS utilities (`stack`, `cluster`, `grid`). Avoid custom layout classes.

Example skeleton:

```vue
<template>
  <NuxtLayout
    name="demo"
    component-name="ccmButton"
    description="Primary action component"
    docs-path="/docs/components/ccmButton"
  >
    <ccmSection>
      <div class="stack" data-space="l">
        <h2>Basic Examples</h2>
        <div class="cluster" data-space="m">
          <ccmButton>Save</ccmButton>
          <ccmButton variant="secondary">Cancel</ccmButton>
        </div>
      </div>
    </ccmSection>
  </NuxtLayout>
</template>
```

---

## 3. Content Requirements

Each demo page must include the following sections (order can adapt slightly to fit the component):

1. **Basic examples** – Default usage with minimal props.
2. **Sizes** – Show each `size` option (if applicable) with consistent content.
3. **Variants** – Illustrate every variant grouped with headings and descriptions.
4. **Interactive scenarios** – Reactive examples demonstrating state changes, events, and live feedback.
5. **States** – Disabled, loading, error, or pressed states with clear visuals.
6. **Real-world use cases** – Representative compositions that mirror product usage (stacked sections, cards, etc.).
7. **Accessibility cues** – Keyboard walkthroughs, focus visuals, and screen-reader messaging when relevant.

Optional but recommended:

- **Comparison grid** for size × variant matrices.
- **Playground controls** (minimal toggles) when they aid comprehension without becoming a full-blown builder.

Ensure headings (`<h2>`, `<h3>`) describe why the example exists and what to observe.

---

## 4. State & Event Patterns

- Use `ref`, `reactive`, and computed helpers to model live state. Avoid local storage or server calls.
- Display current state inline (e.g., “Active filters: X”) so reviewers can see feedback without opening DevTools.
- Emit and log events through console or textual summaries to illustrate integration points.
- Keep handler functions pure; complex logic belongs in composables tested separately.

Pattern snippet:

```ts
const filters = ref([
  { id: 'design', label: 'Design', active: false },
  { id: 'engineering', label: 'Engineering', active: true }
])

const toggleFilter = (id: string) => {
  const filter = filters.value.find(item => item.id === id)
  if (filter) filter.active = !filter.active
}

const activeFilters = computed(() =>
  filters.value.filter(item => item.active).map(item => item.label).join(', ') || 'None'
)
```

---

## 5. Accessibility Demonstrations

- Document keyboard instructions in prose (e.g., “Use ArrowLeft/ArrowRight to switch tabs”).
- Surface ARIA attributes or status messages visually (`<p class="description">Focus moves to …</p>`).
- Include a “Screen reader output” note when behavior differs from visual cues.
- Show focus styles intentionally; do not remove default outlines.

If the component ships with assistive text or announcements, echo them in the demo by logging to the page.

---

## 6. QA & Validation Checklist

Automated commands to run before committing demo updates:

```bash
npx eslint src --ext .ts,.vue
npm run lint:css
npx vitest run src/tests/components/ds --run
node ${PATH_SCRIPTS_DOCS}/generate-component-docs.ts
npm run build
```

Manual checks:

- `[ ]` Page loads without console warnings (desktop + mobile widths).
- `[ ]` Interactions update UI state and summary text.
- `[ ]` Keyboard navigation covers all focusable elements.
- `[ ]` Docs link in hero resolves to the correct overview page.
- `[ ]` DocsTabs embed renders the demo correctly after generator run.
- `[ ]` Screenshots or notes recorded for reviewers when visuals change.

Document skipped items with justification and a ticket link.

---

## 7. Maintenance & Versioning

- **Sync with component releases** – Update demos whenever props, variants, or visual treatments change. The PR should include both component and demo updates.
- **Version docs** – Bump `last_updated` in the component overview when demos change to keep history aligned.
- **Regression triage** – Treat demo regressions as component bugs; log them promptly and link to this playbook.
- **Retirement** – If a demo is deprecated, add a banner directing readers to the replacement and archive the old page in `_archive/docs-archive/docs-root/guidelines`.

---

## Appendices

### Canonical Demos

- `src/pages/docs/buttons.vue` – Reference for size/variant grids and interactive controls.
- `src/pages/docs/chips.vue` – Demonstrates state toggles, real-world compositions, and accessibility notes.
- `src/pages/docs/tabs.vue` – Shows multi-component interactions (parent + child components).

### Troubleshooting Guide

| Issue | Likely Cause | Fix |
| --- | --- | --- |
| Hydration mismatch warning | Client-only logic executed during SSR | Guard with `if (import.meta.client)` or extract to composable. |
| Demo not rendering in DocsTabs | Generator out of date or mismatched `component-name` | Re-run `generate-component-docs`, ensure layout props match component slug. |
| Layout spacing inconsistent | Missing `data-space` attributes or utilities | Apply `stack`, `cluster`, `grid` with configured data attributes. |
| Focus styles missing | Overridden by custom CSS | Remove override; rely on component defaults or tokenized outlines. |

### Future Enhancements Backlog

- Visual regression automation covering demo routes.
- Shared interactive controls (knobs) for compatible components.
- Scripted screenshot capture for release notes.

Maintain demos with the same rigor as components—the ecosystem depends on them.

