# CCM Nuxt Boilerplate 2025

Nuxt 3 base project configured to keep all application code under `src/` while governance assets stay at the repository root. Use this repository as a starting point for design-forward content sites powered by `@nuxt/content`.

## Project Structure

```
repo/
├── src/
│   ├── components/        # Auto-imported Vue components (ccm*)
│   ├── composables/       # Composition utilities and Pinia helpers
│   ├── content/           # Markdown/JSON for @nuxt/content
│   ├── layouts/           # Frame-level layouts
│   ├── pages/             # File-based routes (orchestration only)
│   ├── public/            # Static assets and layered CSS
│   ├── server/            # Nitro API routes
│   ├── tests/             # Vitest specs mirroring source paths
│   ├── utils/             # Shared TypeScript helpers
│   ├── nuxt.config.ts     # Nuxt configuration exporting srcDir/rootDir
│   └── content.config.ts  # @nuxt/content collections
├── package.json
├── package-lock.json
├── .nuxt/ .output/ dist/  # Generated artefacts (ignored)
├── specs/                 # Planning + governance docs
└── ...other root docs (AGENTS.md, CLAUDE.md, etc.)
```

## Commands

```bash
npm install            # install dependencies
npm run postinstall    # regenerate .nuxt types after config changes
npm run dev            # start HMR dev server (Nuxt auto-picks free port)
npm run build          # build production bundle into .output/
npm run preview        # serve the latest build via node .output/server/index.mjs
npx vitest run --coverage  # execute test suite with coverage reporting
npx eslint src --ext .ts,.vue  # lint application code
```

## Documentation & AI Guidance
- **Prompt library** → `src/content/docs/prompts/`: automation templates (`build-component`, `component-docs`, etc.), run history, migration map, and the LLM primer `docs-system-overview.md`.
- **Design system standards** → `src/content/docs/guidelines/`: token governance, CUBE CSS, documentation governance, and AI maintenance (`guidelines/ai/ai-maintenance.md`).
- **Component docs** → `src/content/docs/components/`: generated Markdown from specs; fill TODO sections using the referenced guidelines.
- **Demo scaffolds** → `src/components/docs/demos/`: Vue demos plus metadata JSON consumed by docs routes.
- **Orientation for new chats** → begin with `src/content/docs/prompts/docs-system-overview.md` to align LLM collaborators on structure, commands, and validation.

Maintain parity between prompts and guidelines: update governance docs when processes change, bump prompt versions, and record runs in `src/content/docs/prompts/history.md`. 

## Content & Styling
- Content entries live in `src/content/` and are defined through `content.config.ts` collections.
- Layered CSS originates from `src/public/css/styles.css`, with individual files wrapping declarations in `@layer` to preserve cascade order.
- Static assets are served from `src/public/`; Vercel/Netlify builds keep `.output/` at the repository root.

For rollback steps, follow Section 7 of the quickstart guide.
