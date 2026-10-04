# Agent-readiness fixes — implementation plan

**Branch:** `agentic/composer-ce` · **Base:** `dev` · **Spec:** uploads/final-prompt.md · **Pitfalls:** uploads/known-pitfalls.md

## Product contract

| ID | Requirement | In scope |
|----|-------------|----------|
| R1 | `Accept: text/markdown` on `/` returns markdown + `Vary: Accept` | Yes |
| R2 | 404 + markdown body with links to `/`, `/sitemap.xml`, `/llms.txt` | Yes |
| R3 | `/sitemap.xml` from prerender routes, exclude docs/wireframes/search | Yes |
| R4 | `/llms.txt` + `/robots.txt` (production URLs, preview noindex) | Yes |
| R5 | Homepage Organization + WebSite JSON-LD; Article on insights | Yes |
| R6 | Site-wide canonical, og:image, og:type (+ description) | Yes |
| R7 | `/privacy` 500+ chars; footer link; legacy redirect | Yes |
| R8 | `When to use` section in llms.txt | Yes |
| R9 | Organization contactPoint + PostalAddress from site facts | Yes |
| R10 | API/MCP/OpenAPI findings | N/A (internal `/docs` only) |

## Decisions

- **D1 — Site URL:** `NUXT_PUBLIC_SITE_URL` default `https://www.bfna.org` for canonical, sitemap, JSON-LD, robots.
- **D2 — Markdown:** Netlify Edge Function + build-time `.md` twins under `.output/public` (not committed). No `fetch()` to self with markdown Accept (pitfall #1).
- **D3 — Accept parsing:** Split on commas, honor `q=0`; append `Vary: Accept` (pitfall #2).
- **D4 — Preview noindex:** `scripts/write-netlify-headers.ts` writes `public/_headers` when `CONTEXT !== production` (pitfall #3). Document in PR.
- **D5 — netlify.toml:** Single registration in repo root under `bfna-website-nuxt/`; base dir unchanged in Netlify UI.
- **D6 — Generated assets:** gitignore patterns for `*.md` twins in public output paths handled only in `.output/public` during CI generate (not committed).
- **D7 — Address:** `1108 16th Street NW, Floor 1, Washington, DC 20036` and `info@bfna.org` from deployed `/about` contact block (not invented).
- **D8 — Logo URL:** `https://www.bfna.org/images/hero/homepage.jpg` (existing hero asset).
- **D9 — Privacy:** Describe fonts (Google), contact form (no submit endpoint), external embeds where present; `TODO(owner):` only in PR body for legal retention/email — not visible on page.
- **D10 — 404 HTML:** Post-generate patch injects SSR-visible copy into `404.html` (Nuxt `noSSR` limitation per gh#65).

## Units

### U1. Site URL + SEO composable
- Files: `src/utils/site-url.ts`, `src/composables/useBfSiteSeo.ts`, `src/layouts/bf-default.vue`, `src/pages/index.vue`, `src/pages/insights/[slug].vue`, `src/nuxt.config.ts`
- Tests: default site URL; canonical builder

### U2. JSON-LD
- Files: `src/utils/json-ld.ts`, homepage + insight pages
- Tests: Organization includes address + contactPoint; WebSite present

### U3. Build assets (sitemap, robots, llms, markdown twins)
- Files: `scripts/generate-agent-assets.ts`, `scripts/html-to-markdown.ts`, `package.json` generate hook
- Tests: sitemap excludes `/docs`, lastmod from publish_date; llms includes "When to use"

### U4. Netlify edge + headers
- Files: `netlify/edge-functions/markdown.ts`, `netlify.toml`, `scripts/write-netlify-headers.ts`
- Tests: `accept.ts` unit tests

### U5. Privacy page + redirects + footer
- Files: `src/pages/privacy.vue`, `server/utils/legacy-redirect-rules.ts`, `src/components/bf/Footer.vue`, `src/nuxt.config.ts` prerender `/privacy`

### U6. 404 HTML patch
- Files: `scripts/patch-404-html.ts`
- Tests: patched file contains expected strings

## Verification

```bash
cd bfna-website-nuxt
npm ci
node ../.github/typecheck-gate.mjs
NUXT_PUBLIC_SITE_URL=https://www.bfna.org npx nuxt generate
npx tsx scripts/generate-agent-assets.ts
npx tsx scripts/patch-404-html.ts
npm run check:routes
npm run check:links
npm run redirects:check
npx vitest run
```

## Risks

- Typecheck baseline must not grow (pitfall #10).
- Avoid double `<NuxtLayout>` on privacy page (pitfall #9).
- Do not conflict with PR #295 404 title work — keep error.vue titles unchanged.

## Handoff

Execute with Composer only; review with ce-code-review personas; compound Netlify edge + static markdown lessons.
