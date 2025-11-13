# Gemini Agent Instructions

**Last Updated**: 2025-10-28

Guidance for Gemini when collaborating on this Nuxt 3 boilerplate repository.

## Project Snapshot

- **Framework**: Nuxt 3.16 (Vue 3.5, SSR enabled)
- **Source Root**: All application code lives in `src/`
- **Content System**: `@nuxt/content` driving Markdown collections under `src/content/`
- **Styling**: CUBE CSS methodology with layered CSS served from `src/public/css/styles.css`
- **Testing**: Vitest via `@nuxt/test-utils`

## Essential Commands

**Development**:
```bash
npm install                      # install dependencies
npm run postinstall              # regenerate .nuxt types (nuxt prepare)
npm run dev                      # start HMR dev server (Nuxt chooses a free port)
npm run build                    # build production bundle into .output/
npm run preview                  # serve latest build via node .output/server/index.mjs
```

**Quality Assurance**:
```bash
npx vitest run                   # run test suite
npx vitest run --coverage        # run tests with coverage
npx eslint src --ext .ts,.vue    # lint TypeScript/Vue
npm run lint:css                 # lint CSS/Vue styles with stylelint
npm run lint:css:fix             # auto-fix CSS lint issues
npm run validate:tokens          # validate design token consistency
npm run validate:tokens:fix      # auto-fix token issues where possible
```

## Directory Overview

All application code lives under `src/`:

```
src/
├── pages/          # File-based routes; keep orchestration only
├── layouts/        # Shell layouts that wrap page content
├── components/
│   ├── ds/         # Design system components prefixed ccm (ccmButton, etc.)
│   └── content/    # Content primitives (ctaSignup, proseSection, etc.)
├── composables/    # Composition utilities (useContentItem, useContentStream)
├── content/        # Markdown sources with collections:
│   ├── blog/       # Blog posts
│   └── docs/       # Documentation (including component specs)
├── public/         # Static assets + layered CSS directory structure
├── server/         # Nitro API routes (e.g., api/contact.post.ts)
└── tests/          # Vitest specs organized by feature (config/, tokens/)
```

**Project Management**:
```
_process/           # Planning, specs, and project management
├── spec-drafts/    # Active specification documents
├── _archives/      # Historical documentation
└── _templates/     # Spec templates
```

**Generated** (gitignored): `.nuxt/`, `.output/`, `dist/`

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

## Implementation Guidelines

**CRITICAL: Read this before implementing ANY feature or UI.**

When implementing features, follow the **composition-first** approach:

1. **ALWAYS review** [General Implementation Guidelines](src/content/docs/guidelines/general-implementation-guidelines.md) first
2. **Follow the decision tree**: DS Components → Utility Classes → Design Tokens → Custom CSS
3. **Never write custom CSS** when existing components, utilities, or tokens can be used
4. **Never hardcode** colors, spacing, or typography values

**Quick Reference**:
- **13 DS components available**: ccmButton, ccmCard, ccmChip, ccmFormField, ccmToggleButton, ccmMenu, ccmMenuItem, ccmMenuButton, ccmSection, ccmHero, ccmTopbar, ccmFooter, ccmByLine
- **Utility classes**: Spacing (`.padding-block:m`), colors (`.color:primary`), typography (`.font-size:1`)
- **Design tokens**: 800+ tokens for colors, spacing, typography (use semantic tokens first: `--color-primary`, `--space-m`)
- **Composables**: `useContentStream()`, `useContentItem()`, `useSlugify()`

**Required reading**:
- [General Implementation Guidelines](src/content/docs/guidelines/general-implementation-guidelines.md) - How to build features
- [Component Standards](src/content/docs/guidelines/component-standards.md) - If creating DS components
- [Component Design Decisions](src/content/docs/guidelines/component-design-decisions.md) - Design rationale

## Component Development Standards

When creating or updating components in `src/components/ds/`:

1. **ALWAYS review** [Component Standards](src/content/docs/guidelines/component-standards.md) before starting
2. **ALWAYS validate** against all 8 standards before completing
3. Reference [Component Design Decisions](src/content/docs/guidelines/component-design-decisions.md) for context

**Non-negotiable requirements**:
- All 8 standards MUST be met (CSS variable naming, style binding, design token integration, etc.)
- No exceptions without documented justification

**Key standard highlights**:
- Use `--_ccm-{component}-{property}` pattern for CSS variables
- Style binding via computed `cssVars` for props
- Reference design tokens (semantic > primitive)
- Provide `size`, `variant`, and `customColor` props where appropriate

## Content Workflow

- Active collections: `blog` and `docs` (implicitly via file structure)
- Configured collections in `content.config.ts`: blog, casestudies, services, uilibrary
- Markdown files in `src/content/<collection>/` with frontmatter for metadata
- Schemas enforced via Zod in `content.config.ts`
- Query content using `queryCollection('<name>')` in pages/composables

## Testing Discipline

- Tests live in `src/tests/` organized by feature area
- Current test suites: `config/`, `tokens/`
- Coverage provider: V8
- Run tests with `npx vitest run` (no npm script shortcut)
- Add specs when updating composables or runtime logic

## Checklist for Changes

1. Update or create relevant specs in `src/tests/` before implementing significant logic
2. Run `npx vitest run --coverage` to verify tests pass with adequate coverage
3. Run `npx eslint src --ext .ts,.vue` to catch linting issues
4. Run `npm run lint:css` for CSS/style validation
5. If touching tokens, run `npm run validate:tokens` to ensure consistency
6. For production verification: `npm run build` followed by `npm run preview`
7. Document architectural decisions in `src/content/docs/guidelines/`

## Known Gaps

- Content collections defined in `content.config.ts` (casestudies, services, uilibrary) have no corresponding directories in `src/content/`
- Limited test coverage - only config and tokens suites exist currently

---

**Revision Date**: 2025-10-28

**Key Updates**:
- ✅ Fixed directory references (now uses `_process/`)
- ✅ Added QA commands (`validate:tokens`, `lint:css`)
- ✅ Added component standards references
- ✅ Expanded to match CLAUDE.md detail level
