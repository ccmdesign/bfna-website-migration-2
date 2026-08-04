# Front 4 spec — Functional Features

**Status: specify phase.** Companion to [04-features.md](04-features.md). Sections land here as they're decided. Search is decided (2026-07-31); other sections follow.

## Search — semantic (RAG-style) in-app, keyword fallback

**Decision**: reuse the HTFD RAG *pattern* (build-time embeddings → vector similarity endpoint), not its implementation. Everything lives inside the Nuxt app — no standalone service, no vector DB.

### Lineage

- `ccmdesign/htfd-search-api-v1` (live at htfd.ccmdesign.ca) — ~180 lines: LangChain + OpenAI embeddings + FAISS on disk, standalone Node server. Proven pattern; not liftable as-is (no metadata filtering, metadata regex-stuffed into embedded text, per-line embeddings suited to transcripts).
- `ccmdesign/bfna-search-api` — the old site's search: fuse.js keyword over Contentful. Confirms the keyword-index baseline already existed for BFNA.
- Both cloned locally under `ccm-clients/bfna/` for reference.

### Architecture

**Index (build time, in the importer pipeline):**
1. For each insight: chunk title + summary + body (~500-token chunks, title/summary always in chunk 1).
2. Embed chunks via OpenAI `text-embedding-3-small`. Whole corpus (~400 items ≈ 2–3k chunks) costs pennies; rebuilt on every content build, same cadence as everything else. Cache by content hash to skip unchanged items.
3. Write `search-index.json`: per chunk — vector + metadata `{ slug, title, summary, programs[], projects[], format, tier, publishDate }`. Tier is stamped here from `publish_date` + `evergreen` (see tiers section, TBD).

**Query (Nitro server route `GET /api/search`):**
1. Embed the query string (one OpenAI call).
2. Brute-force cosine similarity over the index in plain JS — milliseconds at this scale. <!-- ponytail: no FAISS/vector DB; revisit if corpus grows ~10x -->
3. Filter by facet params (`program`, `project`, `format`, `includeArchive`) with a plain array filter; dedupe chunks to one result per document (best-scoring chunk wins).
4. Return results with tier attached; UI labels Tier 3 results "Archive".

Server routes already work on this deploy target (`src/server/middleware/redirects.ts` precedent). `OPENAI_API_KEY` is the only new env var.

**Fallback (client, baseline):** static fuse.js keyword index over the same metadata — instant, free, works if the endpoint is down or the key is missing. Mirrors HTFD's graceful-degrade-to-empty, but degrades to keyword results instead of nothing.

### Explicitly out of v1

- **LLM answer synthesis / "ask BFNA" box** — retrieval only. AI citability is covered by schema.org + open indexing; an answer box is a separate product decision with editorial risk.
- **HTFD's per-result LLM summarizer** — slow/costly at query time; insights have real titles and summaries, unlike raw transcripts.
- **FAISS / vector DB / standalone service** — unjustified at 400 items.

### Open questions

- Tier labels in results depend on archive policy sign-off (Q8/Q9 — PENDING).
- Embedding model pinned to `text-embedding-3-small` unless testing shows otherwise; changing models means full reindex (cheap).

---

*Other sections (schema.org, tiers, newsletter, technical SEO, a11y CI) — TBD, pending discussion + Claudio's answers doc.*
