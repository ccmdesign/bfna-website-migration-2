# Styling Guide

How to apply design tokens, utilities, and CUBE CSS layers when working in `${PATH_DS_COMPONENTS}`, `${PATH_DS_DEMOS}`, and Nuxt Content. Follow these rules to keep styling consistent and maintainable.

---

## 1. Reference Map

| Resource | Path Token | Purpose |
| --- | --- | --- |
| Token architecture & naming | `${PATH_DOCS_TOKENS}` | Explains token tiers, naming conventions, and usage philosophy. |
| Utility layouts | `${PATH_DOCS_UTILITIES}` | Documents `stack`, `cluster`, `grid`, and other layout helpers. |
| Raw token definitions | `${PATH_PUBLIC_TOKENS}` | Source CSS files containing semantic + primitive token values. |
| Component examples | `${PATH_DS_COMPONENTS}` | Inspect existing SFCs for CSS variable patterns. |
| Content docs | `${PATH_DOCS_GUIDELINES}` | Human guidelines that must stay in sync with styling rules. |

Keep these open when styling; they’re the canonical references.

---

## 2. CUBE CSS Layering

We adopt CUBE CSS with the following order:

1. **Reset** – browser normalization (`public/css/styles.css`).
2. **Base/Defaults** – foundational typography and spacing defaults.
3. **Tokens** – semantic and primitive values from `${PATH_PUBLIC_TOKENS}`.
4. **Themes** – context-specific overrides (light/dark if present).
5. **Components** – DS component styles defined in each SFC.
6. **Utilities** – layout helpers applied in templates and demos.
7. **Overrides** – narrow, intentional adjustments (avoid unless absolutely necessary).

When authoring component styles:
- Only touch layers 5 (component) and, if necessary, define private utilities riding on top of layer 6.
- Never hard-code primitive values in component styles; always reference tokens (see next section).

---

## 3. Token Usage Guidelines

### Hierarchy

1. **Semantic tokens first** (`--color-primary`, `--space-s`).
2. **Component-scoped tokens** when semantics aren’t expressive enough (e.g., `--_ccm-button-background`). These are temporary wrappers around semantics.
3. **Primitive tokens** (`--color-blue-500`) only if no semantic value represents the need. Document the decision in the component’s changelog.

### Declaring Component Variables

Pattern (as used in `ccmButton.vue`):

```ts
const cssVars = computed(() => ({
  '--_ccm-button-padding-inline': `var(--space-${props.size === 's' ? '2xs' : 's'})`,
  ...(props.backgroundColor && {
    '--_ccm-button-background-color': `var(--${props.backgroundColor})`
  })
}))
```

```css
.ccm-button {
  padding-inline: var(--_ccm-button-padding-inline);
  background: var(--_ccm-button-background-color, var(--color-primary));
}
```

Rules:
- Prefix component-scoped variables with `--_ccm-<component>-`.
- Provide sensible fallbacks in CSS (`var(--token, fallback)`).
- Only set overrides in the computed object when necessary; avoid dumping the full token set each render.

### Adding New Tokens

1. Propose a semantic name in `${PATH_DOCS_TOKENS}`.
2. Update `${PATH_PUBLIC_TOKENS}` with the value and add documentation.
3. Reference the semantic token in components/demos; never the primitive value directly.
4. Run `npm run validate:tokens`, `npx eslint src --ext .ts,.vue`, and regenerate docs.

---

## 4. Utilities Before Custom CSS

Utilities live in the layout vocabulary documented at `${PATH_DOCS_UTILITIES}`. Use them to solve spacing/layout problems before writing custom selectors.

Example: prefer

```html
<div class="stack" data-space="m">
  ...
</div>
```

over crafting new `.component__stack` CSS.

If a new layout primitive is required:
1. Draft the utility in `public/css` following existing patterns.
2. Document its API in `${PATH_DOCS_UTILITIES}`.
3. Validate with `npx eslint src --ext .ts,.vue` (plus `npm run lint:css`) and cross-browser checks.

---

## 5. Runtime Overrides & Inline Styles

Inline style bindings should only inject component-scoped variables:

```vue
<component :style="cssVars">
```

Avoid writing literal CSS values inline. If a consumer needs runtime overrides (e.g., theming), expose a prop that pipes into a scoped variable, then document the semantics in the component overview.

---

## 6. Common Tasks

### A. Add a New Semantic Token
1. Update `${PATH_PUBLIC_TOKENS}` with the value.
2. Document it in `${PATH_DOCS_TOKENS}` (purpose, usage, examples).
3. Replace primitive references in components/demos with the new semantic token.
4. Regenerate component docs and rerun validation scripts.

### B. Extend Component Variants
1. Confirm design approval and list tokens required.
2. Add variant-specific CSS variables (e.g., `--_ccm-card-variant-outline-border`).
3. Update the SFC props and computed `cssVars` to map variant selections to tokens.
4. Expand demos to cover the variant and update docs (regenerate `${PATH_COMPONENT_DOCS_OUTPUT}`).

### C. Introduce a Utility Instead of Custom CSS
1. Prototype with existing utilities. If impossible, design a new utility using `data-*` attributes consistent with current ones.
2. Define it in the utilities stylesheet, document it, and ensure it doesn’t break existing components.

### D. Audit for Layer Violations
1. Inspect the component’s `<style scoped>` block. Replace magic numbers with token references.
2. Ensure there are no `!important` declarations; if necessary, restructure markup instead.
3. Verify utilities aren’t redefined inside component scope and rerun linting commands when adjustments land.

---

## 7. Validation & QA

Before shipping styling changes:
- Run `npx eslint src --ext .ts,.vue` (catch script/style lint issues) and `npm run lint:css` for stylelint coverage.
- Execute `npm run typecheck` to ensure computed style bindings align with prop types.
- Run `npm run validate:tokens` to guarantee token integrity.
- Use `npx vitest run src/tests/components` if the component has visual snapshot/unit tests tied to styling.
- Manually check the demo and overview tabs:
  - Confirm layout/spacing updates render as expected.
  - Test accessibility scenarios (focus outlines, contrast, prefers-reduced-motion if relevant).

Log deviations in `_process/docs-pipeline-evaluation.md` if you can’t resolve them immediately.

---

## 8. Incident & Debt Tracking

- Styling regressions discovered post-merge should be documented in `_process/spec-drafts/` (include reproduction steps and affected tokens).
- Update `${PATH_DOCS_GUIDELINES}` (e.g., `component-development-guide.md`) when policies change so humans stay aligned.
- Use `${PATH_AI_ROOT}/maintenance.md` to schedule token cleanup, variant consolidation, or utility refactors.

---

Consistent styling keeps the DS cohesive. Rely on tokens, respect CUBE layers, and coordinate updates across components, demos, and docs so both humans and LLMs inherit the same expectations.