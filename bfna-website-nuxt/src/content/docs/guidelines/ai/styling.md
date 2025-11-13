---
title: AI Styling Guide
description: Styling rules for AI agents modifying CCM components, demos, or docs.
status: draft
audience: ai-automation
scope: styling
legacySource:
  - _process/docs-deprecated/ai-guidelines/styling.md
---

## Reference Map
| Topic | Path |
| --- | --- |
| Token definitions | `src/public/css/tokens/` |
| Utilities & layout helpers | `src/public/css/utils/` |
| CUBE CSS overview | `src/content/docs/guidelines/cube-css.md` |
| Token governance | `src/content/docs/guidelines/tokens-governance.md` |
| Component code examples | `src/components/ds/` |
| Styling guidance for humans | `src/content/docs/guidelines/styling-cube-css.md` |

Keep these resources open before altering styles.

## CUBE CSS Layers
Order declared in `src/public/css/styles.css`: `reset → defaults → tokens → themes → composition → components → utils → overrides`.

Agent rules:
- Modify only component layers (`<style scoped>`) or utilities when explicitly instructed.  
- Never redefine tokens in component scopes; use semantic references instead.  
- Keep overrides isolated and justified—prefer adjusting tokens or utilities over ad-hoc patches.

## Tokens First
1. **Semantic tokens (`--color-surface`, `--space-m`)** – default choice for styling changes.  
2. **Component-scoped tokens (`--_ccm-button-background`)** – define via computed `cssVars` when semantics need context-specific overrides.  
3. **Primitive tokens (`--color-blue-500`)** – use only after governance approval; document rationale and plan to replace with semantics.

### CSS variable pattern
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
  background: var(--_ccm-button-background-color, var(--color-action-background-default));
}
```

## Utilities Before Custom CSS
- Use Every Layout utilities (`stack`, `cluster`, `grid`, `switcher`, etc.) before writing bespoke layout rules.  
- When a new utility is required, draft it in `src/public/css/utils/`, document it in `src/content/docs/guidelines/utilities.md`, and run validation commands.

## Runtime Overrides
- Bind inline styles exclusively to component-scoped variables: `<component :style="cssVars">`.  
- Expose overrides via props that map to semantic tokens instead of accepting raw values.

## Common Tasks
- **Add a semantic token** – Update token CSS, documentation, and demos; follow workflow in `tokens-governance.md`.  
- **Extend component variants** – Add prop cases, map them to tokens, update CSS variables, demos, and DocsTabs examples.  
- **Audit styling debt** – Search for magic numbers (`rg '#[0-9a-f]{3,6}' src/components/ds`) and replace with tokens.  
- **Theme adjustments** – Update `src/public/css/themes/` and document behavior in component docs and demos.

## Validation Commands
```
npx eslint src --ext .ts,.vue
npm run lint:css
npm run typecheck
npm run validate:tokens
npx vitest run src/tests/components/ds --run
npm run docs:components:generate    # when component docs change
```
Manual checks:
- Demos and docs routes render without styling regressions or console warnings.  
- Focus states, contrast ratios, and responsive layouts remain accessible.  
- Tokens documentation (`tokens.md`) reflects new or updated values.

## Incident Handling
- Styling regression or failed lint → block release, revert, or update CSS with validated tokens.  
- Contrast issue → provide WCAG AA/AAA measurements, coordinate with design, and update docs.  
- Token drift → regenerate `scripts/output/tokens.json` and sync `tokens.md` + AI guides.

## References
- `src/content/docs/guidelines/styling-cube-css.md`
- `src/content/docs/guidelines/tokens.md`
- `src/content/docs/guidelines/tokens-governance.md`
- `src/content/docs/guidelines/ai/components.md`
- `src/content/docs/guidelines/ai/validation.md`
