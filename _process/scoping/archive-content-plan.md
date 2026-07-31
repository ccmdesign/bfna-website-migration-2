# Archived Content Plan

**Status: planning only.** Companion to [schema-draft.md](schema-draft.md).

## What GGS actually says (Site Flow + UX doc, §3 "Content Visibility Framework")

- **Tier 1**: Core content — active, recent
- **Tier 2**: Supporting content — searchable
- **Tier 3**: Archive — 3+ years old, exceptions apply
- Verbatim caveat: *"Archiving does not mean deleting the content off of the website. We still want this content to be accessible for AI search engine optimization."*

That's the entirety of their guidance — tiers, the 3-year line, exceptions exist, never delete, keep indexable. Everything below is our technical interpretation.

## Reality check (Directus, 2026-07-30)

| collection | older than 3y | total |
|---|---|---|
| publications | 128 | 185 |
| videos | 41 | 43 |
| infographics | 52 | 55 |
| products | 75 | 117 |
| **total** | **296 (74%)** | **400** |

Applying the rule as written archives **three quarters of the site**. The "active" site is ~104 items. This is probably what GGS intends (their diagnosis was "too much content surfaced equally; outdated content shown as current") — but Irene should see this number before we build it. → [questions-for-irene.md](questions-for-irene.md)

## Proposed behavior per tier

Tier is **computed** from `publish_date` at query time — no stored tier field, no migration of items "into" an archive. One stored exception flag: `evergreen`.

| | Tier 1 (recent/featured) | Tier 2 (supporting) | Tier 3 (archive, 3y+) |
|---|---|---|---|
| Focus-area hubs & homepage | ✅ featured | listed/paginated | ❌ |
| Insights listing | ✅ | ✅ | ❌ by default; "include archive" filter reveals |
| Archive index page | — | — | ✅ browsable, grouped by year |
| Site search | ✅ | ✅ | ✅ (labeled "Archive") |
| Direct URL | ✅ | ✅ | ✅ — URLs never break, page carries an "archived" notice banner |
| Sitemap + search-engine indexing | ✅ | ✅ | ✅ — **no noindex**, per GGS's AI-SEO requirement |
| schema.org markup | ✅ | ✅ | ✅ (with `datePublished` doing the freshness signaling) |

Tier 1 vs Tier 2 boundary: GGS doesn't define it. Simplest interpretation: Tier 1 = editorially `featured` items + N most recent; Tier 2 = everything else under 3y. <!-- ponytail: don't build a second date threshold; featured-flag + recency covers it -->

## What this replaces

- The `Archives` workstream row in Directus (manually curated fake category) — dropped; the archive becomes a computed view.
- `src/pages/archives/index.vue` (currently half-stubbed) — replaced by the archive index page above.

## Implementation notes (for the future build phase)

- The 3-year window moves daily; content demotes automatically as it ages. Static generation means the boundary is as fresh as the last build — fine at current publishing cadence (site rebuilds on content updates anyway).
- `evergreen: true` exempts an item from demotion (e.g. the About-adjacent explainers, flagship reports). Editorial decides; expected to be rare.
- Archived pages stay in the search index and sitemap; the search UI labels them.

## Open questions

Rolled into [questions-for-irene.md](questions-for-irene.md): the 74% number, who flags evergreen exceptions, and whether the archive index needs curation (e.g. "notable past work") or is purely chronological.
