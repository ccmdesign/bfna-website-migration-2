# EPIC — Site completion: from bf-* templates to the production BFNA site

Input for lfg-ccm (BRIEF mode). Follows [`docs/ds-epic/BRIEF.md`](../ds-epic/BRIEF.md) (BF-217) and
inherits its ground rules verbatim (§5 there) unless a line below overrides one. Issue source:
[`docs/site-epic/issues.md`](./issues.md). Do not restate this brief in issue bodies; link it.

## 0. Where the site stands (2026-09-04, `origin/dev` @ `e065d29`, BF-217 complete)

Everything the wireframe specified is already on the bf-* system. This epic is not "rebuild more
pages"; it is "make the pages a website".

| Surface | State |
|---|---|
| `/`, `/{program}` ×3, `/insights`, `/insights/:slug` ×371, `/projects`, `/projects/:slug` ×38, `/about`, `/search`, `/archive`, 404 | **Built on bf-\***, layout `bf-default`, prerendering green (BF-217 #47–#56) |
| BF-217 | **All 59 issues merged.** #203 images bypass ipx; #66 redirect map as Netlify `_redirects` (437 assertions green); #67 legacy stack deleted; #68 prerender seeded from content (1607 routes), probe harness replaced by `scripts/check-routes.ts`, legacy search stack gone. DoD-1/3/4/5/6 pass; DoD-2 not zero |
| Data | Six frozen snapshots → normaliser → `content/bf/**` (433 docs). **Nothing reads Directus.** |
| Insight detail | One generic render for all formats: 193 article/report, 67 video, 55 infographic, 38 report, 17 null. `video_url` and `external_url` are never read; no embed, no infographic treatment |
| Project detail | Branches only on `external_url`; `kind` is a chip label. Episodes band unreachable (#193). Participation CTAs have no destination. Two microsite links are `#` anchors |
| Chrome | 5 placeholder links: Stiftung `#`, Transponder, Podcasts platform, Bluesky, Privacy Policy |
| Contact | `<form @submit.prevent>` with no handler; address is a literal placeholder string |
| SEO | `title` only. No meta description, no OG image, no sitemap, no robots, no favicon/manifest, no analytics (legacy had none either) |
| Search | Client-side lexical scoring over an in-memory pool, presented as semantic ranking (sanctioned by BF-217 D4) |
| 404 | `.output/public/404.html` is a client-rendered empty shell |
| Quality | 73 typecheck errors, 0 in bf scope (survivors: `components/ds`, layouts, composables); no CI; lockfile untracked; vitest dead; content-sync unguarded |
| Open client inputs | Program re-tag of 69 insights (Q3), 5 URLs, page copy, privacy policy, analytics, Programs/Projects labels |

Sources: gap audit of the ten templates vs specs 47–56, legacy inventory `docs/ds-epic/02-legacy-retirement-inventory.md`,
review BF-218, `_process/scoping/fronts/{01-backend,04-features-spec}.md`, `_process/scoping/schema-draft.md`.

## 1. Objective

Ship `/` as the production BFNA site: every real record renders correctly for its format and kind,
the site is indexable and shareable, content flows from Directus on publish instead of frozen
snapshots, the build is guarded by CI, and the old site's URLs land on the new pages. Design stays
deliberately unbranded (BF-217 D5); art direction is a later, separate epic.

## 2. Definition of done (EPIC)

| # | Gate | Check |
|---|---|---|
| DoD-1 | Prerenders | `cd bfna-website-nuxt && npx nuxt generate` exits 0 with the importer as the data source (`npm run generate`) |
| DoD-2 | Types clean | `npm run typecheck` exits 0 — **zero** errors, not "no new errors" (phase 13) |
| DoD-3 | Every format renders | For each `format` value and each project `kind`, at least one real route renders its dedicated band; asserted by `scripts/check-routes.ts` |
| DoD-4 | wf-\* byte-identical | Same command as BF-217 DoD-4 against `f757a649361993275a43282456f4746d247be37b`. Wireframes stay in the repo; they are excluded from the production output (phase 14) |
| DoD-5 | Indexable | Every prerendered public route has a non-empty `<meta name="description">`, an `og:image`, a canonical; `sitemap.xml` lists exactly the public routes; `/wireframes/**`, `/docs/**`, `/bf-probe/**` are absent from the production output |
| DoD-6 | No new colour | As BF-217 DoD-6 |
| DoD-7 | Live data | `scripts/import-bf.ts` against Directus reproduces `content/bf/**` with an empty `git diff` at seed time, and a Directus publish triggers a Netlify build |
| DoD-8 | No placeholders | `scripts/check-links.ts` finds zero `href="#…"`, zero `[placeholder…]` strings, zero `pending: true` menu items in `.output/public` |
| DoD-9 | CI | `.github/workflows/verify.yml` runs typecheck + generate + probes/routes + links on every PR to `dev` and is green |
| DoD-10 | Old URLs land | Every URL in the live old-site crawl (`_process/scoping/inventory/inventory.json`) returns 200, or 301 → 200, or a deliberate 410 listed in `02 §E` |

## 3. Repo and run configuration

Unchanged from BF-217 §3: repo `ccmdesign/bfna-website-migration-2`, app root `bfna-website-nuxt/`,
`BASE_BRANCH=dev`, `MERGE_POLICY=auto`, worktrees at `$WORKTREE_ROOT/gh<N>`, specs at
`docs/site-epic/issues/<NN>-<slug>.md`, sequential isolated runs, issue order = dependency order.
Numbering continues from BF-217 (first issue here is 60).

Gates per issue: `npm run typecheck` (no new errors until #83, zero after), `npx nuxt generate` exit 0,
`npx tsx scripts/check-routes.ts` (gh#68 replaces the probe harness with it; #60 extends it),
`npx tsx scripts/check-links.ts`. Install with `npm install` until #82 tracks the lockfile,
`npm ci` after.

## 4. Decisions of record (D11–D22)

| ID | Rule |
|---|---|
| D11 | **Canonical shape first, Directus second.** `content/bf/**` and its zod schemas are the contract. The new Directus collections are created to match it, seeded from it, and the importer must reproduce it byte-for-byte before the snapshots are retired. Nothing in the app changes shape to suit Directus. |
| D12 | **Images: no ipx, ever.** Directus assets render as plain `<img>` with `srcset`/`sizes` built from the Directus asset-transform query (`?width=…&format=webp&quality=…`) and explicit `width`/`height`. Local assets may still use `<NuxtImg>`. `check-routes.ts` fails on any `/_ipx/` in output. |
| D13 | **Format-driven rendering.** `insights/[slug].vue` branches on `format`: `video` → `bfEmbed`; `infographic` → full-width image + download; `report` → download CTA with file type; `article` → prose; any row with `external_url` → external CTA (`data-external`). `projects/[slug].vue` branches on `external_url` **and** `podcast` independently (fixes #193). `kind` gets a complete label table (#195). |
| D14 | **Pending is data, not markup.** A `MenuItem` / link with no real destination carries `pending: true`; production output omits it, dev/staging renders it with a "pending" chip. No `href="#…"` may reach `.output/public`. |
| D15 | **SEO is a per-template `useSeoMeta` call with data-derived fields**, defaults in the layout, one shared OG fallback image. Sitemap and robots via `@nuxtjs/sitemap` + `@nuxtjs/robots`. `/wireframes`, `/docs`, `/bf-probe` are `noindex` on non-production and absent from production. |
| D16 | **Contact form goes to Netlify Forms** (`data-netlify="true"`, honeypot), no server route. Address/email/phone come from a Directus `contact` singleton via the importer, until then from `content/bf/site/contact.json`. `server/api/contact.post.ts` is deleted. |
| D17 | **Search v1 is honest keyword search**: fuse.js over a build-time `public/search.json` (slug, heading, excerpt, program, project, format, archived). The relevance meter and "semantic" copy go. The RAG design in `04-features-spec.md` is phase 15, behind a Netlify function, and is optional for launch. |
| D18 | **Analytics is a decision, not a default.** No script ships until Claudio names the vendor; the hook is a single `useHead` script gated on `NUXT_PUBLIC_ANALYTICS_ID`. Prefer a consent-free vendor so no cookie banner is needed. |
| D19 | **Typecheck debt is paid inside this epic** (#83) so DoD-2 means zero. Until then the gate stays "no new errors". |
| D20 | **CI before live data.** The importer, the Directus seed and the Netlify build hook land only after `.github/workflows/verify.yml` is green on `dev`. |
| D21 | **Production output = public routes only.** `NUXT_SITE_ENV=production` drops `/wireframes/**`, `/docs/**`, `/bf-probe/**` from `nitro.prerender` and from the sitemap; `dev`/`staging` keep them. Wireframe source files remain untouched (DoD-4). |
| D22 | **Client inputs never block a phase.** Every issue that needs Irene's input ships the mechanical part behind `pending` data and records the wait in `docs/questions-irene.md`. |

## 5. Ground rules

BF-217 §5 applies in full (never touch wf-\*, no new colour, presentational-only, `--_bf-*` variables,
`@layer`, one component/template per issue, both gates before PR, specs in `docs/site-epic/issues/`,
WCAG 2.1 AA, real content, shared types in `bf-contracts.ts`). Additions:

- **Runners never write to Directus.** Issues that create collections or seed rows produce an idempotent script plus a dry-run report; Douglas runs it with the admin token (§8). The runner verifies against the read-only token only.
- **Secrets:** `DIRECTUS_READONLY_TOKEN`, `DIRECTUS_ADMIN_TOKEN`, `OPENAI_API_KEY`, `NETLIFY_AUTH_TOKEN` live in the environment; never in the repo, never in a spec, never echoed.
- **Every issue that adds a route, a meta tag, a link or an image adds one assertion to `check-routes.ts` or `check-links.ts`.** Gates only grow.
- **No new runtime dependency without naming the rung it beats** (ponytail ladder): `@nuxtjs/sitemap`, `@nuxtjs/robots`, `fuse.js`, `axe-core` are pre-approved here; anything else is a question in the spec.

## 6. Data contract changes

Collections stay six. Field additions, all emitted by the normaliser now and by the importer later:

| Collection | Field | Type | Why |
|---|---|---|---|
| bfInsights | `seo_description` | string | derived: excerpt → first 155 chars of body |
| bfInsights | `program_pending` | boolean | F3: true for `PENDING-Q3`/`RE-TAG` rows; `program` becomes one of three slugs or null |
| bfInsights | `download_type`, `download_size` | string \| null | report CTA label (#189) |
| bfProjects | `podcast.episodes[].url` | string \| null | Episodes band link-out per episode |
| bfProjects | `participation[].href` | string \| null | CTAs with destination; null → `pending` |
| bfProjects | `kind` | enum | closed list from `schema-draft.md` + `cohort`; label table in `format.ts` |
| bfPrograms | `seo_description`, `image` | string | hub meta + OG |
| bfPages | `body` | string | Irene's copy (currently every page body is empty) |
| menus.json | `pending` | boolean | D14 |
| `content/bf/site/contact.json` | new single doc | | D16; becomes the Directus `contact` singleton |
| `content/bf/site/search.json` → `public/search.json` | build artefact | | D17, generated, git-ignored |

## 7. Routes served at `/` after this epic

BF-217 §7 unchanged, plus `/privacy` (bfPages, when copy arrives), `/410` (retired-content page used by
the redirect map), `/sitemap.xml`, `/robots.txt`, `/search.json`. `/podcasts` stays 410. `/wireframes/**`
and `/docs/**` exist on dev/staging only.

## 8. Human / Plane tasks (NOT issues)

| Task | Owner | When |
|---|---|---|
| Decide Programs/Projects labels (questions-irene #1) — affects menus only | Irene | before #73 |
| Send: Transponder URL, podcast platform URL, Bluesky handle, Stiftung target, privacy-policy copy, contact address, page copy for home/about/stiftung, Q3 re-tag list for the 69 insights, careers page yes/no | Irene | rolling; tracked in `docs/questions-irene.md` |
| Name the analytics vendor (or none) | Claudio | before #72 |
| Decide `/docs` + `components/ds/**` fate: separate docs deploy or delete | Claudio | before #88 |
| Approve search v1 = keyword only for launch | Claudio | before #90 |
| Run the Directus schema migration and the seed with the admin token; review the dry-run report first | Douglas | #76, #77 |
| Production Netlify: env vars, build hook, domain, deploy contexts (`main` prod, `dev` bf-dev, `staging`) | Douglas + Claudio | #86 |
| Review checkpoint 3 — formats and variants on real records (after #65) | Aline + Claudio | after #65 merges |
| Review checkpoint 4 — pre-launch full crawl (after #89) | Aline + Claudio + Irene | after #89 |

## 9. Epic-closing verification

```bash
cd bfna-website-nuxt
npm ci                                   # lockfile tracked (#82)
npm run typecheck                        # DoD-2, zero errors
npm run generate                         # DoD-1, importer + nuxt generate, NUXT_SITE_ENV=production
npx tsx scripts/check-routes.ts          # DoD-3, DoD-5, D12
npx tsx scripts/check-links.ts           # DoD-8
npx tsx scripts/check-old-urls.ts        # DoD-10, against inventory.json
cd .. && git diff --stat f757a649361993275a43282456f4746d247be37b -- \
  bfna-website-nuxt/src/pages/wireframes bfna-website-nuxt/src/components/wireframe \
  bfna-website-nuxt/src/composables/useWfContent.ts bfna-website-nuxt/src/layouts/wireframe.vue \
  bfna-website-nuxt/public/css/wireframe.css bfna-website-nuxt/src/assets/wireframe-data   # DoD-4: empty
test ! -e bfna-website-nuxt/.output/public/wireframes                                      # D21
```

Plus DoD-9 (a green run of the workflow on the closing PR) and DoD-7 (one Directus publish → one Netlify build, logged).

## 10. Issue source

[`docs/site-epic/issues.md`](./issues.md) — 32 issues in eight phases (8 is the in-flight BF-217 tail,
listed for dependency only). Row order is execution order; no issue depends on a higher-numbered one.
