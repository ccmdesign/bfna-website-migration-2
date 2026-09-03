# CLAUDE.md (Revised)

Guidance for Claude Code when collaborating on this repository.

## Scope: 2026 Content Restructure
The BFNA content restructure (per Irene's Jul 29, 2026 email + `BFNA website_text.docx`) is implemented **only in this new Directus/Nuxt version — it is the reason this migration exists**. Never apply it to the old Contentful site. The restructure: 4 programs → 3 (Digital Economy dropped; "Politics & Society" renamed "Transatlantic Relations & Global Challenges"); Transatlantic Barometer, RANGE, and Transatlantic Periscope become projects under that renamed program; new About Us and project descriptions. Conversely, day-to-day content updates for the current live site (e.g. podcast episodes) go to the old Contentful stack / HTFD repo, not here.

## Project Snapshot
- **Framework**: Nuxt 3.16 (Vue 3.5, SSR enabled)
- **Source Root**: All application code lives in `src/`
- **Content System**: `@nuxt/content` driving Markdown collections under `src/content/`
- **Styling**: CUBE CSS methodology with layered CSS served from `src/public/css/styles.css`
- **Testing**: Vitest via `@nuxt/test-utils`

## Essential Commands
```bash
npm install                      # install dependencies
npm run postinstall              # regenerate .nuxt types (nuxt prepare)
npm run dev                      # start HMR dev server (Nuxt chooses a free port)
npm run build                    # build production bundle into .output/
npm run preview                  # serve latest build via node .output/server/index.mjs
npm run validate:tokens          # validate design token consistency
npm run validate:tokens:fix      # auto-fix token issues where possible
npm run lint:css                 # lint CSS/Vue files with stylelint
npm run lint:css:fix             # auto-fix CSS lint issues
npx vitest run                   # run test suite
npx vitest run --coverage        # run tests with coverage (requires @vitest/coverage-v8)
npx eslint src --ext .ts,.vue    # lint application code
```

## Directory Overview
- `src/pages/`: File-based routes; keep orchestration only, delegate UI to components
- `src/layouts/`: Shell layouts that wrap page content
- `src/components/bf/`: Final `bf-*` design system (bfButton, bfCard, etc.) — **presentational-only: props in, events out, nav and footer included.** No `queryCollection`, no store, no data composable inside a `bf-*` component. All new components for the `/` site build go here.
- `src/components/ds/`: the prior `ccm`-prefixed generation (ccmButton, ccmCard, etc.) — **not** touched by the `bf-*` epic; its `--_ccm-` conventions still apply to it
- `src/components/content/`: Content primitives (ctaSignup, proseSection, Callout, etc.)
- `src/composables/`: Composition utilities (`useContentItem`, `useContentStream`, `useSlugify`)
- `src/types/`: Shared TypeScript contracts — `bf-contracts.ts` is the single source for every `bf-*` type
- `src/content/`: Markdown sources with two collections:
  - `blog/`: Blog posts
  - `docs/`: Documentation (including component specs)
- `src/public/`: Static assets + layered CSS directory structure
- `src/server/`: Nitro API routes (e.g., `api/contact.post.ts`)
- `src/tests/`: Vitest specs organized by feature (`config/`, `tokens/`)
- `_process/`: Planning, specs, and project management
  - `_process/spec-drafts/`: Active specification documents
  - `_process/_archives/`: Historical documentation
  - `_process/_templates/`: Spec templates
- `.nuxt/`, `.output/`, `dist/`: Generated artefacts (ignored by git)

## Configuration Notes
- `src/nuxt.config.ts` sets `rootDir`/`srcDir`, registers global CSS, PostCSS plugins, and component auto-imports
- PostCSS plugins (`postcss-import`, `postcss-preset-env`) are defined in the `postcss` section of `src/nuxt.config.ts`; no standalone `postcss.config.js`
- `content.config.ts` (at repo root) defines collections using absolute paths to `src/content/`
- ESLint config lives at repo root (`eslint.config.mjs`) with `tsconfig.json` setting `baseUrl = "./src"`

## Styling Architecture (CUBE CSS)
- `styles.css` declares layer ordering: `@layer reset, defaults, tokens, themes, components, utils, overrides;`
- Each imported file wraps contents in appropriate `@layer` block to maintain cascade ordering
- Token system:
  - Primitive tokens: Base values (colors, spacing, fonts)
  - Semantic tokens: Context-specific aliases referencing primitives
  - Organized in `src/public/css/tokens/` directory
- Use `npm run validate:tokens` to check token consistency

## Content Workflow
- Active collections: `blog` and `docs` (implicitly via file structure)
- Configured collections in `content.config.ts`: blog, casestudies, services, uilibrary
- Markdown files in `src/content/<collection>/` with frontmatter for metadata
- Schemas enforced via Zod in `content.config.ts`
- Query content using `queryCollection('<name>')` in pages/composables
- **`bf-*` pipeline**: `src/assets/wireframe-data/*.json` (6 snapshots, read-only) → `scripts/normalise-wireframe-data.ts` → `content/bf/**/*.json` → six `bf*` `type: 'data'` collections in `content.config.ts` → `src/composables/data/bf*.ts` (`queryCollection` only) → component props. All synthesis (renames, curation, ordering, HTML strip/decode) happens in the normaliser, never in a component.
- **Site chrome is not a seventh collection**: the same normaliser emits `src/assets/bf-data/menus.json`, read by the layout and passed to `bfNav`/`bfFooter` as props.
- **Shared `bf-*` TypeScript types live in `src/types/bf-contracts.ts` and nowhere else.** No `bf-*` component declares a shared type inline.

## Testing Discipline
- Tests live in `src/tests/` organized by feature area
- Current test suites: `config/`, `tokens/`
- Coverage provider: V8
- Run tests with `npx vitest run` (no npm script shortcut)
- Add specs when updating composables or runtime logic

## Implementation Guidelines

**CRITICAL: Read this before implementing ANY feature or UI.**

When implementing features, follow the **composition-first** approach:

1. **ALWAYS review** [Implementation Playbook](_process/docs-deprecated/guidelines/implementation-playbook.md) first
2. **Follow the decision tree**: DS Components → Utility Classes → Design Tokens → Custom CSS
3. **Never write custom CSS** when existing components, utilities, or tokens can be used
4. **Never hardcode** colors, spacing, or typography values

**Quick Reference:**
- **DS components**: new work builds `bf-*` components in [`src/components/bf/`](src/components/bf/) — each prefixed with `bf`; the earlier generation in [`src/components/ds/`](src/components/ds/) is prefixed with `ccm` and stays as-is
- **Component demos**: Interactive demos at [`src/pages/docs/`](src/pages/docs/)
- **Component docs**: Auto-generated JSON in [`src/public/component-docs/`](src/public/component-docs/) served via `/docs/<component>`
- **Utility classes**: Spacing (`.padding-block\:m`), colors (`.color\:primary`), typography (`.font-size\:1`)
- **Design tokens**: 800+ tokens for colors, spacing, typography (use semantic tokens first: `--color-primary`, `--space-m`)
- **Composables**: `useContentStream()`, `useContentItem()`, `useSlugify()`

**Required reading:**
- [Implementation Playbook](_process/docs-deprecated/guidelines/implementation-playbook.md) - How to build features
- [Component Standards](_process/docs-deprecated/guidelines/component-standards.md) - If creating DS components
- [Component Design Decisions](_process/docs-deprecated/guidelines/component-design-decisions.md) - Design rationale

## Component Development Standards

When creating or updating components in `src/components/bf/` or `src/components/ds/`:

1. **ALWAYS review** [Component Standards](_process/docs-deprecated/guidelines/component-standards.md) before starting
2. **ALWAYS validate** against all 10 standards before completing
3. Reference [Component Design Decisions](_process/docs-deprecated/guidelines/component-design-decisions.md) for context
4. For systematic migrations, consult `_process/spec-drafts/component-migration-checklist.md`

**Non-negotiable requirements:**
- All 10 standards MUST be met (CSS variable naming, style binding, design token integration, slot naming, etc.)
- No exceptions without documented justification
- Review checklist at end of standards doc must pass

**Key standard highlights:**
- CSS variable pattern: `--_ccm-{component}-{property}` for the existing `src/components/ds/*` (unchanged); `--_bf-{component}-{property}` for every new `src/components/bf/*` component
- Style binding via computed `cssVars` for props
- Reference design tokens (semantic > primitive)
- Provide `size`, `variant`, and `customColor` props where appropriate

### CRITICAL: Interdependent Components

**⚠️ IMPORTANT**: When creating components that require multiple interdependent parts (parent + children), the demo page MUST show all components working together:

**Examples of interdependent components:**
- **Tabs**: ccmTabs + ccmTab + ccmTabPanel
- **Accordion**: ccmAccordion + ccmAccordionItem
- **Menu**: ccmMenu + ccmMenuItem + ccmMenuButton
- **Button Group**: ccmFormGroup + buttons

**Requirements:**
1. Create ALL child components together with parent
2. Build demo page showing them working together
3. Visually verify styling and interactions in browser
4. Fix integration issues before finalizing documentation
5. Demo page must include complete, realistic examples (not isolated components)

**See**: [Demo Playbook](_process/docs-deprecated/guidelines/demo-playbook.md) for detailed guidance

## Project Management
- Active specs and planning docs: `_process/spec-drafts/`
- Archived documentation: `_process/_archives/`
- Spec templates: `_process/_templates/`
- When expanding scope, document in relevant spec files under `_process/spec-drafts/`

## Documentation and Guidelines

This project includes comprehensive documentation and guidelines:

**Essential Reading:**
- [Component Standards](_process/docs-deprecated/guidelines/component-standards.md) - Component development standards
- [Implementation Playbook](_process/docs-deprecated/guidelines/implementation-playbook.md) - How to build features
- [Component Design Decisions](_process/docs-deprecated/guidelines/component-design-decisions.md) - Design rationale
- [Documentation Governance](_process/docs-deprecated/guidelines/documentation-governance.md) - Documentation standards
- [Demo Playbook](_process/docs-deprecated/guidelines/demo-playbook.md) - Demo page creation guide

**Agent-Specific Directories:**
- [`.claude/`](.claude/) - Claude Code commands and skills
- [`.codex/`](.codex/) - Codex prompts and workflows

**Always reference project documentation first** for project-wide knowledge and consistency.

## Claude Skills

This project includes specialized Claude skills for component development:

### Component Builder (`component-builder`)
Complete workflow for creating new components:
- Runs decision trees to determine component type (DS, wrapper, content)
- Guides through all 10 Component Standards
- Provides tier-appropriate templates
- Creates demo pages
- Ensures documentation

**Use when:** Creating any new component or deciding between compose vs create

### Component Validator (`component-validator`)
Audit existing components against all standards:
- Validates all 10 Component Standards
- Generates detailed compliance report with score
- Provides specific code fixes with before/after examples
- Checks best practices and anti-patterns

**Use when:** Validating components, code review, or migrating to new standards

### Demo Page Builder (`demo-page-builder`)
Generate comprehensive demo pages:
- Analyzes component features (props, slots, events)
- Determines appropriate sections
- Creates complete demo page with interactive examples
- Uses CUBE CSS layout utilities
- Includes realistic use cases

**Use when:** Creating or updating demo pages for components

**See:** [`.claude/skills/README.md`](.claude/skills/README.md) for detailed documentation

## Checklist for Changes
1. Update or create relevant specs in `src/tests/` before implementing significant logic
2. Run `npx vitest run --coverage` to verify tests pass with adequate coverage
3. Run `npx eslint src --ext .ts,.vue` to catch linting issues
4. Run `npm run lint:css` for CSS/style validation
5. If touching tokens, run `npm run validate:tokens` to ensure consistency
6. For production verification: `npm run build` followed by `npm run preview`
7. Document architectural decisions or follow-up actions in `_process/docs-deprecated/guidelines/`

## Known Gaps
- Content collections defined in `content.config.ts` (casestudies, services, uilibrary) have no corresponding directories in `src/content/`
- Limited test coverage - only config and tokens suites exist currently

---

## Revision Summary

**Date**: 2025-10-22

**Key Issues Fixed:**
1. ✅ Corrected directory references (now uses `_process/`)
2. ✅ Updated commands to reflect actual package.json scripts
3. ✅ Clarified actual content structure vs. configured collections
4. ✅ Added token validation commands (`validate:tokens`, `validate:tokens:fix`)
5. ✅ Added CSS linting commands (`lint:css`, `lint:css:fix`)
6. ✅ Removed references to non-existent quickstart file
7. ✅ Added "Project Management" section for `_process/` directory
8. ✅ Added "Known Gaps" section for transparency
9. ✅ Updated component checklist reference to correct location
10. ✅ Clarified actual collections vs configured collections
