# Docs Pipeline Map (2025-11-02)

## Active Flow

| Stage | Path(s) | Notes | Status |
| --- | --- | --- | --- |
| Source components | `src/components/ds/**` | `designSystemRegistry` scopes the generator/API strictly to design-system SFCs. Content components are now limited to support widgets only. | Required |
| Doc-specific widgets | `src/components/content/docs-*.vue` | `DocsCodeBlock`, `DocsPropsTable`, `DocsComponentSource`, `DocsLiveDemo` renamed with `docs-` prefix so the generator can ignore them. No DS docs consume anything from `src/components/content` without the prefix. | Required |
| JSON generator | `scripts/generate-component-docs.ts` | Runs via `npm run docs:components:generate` (build + generate). Produces per-component JSON, `index.json`, and `overview-manifest.json`. Stale JSON is pruned automatically. | Required |
| Guidance extractor | `scripts/docs-extract.ts`, `scripts/docs-watch.ts` | Generates `_docs/*.html` fragments from component JSDoc blocks; `npm run dev` runs the watcher so fragments stay in sync. | Required (legacy API still consuming fragments) |
| Generated assets | `src/public/component-docs/` | Reset (2025-11-02). Now only includes 13 DS components + `index.json` + `overview-manifest.json`. No orphan JSON remains. | Required |
| Demos | `src/pages/docs/demos/**/*.vue` | Live demo entry points. Manifest points DocsTabs at these locations. | Required |
| Guidance fragments | `src/pages/docs/demos/_docs/*.html` | Consumed by DocsTabs `guidance` tab. Missing fragments surface warnings in dev. | Replace (prefer richer authoring once markdown migrates) |
| Component overviews | `src/content/docs/components/*.md` | Authored markdown per component; rendered by `/docs/components/[slug].vue`. | Required |
| Runtime consumers | `src/components/docs/DocsTabs.vue`, `src/pages/docs/components/[slug].vue`, `src/server/api/component-docs/*` | DocsTabs hydrates JSON, demos, and fragments; server API provides fallback JSON when static bundle missing. | Required |

## Key Observations

- Only `src/components/ds` feeds the pipeline. No other directories are traversed by the generator or the API.
- `npm run docs:components:generate` now produces 13 JSON files (breadcrumb → topbar). Previously checked-in JSON for non-existent components (Accordion, Menu, Modal, SearchBox, etc.) were removed during regeneration.
- Doc-only components in `src/components/content` have been renamed to `docs-*` so they are easy to filter out while auditing. None of these names overlap with actual design-system entries.
- Guidance HTML comes exclusively from `docs-extract.ts`; fragments are required until we replace that flow with markdown-based guidance.
- `npm run docs:sync -- --all` (2025-11-02) successfully regenerated all `_docs/*.html` fragments, confirming the extractor still respects the renamed components.

## Follow-Ups

- Consider relocating the `docs-*.vue` widgets from `src/components/content` into `src/components/docs/` once downstream imports are updated.
- Audit the `_docs/*.html` fragments after the next generator pass to ensure they all originate from Vue docblocks instead of hand-authored HTML.
- Wire `overview-manifest.json` into CI so stale demos/guidance fragments fail faster.

