# Repository Guidelines

This document provides essential guidelines for AI agents and developers working on this Nuxt 3 project.

## Agent-Specific Instructions

- [CLAUDE.md](CLAUDE.md) - Claude Code specific guidance
- [GEMINI.md](GEMINI.md) - Gemini specific instructions

## Project Structure

All application code lives under `src/`:

```
src/
├── pages/          # File-based routing (keep lean, delegate to components)
├── layouts/        # Frame-level templates
├── components/
│   ├── ds/         # Design system components (ccm-prefixed)
│   └── content/    # Content-specific components
├── composables/    # Reusable Vue composition functions
├── content/        # Markdown collections (blog, docs)
├── public/         # Static assets and layered CSS
├── server/         # Nitro API endpoints
├── utils/          # TypeScript utilities
└── tests/          # Vitest test suites

Root-level:
├── _process/       # Planning, specs, and project management
├── CLAUDE.md       # Claude Code specific guidance
├── AGENTS.md       # General agent guidelines
└── .nuxt/          # Generated (gitignored)
```

## Commands

**Development:**
```bash
npm run dev         # Start dev server with HMR
npm run build       # Production build → .output/
npm run generate    # Static site generation → dist/
npm run preview     # Serve production build
npm run postinstall # Regenerate types (nuxt prepare)
npm run typecheck   # TypeScript type checking
```

**Quality Assurance:**
```bash
npx vitest run                   # Run test suite
npx vitest run --coverage        # Run tests with coverage
npx eslint src --ext .ts,.vue    # Lint TypeScript/Vue
npm run lint:css                 # Lint CSS/Vue styles
npm run lint:css:fix             # Auto-fix CSS issues
npm run validate:tokens          # Check design token consistency
npm run validate:tokens:fix      # Auto-fix token issues
npm run validate:ai-instructions # Validate AI agent instructions
```

## Coding Standards

**Vue Components:**
- Use `<script setup lang="ts">` composition API
- Name components in PascalCase (`ccmButton.vue`)
- Design system components use `ccm` prefix
- Keep page components lean; delegate UI to `src/components/`

**TypeScript:**
- Use ESLint config at repository root (`eslint.config.mjs`)
- 2-space indentation, no semicolons, single quotes
- Name composables with `use` prefix (`useContentStream.ts`)
- Utilities in camelCase (`formatDate.ts`)

**CSS Architecture (CUBE CSS):**
- Layer order: reset → defaults → tokens → themes → components → utils → overrides
- Component variables: `--_ccm-{component}-{property}`
- Reference semantic tokens over primitives
- See [Component Standards](src/content/docs/guidelines/component-standards.md)

## Testing

- Place specs in `src/tests/` mirroring source structure
- Use `*.spec.ts` suffix
- Run `npx vitest` in watch mode during development
- Run `npx vitest run --coverage` for CI
- Current coverage: config and token validation suites

## Content Management

Content powered by `@nuxt/content`:
- Collections defined in `content.config.ts`
- Active: `blog/` and `docs/`
- Markdown with frontmatter schemas (Zod validated)
- Query via `queryCollection('<name>')`

## Commit Guidelines

- Imperative mood, under 65 characters
- Example: `Add token validation script`
- Reference issues: `Closes #123`
- Include screenshots for UI changes

## Pull Requests

**Required information:**
- Scope and motivation
- Testing performed (build, tests, linting)
- Environment variables (if added)
- Migration steps (if applicable)

**Validation checklist:**
1. `npx vitest run --coverage` passes
2. `npx eslint src --ext .ts,.vue` passes
3. `npm run lint:css` passes
4. `npm run validate:tokens` passes (if touching tokens)
5. `npm run typecheck` passes
6. `npm run validate:ai-instructions` passes
7. `npm run build && npm run preview` works

## Configuration

- Nuxt config: `src/nuxt.config.ts` (sets srcDir, CSS, PostCSS)
- Content config: `content.config.ts` (at root, defines collections)
- ESLint: `eslint.config.mjs` (at root)
- TypeScript: `tsconfig.json` (baseUrl = "./src")
- PostCSS: Configured in `nuxt.config.ts` (no separate config file)

## Environment Variables

- Store secrets in `.env` (never commit)
- Document new variables in PR descriptions
- Use runtime config in `nuxt.config.ts` for feature flags

## Project Management

- Active specs: `_process/spec-drafts/`
- Archives: `_process/_archives/`
- Templates: `_process/_templates/`
- Document architectural decisions in relevant spec files
