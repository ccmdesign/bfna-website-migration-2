# CCM Components Command Guide

This is the authoritative workflow for creating, updating, and deprecating components in `${PATH_DS_COMPONENTS}`. Follow it exactly to keep source, demos, and documentation in sync. Whenever instructions here disagree with legacy docs, **trust this guide and the source files**.

---

## 1. Source of Truth

- **Component code** lives exclusively under `${PATH_DS_COMPONENTS}`. As of 2025‑11‑02 the inventory is:
  - Molecules: `ccmBreadcrumb`, `ccmButton`, `ccmChip`, `ccmFormField`, `ccmFormGroup`, `ccmTabs`, `ccmTopbar`
  - Organisms: `ccmByLine`, `ccmCard`, `ccmFooter`, `ccmHero`, `ccmSection`, `ccmTable`
  - There is currently **no `atoms/` folder**; add it only when a real atomic component ships.
- Components are auto-registered via `nuxt.config.ts` with the `ccm` prefix. File names must therefore be PascalCase starting with `ccm` and must export a `<script setup lang="ts">` SFC.
- Use `getDesignSystemComponentEntries()` from `${PATH_UTILS_DS_REGISTRY}` when code needs to enumerate the DS. Never hand-maintain component lists.

```
${PATH_DS_COMPONENTS}/
├── molecules/   # medium-scope assemblies (forms, navigation, buttons)
└── organisms/   # larger compositions (cards, sections, hero)
```

Add new directories (for example, `atoms/`) only when a component actually ships for that tier.

---

## 2. Golden Rules

1. **Composition First** – Before writing a new component, confirm reuse is impossible. Check existing SFCs, demos, and `${PATH_DOCS_GUIDELINES}/general-implementation-guidelines.md`.
2. **Standards Compliance** – Every component must satisfy every rule in `${PATH_DOCS_COMPONENT_STANDARDS}`. Reference the doc, but verify against the code (for example, there is no `customColor` prop requirement in the current sources).
3. **Tokens over Custom CSS** – All styling flows through semantic tokens (`${PATH_PUBLIC_TOKENS}`) and component-scoped `--_ccm-*` variables.
4. **Slots Communicate API** – Expose intent with named/default slots. Document them via JSDoc so `${PATH_COMPONENT_DOCS_OUTPUT}` captures the details, and ensure demos exercise each slot.
5. **Accessibility is Non-Negotiable** – Provide ARIA defaults, keyboard affordances, and rely on real content (e.g., `ccmBreadcrumb` sets `aria-current`, `ccmButton` computes accessible labels).

### Compose vs Create

- **Compose** when you can satisfy the request by wiring existing DS components, adding utilities, or adjusting content-layer wrappers.
- **Create** a new DS component when the pattern is reusable across products, no existing component covers it, and design has signed off on the API.
- **Decline** DS changes for one-off marketing layouts; build those in `${PATH_CONTENT_COMPONENTS}` instead.

---

## 3. Standard Workflow

| Phase | Actions | Files to Touch |
| --- | --- | --- |
| **Discovery** | Confirm whether existing DS pieces can be composed. Capture rationale in `_process/spec-drafts/` if the answer is “new component”. | `_process/…`, existing SFCs |
| **Scaffolding** | Decide destination (`molecules/` vs `organisms/`). List required demo + docs tasks in the spec or maintenance tracker so reviewers know which assets to refresh. | `${PATH_DS_COMPONENTS}`, `${PATH_DS_DEMOS}`, `${PATH_COMPONENT_DOCS_OUTPUT}` |
| **Implementation** | Author the SFC: use `defineOptions({ inheritAttrs: import.meta.env.PROD ? false : true })`, declare props with `defineProps`, compute CSS vars, expose events with `defineEmits` when needed. Keep logic in `<script setup lang="ts">`. | Component `.vue` file |
| **Styling** | Add scoped styles using component variables. Example: `ccmButton` defines `--_ccm-button-*` bindings. Avoid global selectors; use `:deep()` sparingly for slot content. | Component `.vue` file |
| **Demos & Docs** | Update or create the demo page in `${PATH_DS_DEMOS}` with interactive controls. Run `node ${PATH_SCRIPTS_DOCS}/generate-component-docs.ts` (or `npm run docs:components:generate`) to refresh `${PATH_COMPONENT_DOCS_OUTPUT}` and `_docs/*.html`. Log changelog/version notes in the spec or maintenance tracker until generator metadata ships. | Demo `.vue`, `_docs/*.html`, `${PATH_COMPONENT_DOCS_OUTPUT}` |
| **Validation** | Follow `${PATH_AI_ROOT}/validation.md`. Minimum: `npx eslint src --ext .ts,.vue`, `npm run lint:css`, `npm run typecheck`, `npx vitest run src/tests/components`, `npm run docs:components:generate`. | n/a |

### Implementation Details

- **Routing & Tags**: Components can render dynamic tags (see `ccmButton`’s `componentTag` computed). Always guard SSR-only APIs and use Nuxt utilities when available.
- **Prop Defaults**: Provide defaults via inline `default` values, not `withDefaults`. Keep prop docs up to date; they feed the generator.
- **CSS Variables**: Build a `cssVars` computed returning an object whose keys are CSS custom properties. Only set overrides when necessary (e.g., `ccmButton` writes background color only if supplied).
- **Utilities**: Favor DS utilities (`stack`, `cluster`, etc.) in demos/compositions; do not import global utility CSS directly into components.
- **Composables**: Leverage existing helpers (`useSlugify` in `ccmCard`). Place shared logic in `${PATH_COMPOSABLES}` before reusing across components.
- **Interdependent Sets**: When introducing families (tabs, accordions, composite form controls), ship every dependent component in the same change, demo them together, and ensure API cohesion before requesting review.

---

## 4. Demos, Docs, and Generator

1. Every component must have a demo at `${PATH_DS_DEMOS}/ccm-<name>-demo.vue` that exercises variants, slots, a11y switches, and includes `documentationFragment` output from `${PATH_COMPONENT_DOCS_OUTPUT}`.
2. After code changes, run `node ${PATH_SCRIPTS_DOCS}/generate-component-docs.ts`. This script parses JSDoc tags (`@component`, `@example`) via `${PATH_UTILS_PARSE_COMPONENT_DOCS}` and rewrites JSON + HTML fragments. If the script fails, fix the component’s docblock first.
3. Component docs are rendered by `${PATH_DOCS_COMPONENT_OVERVIEWS}`. Keep the generator JSON (`${PATH_COMPONENT_DOCS_OUTPUT}`) in sync so the `DocsPropsTable` usage tab and `DocsCodeBlock` snippets stay accurate.
4. Track changelog notes in the component spec or maintenance log until version metadata ships in the generator payload.

> **Future state** – `<DocsTabs>` + Markdown overviews are still planned. When that infrastructure lands, migrate the guidance above to cover the new embed component and frontmatter schema.

**Demo content checklist**
- Basic render covering all states, variants, sizes, and token-powered options.
- Prop table or usage copy generated from `${PATH_COMPONENT_DOCS_OUTPUT}`.
- Slot coverage (default + named slots) using realistic content.
- Accessibility toggles (ARIA labels, keyboard interactions) demonstrated.
- Integration scenarios showing the component in context with other DS pieces.
- Code references highlighting tokens and utilities in play.

**Content-layer reminder**
- Use `${PATH_CONTENT_COMPONENTS}` for contextual compositions that shouldn’t be part of the DS. They must compose DS components rather than reimplement styling.

---

## 5. Versioning & Migration

- Record semantic drift in `${PATH_COMPONENT_MIGRATION_CHECKLIST}` when standards change.
- When updating APIs (new prop, removed slot), record the change and intended version bump in the maintenance report/spec. Mirror the version in the component JSDoc once the tooling supports it.
- If removing or renaming a component, update `designSystemRegistry` consumers, demos, and any content components referencing it. Leave a deprecation note in docs until the removal lands.

---

## 6. Validation Checklist

Run these commands before handoff (see `${PATH_AI_ROOT}/validation.md` for context):

```bash
npx eslint src --ext .ts,.vue
npm run lint:css
npm run typecheck
npx vitest run src/tests/components
npm run docs:components:generate
npm run validate:tokens
```

Manual QA:
- Load `/docs/demos/ccm-<name>-demo` and confirm interactions, keyboard support, and JSON-LD (if applicable).
- Verify the `/docs/<component-slug>` route renders the generated JSON (props, examples) and embeds the demo without console warnings.
- Run the component validator (planned in `${PATH_AI_ROOT}/validation.md`) whenever it becomes available to ensure standards compliance reports stay green.

---

## 7. Escalation & Support

- Standards conflict or ambiguity → Ping maintainers listed in `${PATH_DOCS_COMPONENT_STANDARDS}` and capture decisions in `${PATH_DOCS_GUIDELINES}/component-design-decisions.md`.
- Doc generation failures → Inspect `parseComponentDocs.ts` expectations and ensure docblocks follow current patterns (no `@example` if they are being deprecated, etc.).
- Missing utilities/tokens → Coordinate with token owners (`${PATH_DOCS_TOKENS}`) before inventing new primitives.

Document unresolved issues in `_process/spec-drafts/` so future audits know why exceptions exist.

