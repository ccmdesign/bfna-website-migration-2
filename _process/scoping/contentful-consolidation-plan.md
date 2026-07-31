# Contentful → Directus Consolidation Plan

**Status: planning only.** Prerequisite for the taxonomy migration in [schema-draft.md](schema-draft.md) — the new-schema migration must run from ONE source of truth, so Contentful gets fully consolidated into Directus first.

## Current state (verified 2026-07-30 against both APIs)

| content type | Contentful | Directus | drift |
|---|---|---|---|
| publication | 175 | 185 | Directus +10 |
| video | 43 | 43 | in sync |
| infographic | 48 | 55 | Directus +7 |
| product | 121 | 117 | **Contentful +4** |
| super_product | 8 | 8 | in sync |
| workstream | 8 | 8 | in sync |
| news | 9 | — | **never migrated** |
| announcement | 1 | ? | verify |
| documentaries (docs) | live via Contentful importer | 38 in `docs_*` | schema migrated, importer not switched |

Drift is **bidirectional**: content was added in Directus after the migration AND in Contentful (live-site updates, e.g. podcast episodes — BF-136 adds three more). Count comparison is insufficient; reconciliation must be item-level.

## Phase 1 — Item-level diff (read-only)

Script pulls both APIs and diffs by slug/heading per content type. Output: three lists per type — `only-in-contentful`, `only-in-directus`, `in-both-but-different` (compare updated dates + field hashes). Report only, no writes. This turns "the counts differ" into an explicit worklist.

## Phase 2 — Reconcile

- `only-in-contentful` → import into Directus (reuse the field mappings already encoded in `bfna-website-nuxt/src/directus/*.js`, reversed).
- `only-in-directus` → keep (assume intentional post-migration additions); list for eyeball confirmation.
- `in-both-but-different` → newest `updatedAt` wins; conflicts logged for manual review, never silently overwritten.
- Media assets: entries imported from Contentful reference `images.ctfassets.net` URLs — download and re-upload to Directus files so no runtime dependency on Contentful's CDN survives.

## Phase 3 — The `news` type (9 entries)

`news` is homepage curation cards (heading, excerpt, image, url, button label) — structurally identical to Directus `highlights`. Recommendation: review the 9 entries; merge the still-relevant ones into `highlights`, drop the rest. Do NOT create a `news` collection. <!-- ponytail: 9 rows don't justify a collection -->

## Phase 4 — Switch the docs importer

`bfna-website-nuxt/src/directus/docs.js` still calls Contentful (`bfnaDocsDisplayManagement`) despite `docs_*` collections existing in Directus (38 documentaries). Verify `docs_*` data is complete vs the Contentful type (same Phase-1 diff), then rewrite `docs.js` to read Directus and delete the Contentful client from `common.js`.

## Phase 5 — Drift management until cutover

The live 11ty site keeps receiving content in Contentful until the new site launches (podcast episodes, publications). Until then:

- Make the Phase-1/2 script **rerunnable** (idempotent upsert by slug) and run it on demand / before any content work.
- No dual-entry burden on editors; Contentful stays their tool for the live site until cutover.

## Phase 6 — Cutover & retirement

1. Content freeze on Contentful (coordinate with Sam/Irene).
2. Final sync run; verify zero diff.
3. Run the taxonomy migration (schema-draft.md migration map) from Directus only.
4. Remove `contentful` npm dependency, env vars, and the dead `export:contentful-data` / `import:directus` script references; `scripts/verify-contentful-deps.ts` must pass.

## Sequencing

Phases 1–4 can start now (independent of the taxonomy decisions). Phase 5 is ongoing. Phase 6 waits for launch readiness. The taxonomy migration depends on Phases 1–3 being done, not on 4–6.

## Open items

- Confirm the 9 `news` entries' fate with the client (or just with Claudio if obviously stale).
- Announcements: verify the singleton matches (Contentful shows 1).
- BF-136 podcast episodes will land in Contentful → the rerunnable sync picks them up; no special handling.
