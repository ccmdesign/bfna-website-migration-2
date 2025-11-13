# Nuxt Content Authoring Guide

Authoritative instructions for creating and maintaining documentation inside `${PATH_DOCS_COMPONENT_OVERVIEWS}` and `${PATH_DOCS_GUIDELINES}`. All examples assume the files live under `src/content`, not the legacy `content` root. When in doubt, rely on the source files in `src/content/**` and the path tokens defined in `${PATH_AI_ROOT}/ai-guidelines-readme.md`.

---

## 1. Scope & Document Types

| Location | Purpose | Notes |
| --- | --- | --- |
| `${PATH_DOCS_COMPONENT_OVERVIEWS}` | Dynamic component docs route consuming `${PATH_COMPONENT_DOCS_OUTPUT}` JSON and `${PATH_DS_DEMOS}` embeds. | Mirrors shipping components in `${PATH_DS_COMPONENTS}`; no per-component Markdown yet. |
| `${PATH_DOCS_GUIDELINES}` | Human-facing standards and playbooks (system overview, tokens, utilities, etc.). | Keep pages modular; one major topic per file. |
| `${PATH_DOCS_TOKENS}` & `${PATH_DOCS_UTILITIES}` | Token + utility governance (currently consolidated in guidelines). | Link out from component docs rather than duplicating content. |

Always reference these directories using the path tokens; never hard-code `src/content/...` inside the prose.

---

## 2. Component Docs Pipeline

`${PATH_DOCS_COMPONENT_OVERVIEWS}` is implemented as a single dynamic Nuxt route (`src/pages/docs/[component].vue`). It renders component docs by reading generated metadata and demos—there are currently **no** per-component Markdown files. Keep the pipeline aligned by following these steps:

1. **Generator-first data**
   - Maintain complete JSDoc in `${PATH_DS_COMPONENTS}`.
   - Run `npm run docs:components:generate` (or `node ${PATH_SCRIPTS_DOCS}/generate-component-docs.ts`) after every component change.
   - Verify `${PATH_COMPONENT_DOCS_OUTPUT}/ccm<Name>.json` contains `displayName`, `description`, `props`, `examples`, and tags; these map 1:1 to the tabs rendered in the route.

2. **Demo parity**
   - Each component must expose a demo at `${PATH_DS_DEMOS}/ccm-<name>-demo.vue` with a slug matching the JSON entry (`ccmButton` → `ccm-button-demo`).
   - Demos import their `_docs/ccm-<name>.html?raw` fragment; regenerate those fragments via the same docs script.

3. **Index exposure**
   - `src/pages/docs/index.vue` lists components using `src/public/component-docs/index.json`. Regenerate the index whenever you add a component so the docs navigation stays current.
   - During dev the route falls back to `/api/component-docs/<name>`; confirm the API works if the static JSON is missing.

4. **Route rendering**
   - `DocsPropsTable` and `DocsCodeBlock` (from `${PATH_CONTENT_COMPONENTS}`) consume the generated payload. Update them alongside the generator if the schema evolves.
   - Avoid hand-editing `${PATH_DOCS_COMPONENT_OVERVIEWS}`; improve the generator or supporting components instead.

> **Future state** – Markdown overviews + `<DocsTabs>` are planned but not yet available. When they land, this section will expand to cover frontmatter + embed configuration. Until then, generator output + demos are the authoritative sources.

---

## 3. Authoring Workflow

1. **Plan**
   - Confirm the component will live in `${PATH_DS_COMPONENTS}` and has demo coverage scheduled in `${PATH_DS_DEMOS}`.
   - Capture expected API/documentation changes in `_process/spec-drafts/` so reviewers understand the scope.

2. **Generate docs assets**
   - Run `npm run docs:components:generate` to refresh JSON + HTML fragments.
   - Check `${PATH_COMPONENT_DOCS_OUTPUT}/index.json` to ensure the new component appears with the intended slug.

3. **Verify demos**
   - Validate that `/docs/demos/ccm-<name>-demo` renders scenarios aligned with the generator examples.
   - Keep demo content realistic and ensure the fragment (`_docs/ccm-<name>.html`) showcases the same variants exposed in the Examples tab.

4. **Validate rendering**
   - Start `npm run dev` and open `/docs/<component-slug>`.
   - Confirm Code, Docs, and Example tabs populate. Missing data means your JSDoc or generator output is incomplete.

5. **Publish**
   - Commit refreshed JSON + `_docs/*.html` artifacts alongside component/demo changes.
   - Note any required narrative doc updates in `${PATH_AI_ROOT}/maintenance.md`.

---

## 4. Tabs & Demo Integration

- The docs route renders demos via the `LiveDemo` content component. Keep demos embeddable: guard `definePageMeta` calls with `import.meta.client` or refactor into reusable components if hydration errors appear.
- Props tables pull directly from `${PATH_COMPONENT_DOCS_OUTPUT}`. Missing props/slots ⇒ incomplete JSDoc.
- Examples shown in the Docs tab map to `@example` entries in the SFC. Add or update those tags to extend the docs experience.
- Treat missing demos or JSON as blockers; ship component, demo, generator output, and docs together.

---

## 5. Linking & Referencing Rules

- Always reference other docs using the `${PATH_*}` tokens. Example: “See `${PATH_DOCS_GUIDELINES}/component-standards.md` for the definitive standards list.”
- For intra-page anchors, use Markdown heading links (`[See Slots](#slots)`).
- Do not embed absolute URLs to local assets; leverage Nuxt Content’s asset handling if media is required.
- When referencing code, prefer short inline snippets or fenced blocks with minimal context. Long excerpts should point to the source file path instead.

---

## 6. QA & Validation Checklist

- `npx eslint src --ext .ts,.vue` to lint component + route code.
- `npm run lint:css` if demos add or tweak styles.
- `npm run typecheck` to validate SFC + script typings.
- `npm run docs:components:generate` (or direct script) so JSON/HTML fragments match the latest source.
- Manual verification: load `/docs/<component-slug>` and `/docs/demos/ccm-<name>-demo`, checking for:
  - Populated Code/Docs/Example tabs.
  - Demo parity (no divergence between standalone demo and docs embed).
  - Clean console output (no hydration warnings or fetch errors).
- Confirm the docs index lists the component and links resolve.

Any failures should be documented in the PR or the `_process/docs-pipeline-evaluation.md` audit before proceeding.

---

## 7. Migration & Cleanup Notes

- Legacy `.ai/` content should be sunset only after its replacement page in `${PATH_DOCS_GUIDELINES}` or `${PATH_DOCS_COMPONENT_OVERVIEWS}` ships. Add a stub notice linking to the new location during transition.
- Coordinate major restructures with the docs pipeline audit (see `_process/spec-drafts/docs-spec/docs-pipeline-evaluation.md`) to keep inventories in sync.
- When removing a component, delete its demo and generated JSON in the same change. Update the status matrix and note the removal in the spec history so `/docs/<component>` no longer attempts to load stale assets.

---

Following this guide keeps the documentation pipeline deterministic: code drives generated metadata, and Nuxt Content surfaces the single canonical view for both LLMs and humans. If you encounter gaps, log them in `${PATH_AI_ROOT}/maintenance.md` and notify the docs owners before shipping exceptions.