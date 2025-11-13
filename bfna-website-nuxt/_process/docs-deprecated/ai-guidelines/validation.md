# Validation Guide

Everything that must pass before design-system work ships. Execute these checks for components, demos, docs, and tokens every time—no exceptions.

---

## 1. Command Matrix

| Purpose | Command | Notes |
| --- | --- | --- |
| ESLint (Vue/TS) | `npx eslint src --ext .ts,.vue` | Uses repo-wide ESLint config; add `--ext .md` once Markdown linting is enabled. |
| CSS lint | `npm run lint:css` | Stylelint coverage for components + demos. |
| Type safety | `npm run typecheck` | Runs `vue-tsc` for SFCs and TS files. |
| Component/unit tests | `npx vitest run src/tests/components` | Scope to DS component suites; expand as coverage grows. |
| Docs generation | `npm run docs:components:generate` | Refreshes `${PATH_COMPONENT_DOCS_OUTPUT}` JSON and `_docs/*.html` fragments. |
| Token integrity | `npm run validate:tokens` | Ensures `${PATH_PUBLIC_TOKENS}` remains consistent. |

Optional (run when relevant):
- `npx eslint src/pages/docs/demos --ext .vue` for demo-heavy changes.
- `npm run docs:sync` if documentation indexes need regenerating.

Always execute commands from the project root. Capture output (success/failure) in the reporting section below.

---

## 2. Manual QA Checklist

After commands pass, perform these checks in order:

1. **Demos** – Load `/docs/demos/ccm-<name>-demo` for the affected component(s). Verify:
   - All interactive controls work (variants, states, toggles).
   - Keyboard navigation and focus rings behave correctly.
   - No console warnings or errors.

2. **Component Docs Route** – Visit `/docs/<component>` and confirm:
   - Code, Docs, and Example tabs render without warnings (data comes from `${PATH_COMPONENT_DOCS_OUTPUT}`).
   - Embedded demo matches the standalone page’s behavior.
   - Generated metadata (description, tags) reflects reality.

3. **Accessibility Sanity** – Spot-check with keyboard-only navigation and screen reader basics (VO/ChromeVox). Ensure ARIA labels, roles, and landmarks match documentation.

4. **Visual Regression** – Compare against existing screenshots or design references. For styling-heavy changes, manually inspect in both light/dark themes if applicable.

5. **Docs Consistency** – Reconcile narrative guides in `${PATH_DOCS_GUIDELINES}` (e.g., `component-development-guide.md`, `component-standards.md`) with updated behavior and tokens.

Document findings; unresolved issues must block release or be explicitly deferred with owner sign-off.

---

## 3. Reporting Template

Record validation results in PR descriptions or `_process/validation-log.md`. Use this template:

```
## Validation Summary
- npx eslint src --ext .ts,.vue ✔️
- npm run lint:css ✔️
- npm run typecheck ✔️
- npx vitest run src/tests/components ✔️
- npm run docs:components:generate ✔️
- npm run validate:tokens ✔️

Manual QA:
- /docs/demos/ccm-breadcrumb-demo – no warnings, keyboard ok
- /docs/ccmBreadcrumb – tabs render, metadata matches component JSON

Skipped: n/a
Follow-ups: Add visual regression tests for new variant (#ticket)
```

If any command fails or QA reveals issues, note them plainly, include remediation steps, and keep the entry updated until resolved.

---

## 4. Automation Hooks

- **Current** – Validation is manual/command-line. Scripts above should run in CI (GitHub Actions) once pipeline work lands; until then, developers must execute them locally.
- **Future guardrails** (log in `${PATH_AI_ROOT}/maintenance.md`):
  - CI check to ensure every component in `${PATH_DS_COMPONENTS}` has matching JSON + demo coverage.
  - Docs lint (once Markdown overviews ship) to verify `${PATH_DOCS_COMPONENT_OVERVIEWS}` includes required frontmatter like `version`, `status`, `demoPath`, `docsJson`.
  - Token validation step blocking merges when semantic/primitive mismatches occur.

---

Keep this guide updated as new validation tooling appears. If you add a command or checklist item, update `${PATH_AI_ROOT}/validation.md` first, then sync references in other guides (components, content, demos, maintenance).