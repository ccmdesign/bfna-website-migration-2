I'm a bit confused by the difference between the content types we are suggesting to create in directus based in @_process/DIRECTUS_NEXT_STEPS.md and the collections/folders I have in /Users/claudiomendonca/Documents/GitHub/bfna-website-migration-2/bfna-website-nuxt/src/content.
Explain to me the how these collections and content types will work together

# How the Directus Collections Behave

The migration work you captured in _process/DIRECTUS_NEXT_STEPS.md (lines 24-72) maps each Nuxt composable (useProducts, useNews, useWorkstreams, etc.) to a Directus collection or set of collections. These collections hold the structured data that used to live in JSON—lists of products, media updates, people records, singleton configs, and so on—and the composables now read them over the Directus API.

Every composable keeps the exact same interface as before (_process/DIRECTUS_NEXT_STEPS.md (lines 145-168)), so the rest of the app doesn’t know or care if the data came from Directus or a fallback file; the components just keep rendering the same shapes.
Because runtime caching + error-handled fallbacks were baked in (_process/DIRECTUS_NEXT_STEPS.md (lines 147-160)), the Directus collections are the primary source during normal operation, but breaking the API or the token simply makes the composables fall back to the local JSON copies while logging an error.

## What still lives in src/content/

bfna-website-nuxt/src/content/data/*.json (line 1) is the “old” data store in file form. These files now act as (a) import templates when seeding Directus and (b) the automatic fallback payloads. There’s a near 1:1 naming match between a Directus collection and its JSON counterpart (products.json ↔ products, publications.json ↔ multi-collection usePublications, etc.), which is why step 3 of the doc tells you to use them when populating Directus (_process/DIRECTUS_NEXT_STEPS.md (lines 73-76)).

Other folders under src/content—blog, docs, and workstreams—feed Nuxt Content with markdown/JSON entries that drive static long-form pages (e.g., bfna-website-nuxt/src/content/blog/2025-01-27-mobile-first-research-reports.md (line 1) or bfna-website-nuxt/src/content/workstreams/politics-society.json (line 1)). These pieces are still authored in-repo because they’re full articles or page-specific narration, not the reusable structured datasets we push into Directus.

## How they work together on a page

A page such as /updates uses Directus-backed composables to get the latest publications/videos/podcasts (structured cards with taxonomy, dates, hero images), while Nuxt Content can still inject long-form copy blocks or embedded markdown sections defined in src/content.
Workstream pages are a good example of hybrid data: the overview modules, carousels, and callouts can now pull from the workstreams Directus collection via useWorkstreams, but the deep-dive narrative, resource lists, or bespoke layout data continue to come from src/content/workstreams/*.json so editors get predictable prose control without touching Directus.
Because the composables hide the source, you can keep iterating on Directus schemas or eventually move even more sections into Directus without reworking page components; you’d just update the schema + types and point the composable to the new fields.
Next Steps

Mirror the JSON structures from src/content/data into Directus so each collection returns data identical to the old files.

Decide whether long-form content (blog/docs/workstream narratives) should remain version-controlled or if future iterations belong in Directus as well; if yes, plan new collections and page loaders.