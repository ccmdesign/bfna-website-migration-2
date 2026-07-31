# Front 4 — Functional Features

Read `00-shared-context.md` first. **Phase: discuss + specify.** Full list in `../features.md`; this front owns the functional/technical ones.

## Scope

- **AI searchability (headline)**: schema.org structured data on all content types (organization, article, report, video, event); machine-readable taxonomy relationships (insight → focus area → program); standardized page structures; archive stays fully indexed/citable.
- **Visibility tiers**: computed at build/query time — recent featured, 3+ years auto-demotes to archive; archived keeps URL, searchable (labeled), in sitemap, no noindex. 74% of current content (296/400) lands in archive on day one.
- **Search**: upgraded site search over all content types, tier-aware, filters by focus area / program / format (rides on Front 1's tagging).
- **Newsletter**: real Mailchimp-backed signup form (today only an external link).
- **Technical SEO**: sitemap (none exists today), consistent per-page meta, canonical URLs, redirect map for renamed/retired routes (politics-society, digital-world, archives) — precedent in `src/server/middleware/redirects.ts`.
- **A11y in CI**: linting/checks so accessibility fixes stay fixed (shared with Front 3).

## Open questions affecting this front

- Q8/Q9: archive policy sign-off + who flags `evergreen` exceptions → tier logic.
- Q10: archive page chronological vs curated → build target.
- Q13: Mailchimp stays as subscribe backend? (Assume yes.)
- Contradiction #1: confirm nothing is ever deleted — tier logic assumes archive-only.
- Search implementation choice is OURS to make (client-side index vs server endpoint) — GGS gave no spec. Content is build-time JSON, so a static index is the lazy default; validate at ~400+ items.

## Dependencies

- Hard dependency on Front 1 (tags/tiers/relations are the data for schema.org, search, and tiers). UI slots come from Fronts 2–3.
- Waits on: Claudio's answers doc.
