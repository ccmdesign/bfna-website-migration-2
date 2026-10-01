# Insight desktop card covers

The 117 posts with primary images use 105 distinct source artworks (30 active
posts, 87 archived; 27 distinct artworks among the active posts). The manifest
tracks every source, associated post, CMS item, generated cover and review state.
All source artworks now have a reviewed card cover.

Completed: **105 artworks covering all 117 posts** (30 active and 87 archived).
These are linked on 116 Directus items plus the one local-only Contentful record.
**Nothing remains in the image queue.** The first 26 artworks used the built-in
image editor; the remaining 79 use user-approved deterministic Sharp composition.

The verified BFNA Directus instance is `https://bfna.simplyas.com`. Its current
source collections are `products` and `infographics`; it does not yet have a
unified `insights` collection. Both now have a nullable `card_cover` UUID image
relation to `directus_files` with `SET NULL` deletion behavior:

| Collection | Field ID | Relation ID | Original image field |
| --- | --- | --- | --- |
| products | 792 | 166 | cover_image |
| infographics | 793 | 167 | image |

Only `card_cover` links were written. Original images, publication state, copy,
relationships and article-page imagery were preserved and checked after each
write. The Contentful-only `authors` record has no Directus item; its local cover
uses the same artwork as Cross-Cutting Currents.

## Rendering and content pipeline

`CardInsight.vue` selects `card_cover` through a `<picture>` source at widths of
48rem and above. The original `image` remains the `<img>` fallback for mobile.
Article pages continue using `image`. If no cover exists, desktop uses `image`.

The Directus adapters include `card_cover`. The frozen migration snapshots remain
read-only. Reviewed live cover links are also captured in
`bfna-website-nuxt/src/assets/content-overrides/insight-card-covers.json`, guarded
by the original source-image URL. The normalizer ignores a derivative when its
source image changes, and an explicit upstream `card_cover` (including null)
always takes precedence.

To refresh the supplemental links after editing covers in the Directus UI, run
the read-only preview from the Nuxt app directory with credentials injected by
1Password, then add `--write` to update the local map:

```sh
DIRECTUS_TOKEN='op://Agent Credentials/BFNA Directus API Token/credential' op run -- node scripts/sync-insight-card-covers.mjs
```

Stop the dev server before running `npm run data:normalise`; bulk changes can
exhaust the development content watcher. Restart it afterward. The isolated
verification runs safely while dev is active:

```sh
node scripts/verify-insight-card-covers.mjs
```

## Artwork review

Covers target 4:5. The 79 deterministic covers are exactly 1200×1500. The first
26 generated covers are 1122×1402 (rounding differs from 4:5 by less than one
pixel). The card itself remains exactly 4:5. Meaningful subjects, publication titles, dates, logos and visual
content are compared with the original before a derivative is linked. Layouts
reserve the lower portion for the website heading and date. Transparent book
mockups retain alpha. Local approved assets are kept under
`bfna-website-nuxt/public/images/insight-card-covers/`.

The user explicitly approved pixel-preserving composition for the remaining
queue on 2026-10-01. Sharp resizes and positions the original artwork without
generative redrawing. Every source SHA-256 is checked, every source region is
retained, and content remains above y=1060 on the 1500px canvas. Transparent
sources retain alpha. Fourteen flat-color artworks extend their original
background color into the surrounding canvas.

Two unusually tall infographics—12 Days of Christmas in Europe and Democracy’s
Canary in a Coal Mine—use consecutive strips arranged left-to-right, with cuts
between complete content sections. No source regions are discarded. Small
citations remain part of the artwork; full-size originals remain in the articles.

All 79 original/derivative pairs were visually reviewed before linking. Each
uploaded file was downloaded again and checked against its local SHA-256.
Earlier failed generative drafts remain unpublished, and their historical review
exceptions are marked resolved.

The reproducible layout and source/cover hashes are in `composition-plan.json`.
From the repository root, regenerate into a fresh directory using the original
source files:

```sh
node _process/scoping/insight-card-covers/compose-covers.mjs <source-directory> <output-directory>
```

The script rejects source drift, missing or overlapping source strips, clipping
into the title-safe area, and overwriting a different existing derivative.

## Verified behavior

- The isolated card-cover verifier passes for all 117 links, including source
  precedence, explicit null, source-image drift, invalid maps and idempotence.
- The existing excerpt verifier still passes (160 fills, seven revisions).
- Directus synchronization preview reports 117 covers, zero changes and zero drift.
- Browser inspection confirms a 346.66×433.33 desktop card selects the new
  1122×1402 portrait; at a 390px mobile viewport it selects the original image,
  retains the 16:9 media frame and has no horizontal page overflow.
- The Class of 2025 article still loads its original 12000×7415 artwork.
- Scoped Vue/schema ESLint passes. No build or bulk normalization ran alongside
  the live development server.

After each batch, reload the current Insights tab: the content watcher updates
the collection but an already-open result list can retain its previous object
values until a page refresh.
