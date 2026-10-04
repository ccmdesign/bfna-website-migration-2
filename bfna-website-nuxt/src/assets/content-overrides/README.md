# Authored Insight excerpts

`insight-excerpts.json` contains plain-English summaries authored from the existing
post bodies during the October 2026 UI review. Keys are canonical Insight slugs,
including any suffix added by the normalizer to disambiguate duplicate slugs.

These are source content, not generated files. The normalizer reads them after
`src/assets/wireframe-data/insights.json`. String entries fill empty excerpts.
Seven `{ original, text }` revisions expand unusually short summaries (six active,
one archived); each applies only while the snapshot matches `original` exactly.
Future CMS edits therefore take precedence. Five revisions use article bodies;
the two Fellowship cohort revisions use their existing excerpts and subtitles. The six
wireframe snapshots remain read-only, and the frozen wireframe UI is unchanged.
Unknown slugs, homepage highlight targets and empty or HTML excerpts fail validation.

To change a summary, edit this file and run the commands below. Stop the Nuxt dev
server before bulk regeneration and restart it afterward. The
current normalizer rewrites all content files, which can exhaust the development
content watcher's memory. The verification command uses isolated temporary files.

```sh
npm run data:normalise
node scripts/verify-insight-excerpts.mjs
```

The standalone verification uses temporary fixtures to check source precedence,
preservation of existing excerpts and unrelated output, unknown slugs, invalid
copy, highlight exclusion and byte-identical repeated normalization. It also checks
that the generated documents match the current inputs.

This pass filled 160 of 195 missing excerpts: all 9 active posts and 151 archived
posts. That gives all 98 active posts excerpts, and 319 of 354 posts overall.
The initial backfill preserved existing excerpts. The later card consistency pass
revised the seven short summaries described above. No live CMS records were changed.

Insight cards use a 200-character desktop display budget (up to five lines),
including the ellipsis, and stop at a whole word. Mobile retains its 140-character
budget. Complete shorter excerpts remain intact. This display
formatting lives in `src/utils/cardExcerpt.ts`; article introductions retain the
full normalized excerpt. Check its boundaries with:

```sh
node --import tsx --test scripts/verify-card-excerpt.mjs
```

## Remaining source gaps

These 35 archived posts need their original asset or additional copy before an
accurate excerpt can be written. Titles alone were not used to infer summaries.

| Canonical slug | Missing source |
| --- | --- |
| `12-days-of-christmas-in-europe` | No body text |
| `a-new-era-of-german-turkish-cooperation` | No body text |
| `austrian-elections-infographic` | No body text |
| `breaking-barriers` | No body text |
| `breaking-down-barriers` | No body text |
| `checkmate` | No body text |
| `democracys-canary-in-a-coal-mine` | Body contains only an image |
| `democracys-canary-in-a-coal-mine-infographic` | No body text |
| `east-west-divide-frankfurt-am-main` | No body text |
| `entrepreneurship-leipzig` | No body text |
| `europes-migration-muddle` | No body text |
| `fresco-or-fiasco` | No body text |
| `future-of-work-weinheim` | No body text |
| `germanys-newpolitik` | No body text |
| `greece-under-a-microscope` | No body text |
| `greek-debt-crisis-sisyphus-latest-challenge` | No body text |
| `greek-debt-crisis-will-the-last-domino-stand` | No body text |
| `health-care-on-life-support` | No body text |
| `major-european-migration-flows-from-the-1990s-to-present` | No body text |
| `migration-aachen` | No body text |
| `reassessing-us-and-eu-ties-with-china-in-the-post-covid-19-world` | No body text |
| `referendum-retrospective` | No body text |
| `russias-economy` | No body text |
| `social-inequity` | No body text |
| `something-to-snack-on` | No body text |
| `the-downing-of-turkish-russian-relations` | No body text |
| `the-economics-of-brexit` | No body text |
| `the-eus-arc-of-instability` | No body text |
| `the-long-road-to-rio` | No body text |
| `trade-beyond-the-tweet` | No body text |
| `trade-facts-and-figures` | No body text |
| `trans-atlantic-tweeting` | No body text |
| `trumps-teetering-trade-policy` | No body text |
| `trumps-twitter-diplomacy` | No body text |
| `when-piigs-fly-or-fall` | No body text |

## Project card framing

Six legacy project images contain a white browser mockup around their artwork.
`src/utils/projectCardCrop.ts` identifies those exact source URLs; `bfCardProject`
uses an SVG viewport to show only the inner artwork at the card's aspect ratio.
The source files and project-detail images remain intact. Matching by source URL
prevents a future CMS image replacement from inheriting an obsolete crop.

Indo-Pacific Nexus uses a 1280 × 720 browser capture of its public homepage,
recorded in `project-images.json`, following the HTFD card treatment.
