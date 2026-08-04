# BF-148 — Search wireframe: semantic search pattern

## Decision (Aug 4)
Implement a SEMANTIC/vector search PATTERN (Irene liked How To Fix Democracy's semantic
search). Granular country/topic tagging is unnecessary. WIREFRAME ONLY — real vector
search is Front 4. Relevance is simulated/mocked over the live dataset.

## Current state
`src/pages/wireframes/search.vue` does a live case-insensitive substring match over a
cross-type pool (insights + projects + people) from the consolidated wireframe dataset.
No facets. No relevance framing. Seed annotation lives in `wfFeedbackSeed.ts` (line ~104).

## Changes
1. **Single prominent NL search box** in the hero — larger input, natural-language
   placeholder ("Ask anything…"), semantic framing copy.
2. **Semantic results list ranked by relevance** — replace the plain `filter(includes)`
   with a scored rank: full-phrase + per-term hits, heading weighted above body. Sort
   descending by score; keep only score > 0 (still "searches real dataset records").
   Show a lo-fi relevance meter + rank so the ordering reads as relevance, not substring.
3. **Facets: program + format only.** Add facet chips (no granular tag/country/topic UI
   exists to remove, and none is added). Program values from `programs()` taxonomy;
   format from the FORMATS list (insight `format` field). Local reactive toggles.
4. **Archive labels inline** — keep/extend the existing `r.archived` → "Archive" chip on
   each result row (dataset `archived` flag; reuses the feed/archive concept).
5. **Honest wireframe note** — `[semantic ranking simulated — real vector search is
   Front 4]` `wf-note` above results.
6. Update the search **seed annotation** in `wfFeedbackSeed.ts` to describe the semantic
   pattern instead of the old substring framing.

## Constraints
- Wireframe only; no real embeddings. No `npm run generate`/`build`.
- Never fabricate data — pool stays sourced from `useWfContent()`.
- Match wf* component + wireframe.css conventions (wf-section, wf-chip, wf-note).

## Verification
- Self-review diff against the checklist; typecheck if quick. Browser test deferred to
  orchestrator's consolidated pass.
