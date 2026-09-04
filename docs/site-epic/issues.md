# Issue index — site completion (`/` → production)

Ordered, dependency-aware. **Row order is execution order**; `depends-on` is the `Blocked-by` map.
Brief: [`docs/site-epic/BRIEF.md`](./BRIEF.md). Per-issue specs go to `docs/site-epic/issues/<NN>-<slug>.md`.
Paths are relative to `bfna-website-nuxt/` unless prefixed with `docs/` or `_process/`. `gh#` = existing
GitHub issue folded in (close it when the row merges). Every issue additionally passes the gates in brief §3;
the `verify` column names the issue-specific check on top of that.

---

## Index

| # | slug | title | type | depends-on | builds-from | folds | verify |
|---|---|---|---|---|---|---|---|
| **Phase 8 — BF-217 tail (all merged; listed for dependency only)** |
| — | `gh#203` | bfMedia: absolute src as plain `<img>` | fix | — | `components/bf/Media.vue` | — | PR #204 |
| — | `gh#66` | Redirect map + `_redirects` | cutover | — | `server/middleware/redirects.ts` | gh#182 | 02 §E rows resolve |
| — | `gh#67` | Delete legacy stack | cutover | 66 | `components/legacy/**` | — | `components/legacy/` gone |
| — | `gh#68` | Config touchpoints + DoD run | cutover | 67 | `nuxt.config.ts` | gh#114 gh#129 gh#194 gh#100 gh#104 gh#210 gh#211 gh#212 | PR #213, DoD-1…6 |
| **Phase 9 — Render every real record** |
| 60 | `check-routes` | Extend `scripts/check-routes.ts` (created in gh#68 from the probe smoke): crawl **every** route in `.output/public`, per-route invariants (one h1, no `/_ipx/` that is not a file on disk, no console errors, meta present, nav reachability), JSON report | tooling | 68 | `scripts/check-routes.ts` | gh#214 gh#132 | script fails on a planted defect, passes on dev |
| 61 | `bf-embed` | `bfEmbed`: YouTube/Vimeo URL → privacy-enhanced 16/9 iframe, `title` required, `loading="lazy"`, no cookies until click (facade with poster from `image`) | atom | 60 | new; `useVideo`/`videoURL()` in `src/directus/common.js` for URL parsing | — | probe/route renders both providers; bad URL → `bfMedia` fallback |
| 62 | `insight-formats` | `insights/[slug].vue` branches on `format` (D13): video → `bfEmbed`; infographic → full-width image + download; report → download CTA with type/size; article → prose; `external_url` → external CTA | template | 61 | `insights/[slug].vue:234-259` | gh#189 | 5 real slugs (one per format + external) render their band; `check-routes` asserts |
| 63 | `project-variants` | `projects/[slug].vue` branches on `external_url` and `podcast` independently; Episodes band reachable with per-episode link-outs; participation CTAs get `href` or `pending`; `kind` label table complete; orphaned `parent_project` gets a backlink or is unparented in the normaliser | template | 60 | `projects/[slug].vue:27-69,180-186,323-338` | gh#193 gh#195 BF-218 F4 | indo-pacific-nexus shows Episodes + microsite CTA; cepi-2010 reachable from a listing |
| 64 | `prose-hardening` | `bfProse` against all 371 real bodies: script renders each body, diffs text content vs source HTML; fix nested lists, tables, inline Directus images, iframes → `bfEmbed` | organism | 61 | `components/bf/Prose.vue` | gh#176 | `scripts/check-prose.ts`: 0 bodies lose text; 0 raw `<iframe>` in output |
| 65 | `program-retag-data` | Normaliser: `program` ∈ {3 slugs, null}; `program_pending: true` for the 69 `PENDING-Q3`/`RE-TAG` rows; a `data/retag-map.json` applied when Irene answers Q3; hubs/facets never see free text | data | 60 | `scripts/normalise-wireframe-data.ts` | BF-218 F3, gh#81 (`team` flag) | probe: distinct `program` values = 3 + null; pending count = 69 until the map lands |
| 66 | `template-residuals` | One sweep: empty `<h1>` (gh#166), `bfCardRow` padding (gh#142), bare em dash (gh#135), empty-grid heading (gh#191), notice announcement (gh#169), form CSS (gh#155 gh#157), search-row type (gh#172) | fix | 63 | the residual issues | gh#166 gh#142 gh#135 gh#191 gh#169 gh#155 gh#157 gh#172 gh#120 | each residual's own repro line is green |
| **Phase 10 — Site plumbing** |
| 67 | `seo-meta` | `useSeoMeta` per template (title, description, og:title/description/image, canonical, twitter card); layout defaults; one shared OG fallback in `public/og-default.jpg`; normaliser emits `seo_description` (brief §6) | template | 62 | every `pages/**.vue` `useHead` | — | `check-routes`: 100% of public routes have description + og:image + canonical |
| 68 | `sitemap-robots` | `@nuxtjs/sitemap` + `@nuxtjs/robots`; `NUXT_SITE_ENV` drives `noindex` on `/wireframes`, `/docs`, `/bf-probe` and their exclusion from the sitemap (D15, D21) | config | 67 | `nuxt.config.ts` | — | `sitemap.xml` route count = public prerender count; `robots.txt` present |
| 69 | `favicon-manifest` | Favicon set (svg + png + apple-touch), `site.webmanifest`, `theme-color` from an existing token; from the `bfLogo` mark | asset | 60 | `components/bf/Logo.vue` | — | Lighthouse "installable" + no 404 in `check-routes` for icon links |
| 70 | `responsive-images` | `bfMedia`: Directus src → `srcset`/`sizes` via `?width=&format=webp&quality=`, explicit `width`/`height` from a Directus `files` lookup emitted by the normaliser; hero and card `sizes` presets (D12) | atom | 60 | `components/bf/Media.vue` (post gh#203) | — | CLS 0 on `/` and `/about` in Lighthouse; every `<img>` has width/height |
| 71 | `error-pages` | Prerender `404.html` with full chrome (SSR, not shell); add the `/410` page the four `410!` rows in `_redirects` already target (missing today, so `/podcasts`, `/careers`, `/test*` serve 404 on bf-dev) | template | 60 | `src/error.vue`, `nuxt.config.ts` | — | `curl /nope` → 404 with nav/footer in body; `/podcasts` → 410 page |
| 72 | `contact-netlify-forms` | `bfContactSection` posts to Netlify Forms (`data-netlify`, honeypot, success route `/contact/thanks`); address/email from `content/bf/site/contact.json`; delete `server/api/contact.post.ts` (D16) | organism | 60 | `components/bf/ContactSection.vue:94-176` | — | form has `name` + hidden `form-name`; no placeholder string in output |
| 73 | `analytics-hook` | Single `useHead` script gated on `NUXT_PUBLIC_ANALYTICS_ID` + vendor from `NUXT_PUBLIC_ANALYTICS_VENDOR` (plausible \| ga4); nothing rendered when unset (D18) | config | 60 | `layouts/bf-default.vue` | — | unset → no script tag; set → exactly one |
| **Phase 11 — Chrome and copy (client inputs, mechanical parts now)** |
| 74 | `pending-links` | `MenuItem.pending`; normaliser marks the 5 placeholders; production omits, dev shows chip; `check-links.ts` asserts zero `href="#…"` in output; Privacy Policy link appears only when `/privacy` exists (D14) | data | 60 | `src/assets/bf-data/menus.json`, `components/bf/Footer.vue:109-218` | gh#160 gh#82 | `check-links` green on production output; 5 pending in dev |
| 75 | `page-copy` | `bfPages.body` populated from Irene's docx (`copy_source` kept); `/privacy` route from bfPages; `[placeholder…]` strings become `pending` data | data | 74 | `content/bf/pages/*.json` (all bodies empty today) | — | `check-links`: zero `[placeholder` in output |
| 76 | `route-decisions` | Land the folded calls from gh#66: `/people` → `/about#team`, `/bertelsmann-stiftung` → `/about`, `/careers` (page or 410 per Irene), announcement URL points at the new site | cutover | 74 | `server/middleware/redirects.ts`, `content/bf/announcements` | — | each route resolves as decided; announcement href internal |
| **Phase 12 — Live data: Directus → `content/bf`** |
| 77 | `directus-schema-script` | `scripts/directus-migrate.ts`: idempotently creates `programs`, `projects`, `insights`, `contact` per `schema-draft.md` **matching the bf zod shapes** (D11); `--dry-run` prints the plan; Douglas runs it (brief §8) | backend | 65 | `_process/scoping/schema-draft.md`, `content.config.ts` | — | dry-run plan reviewed; read-only token confirms fields after Douglas runs it |
| 78 | `directus-seed-script` | `scripts/directus-seed.ts`: pushes `content/bf/**` into the new collections (legacy ids kept via `legacy.{source,id}`), re-uploads the 11 ctfassets.net images to Directus; `--dry-run`; Douglas runs it | backend | 77 | `content/bf/**`, `src/directus/*.js` upload helpers | — | row counts 371/38/3/13/7/1 match; 0 `ctfassets.net` URLs remain |
| 79 | `import-bf` | `scripts/import-bf.ts`: reads the new collections with `DIRECTUS_READONLY_TOKEN`, writes `content/bf/**` through the same zod schemas; `npm run generate` = `import-bf && nuxt generate` (D11) | data | 78 | `scripts/normalise-wireframe-data.ts` (retire), `contentImporter.js` (keep for `/docs` only) | gh#83 | `git diff --stat content/bf` empty after a fresh import at seed time |
| 80 | `content-sync-guard` | `npm run data:check`: import into a temp dir, diff against `content/bf`, non-zero on drift; wired into `build`; snapshots under `assets/wireframe-data` become read-only fixtures for the wireframe layer only | tooling | 79 | `scripts/import-bf.ts` | gh#83 | planted edit to a bf doc fails the check |
| 81 | `publish-hook` | Directus Flow "on publish" → Netlify build hook (dev context); documented in `docs/site-epic/ops.md`; Contentful dependency and creds removed from `package.json`/env | ops | 79 | `.netlify/`, `package.json` | gh#72 | one test publish → one build in the Netlify log; `contentful` absent from deps |
| **Phase 13 — Quality gates** |
| 82 | `ci-workflow` | Track `package-lock.json`; `.github/workflows/verify.yml` on PR→dev: `npm ci`, typecheck, `npx nuxt generate` (snapshot mode, no secrets), `check-routes`, `check-links`; delete the dead vitest config or make it run (D20) | ci | 60 | none (`.github/` does not exist) | gh#70 gh#86 gh#72 | workflow green on a no-op PR, red on a planted typecheck error |
| 83 | `typecheck-zero` | Pay the 73 surviving errors (`components/ds`, `layouts`, `composables`; 0 in bf scope); flip the gate to `exits 0` (D19) | fix | 82 | `npm run typecheck` output | gh#71 | `npm run typecheck` exits 0; workflow enforces it |
| 84 | `a11y-automated` | `scripts/check-a11y.ts`: axe-core over every public route in `.output/public` (jsdom), fail on serious/critical; fold the GGS audit digest items | tooling | 82 | `_process/scoping/ggs-reports/accessibility-audit-digest.md` | — | 0 serious/critical on all routes; in CI |
| 85 | `perf-budget` | Lighthouse CI on `/`, a hub, an insight, a project, `/about`: LCP ≤ 2.5 s, CLS ≤ 0.1, no render-blocking legacy CSS | tooling | 70 | `check-routes` | — | budgets pass in CI on the dev deploy |
| **Phase 14 — Production cutover** |
| 86 | `netlify-production` | `netlify.toml`: build = `npm run generate`, publish `.output/public`, `_redirects` from gh#66, headers (cache, `X-Robots-Tag` on non-prod), contexts `main`=production / `dev`=bf-dev / `staging`; env var list in `ops.md` (values set by Douglas) | ops | 81 | `.netlify/`, gh#66 output | — | `netlify deploy --build` from a clean clone succeeds in all three contexts |
| 87 | `production-output` | `NUXT_SITE_ENV=production` excludes `/wireframes/**`, `/docs/**`, `/bf-probe/**` from prerender and sitemap; source untouched (D21, DoD-4) | config | 68 | `nuxt.config.ts` | — | production build has no `/wireframes` dir; dev build still does |
| 88 | `docs-stack-decision` | Per Claudio's call: move `/docs` + `components/ds/**` + `server/api/component-docs` to their own deploy, or delete them; `contentImporter.js` retired either way | cutover | 87 | gh#67 leftovers | — | production tree has no `components/ds`; decision recorded in spec |
| 89 | `launch-checklist` | `scripts/check-old-urls.ts` against the old-site crawl (`_process/scoping/inventory/inventory.json`): each URL → 200 / 301→200 / listed 410; DNS + domain plan, deploy pin for rollback, uptime check, Search Console submit; checkpoint-4 review ticket | ops | 86, 88 | `02-legacy-retirement-inventory.md` §E | — | 0 unlisted 404s on the full old-URL list |
| **Phase 15 — Search (keyword for launch, semantic optional)** |
| 90 | `search-keyword` | Build-time `public/search.json` from the importer; `search.vue` uses fuse.js with facets; drop the simulated relevance meter and "semantic" copy (D17) | template | 79 | `pages/search.vue:60-63,287-308` | — | query "barometer" returns the Barometer project first; index size < 300 KB |
| 91 | `search-semantic` | `04-features-spec.md` RAG design as a Netlify function: build-time embeddings (`text-embedding-3-small`, content-hash cache), cosine over JSON, keyword fallback from #90; `OPENAI_API_KEY` only new env | feature | 90, 86 | `_process/scoping/fronts/04-features-spec.md` | — | endpoint returns ranked results; missing key → keyword fallback, no error |

---

## Not in this epic

- **Art direction / branding.** BF-217 D5 stands: unbranded, tokens only. A visual-design epic follows with Aline once the site is live on real data.
- **Directus editorial UX** (roles, permissions, editor training) beyond what the seed needs — Douglas/backend front.
- **Newsletter.** Removed on Irene's word (Aug 5); nothing to build.
- **i18n, cookie banner, comments, share widgets, prev/next on insights** — never requested; add when asked.

## Open client inputs this epic waits on (mirrors `docs/questions-irene.md`)

| Input | Unblocks |
|---|---|
| Q3 re-tag list for 69 insights (Digital World / Podcasts / Archives) | #65 map, hubs complete |
| Transponder URL, podcast platform URL, Bluesky handle, Stiftung target | #74 pending → live |
| Page copy (home, about, stiftung), privacy policy, contact address, careers yes/no | #75, #76 |
| Programs/Projects labels | #74 menus |
| Analytics vendor | #73 |
