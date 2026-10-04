# Compound: Netlify markdown edge + static twins

See `docs/solutions/build/netlify-markdown-edge-and-static-twins.md` content (repo `docs/solutions/` is gitignored).

**Lesson:** Pre-generate `.md` twins at build end; edge `rewrite` to `.md` paths; never `fetch()` self with markdown Accept (508 loop). Append `Vary: Accept`. Preview noindex via generated `public/_headers`, not per-context `netlify.toml` headers.
