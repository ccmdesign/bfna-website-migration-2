# Front 1 — Backend Work

Read `00-shared-context.md` first. **Phase: discuss + specify. No Directus writes yet.**

## Scope

- New Directus collections per `../schema-draft.md`: `focus_areas` (3), `programs` (~14, `kind` enum, M2O focus_area, `external_url` for microsites), `insights` (~400, `format` enum article|report|video|infographic, M2M focus_areas/programs, `publish_date`, `evergreen` flag). Tiers computed, not stored.
- Retire `workstreams` (single M2O FK today, no tags) — later, after new taxonomy is live.
- Contentful→Directus consolidation per `../contentful-consolidation-plan.md`: item-level diff, newest-wins reconcile, re-upload assets off ctfassets.net, fold 9 orphan `news` entries into `highlights`, rerunnable sync until cutover, freeze + final sync + retire contentful dep.
- Importer: `contentImporter.js` + root `content.config.ts` must serve the new collections to Nuxt.

## Known state

- Content drift both ways: publication 175(C)/185(D), video 43/43, infographic 48/55, product 121(C)/117(D).
- Working admin token: `how-to-fix-democracy-v2/.env` (`DIRECTUS_ADMIN_TOKEN`) — load into a shell var, never print. The `bfna-barometer-v2` token is FORBIDDEN on `/collections`.
- Docs importer still points at Contentful for some types — switch as part of consolidation.

## Open questions blocking this front (from `../questions-for-irene.md`)

- Q1/Q2: final taxonomy labels ("Focus Areas/Programs" vs Irene's "programs/projects") → field + collection naming.
- Q3: Digital World content (~40+ items) — re-tag or straight to archive → migration mapping.
- Q8–10: archive policy sign-off, who flags `evergreen`, archive page shape → schema flags + queries.
- Q11: cutover/freeze coordination (Sam?) → sync schedule.
- Q12: which of the 9 `news` entries survive into highlights.
- Contradiction #1 (archive vs delete): is anything EVER deleted? Assume no.
- Contradiction #2 (tagging scope flip): GGS never labeled content — CCM does all tagging. Bulk-tagging ~400 insights is real work; plan a strategy (heuristics from old workstream FK + manual pass).

## Dependencies

- Blocks Front 4 (tiers/search/AI schema ride on the tagging). Nav data feeds Front 2.
- Waits on: Claudio's answers doc.
