# gh#66 — 57 Redirect map + legacy route retirement — plan

Spec: [`docs/ds-epic/issues/57-cutover-redirects.md`](../ds-epic/issues/57-cutover-redirects.md)
Inventory: [`docs/ds-epic/02-legacy-retirement-inventory.md`](../ds-epic/02-legacy-retirement-inventory.md) §E
Issue: https://github.com/ccmdesign/bfna-website-migration-2/issues/66
Residual folded in: https://github.com/ccmdesign/bfna-website-migration-2/issues/182

## Approach

One file owns request-time routing (`src/server/middleware/redirects.ts`), and one
generated file owns deploy-time routing (`public/_redirects`). Both are emitted
from the same source of truth so they cannot drift.

### Why two mechanisms

`nuxt generate` + Netlify is a **static** deploy: every prerendered path is a file
in `.output/public`, served by Netlify's CDN with no Nitro server in front of it.
Nuxt server middleware therefore does **not** run in production for those paths —
it runs in `nuxt dev`, during prerender, and on an SSR deploy only. A middleware-only
implementation would pass the spec's own `curl` acceptance against a dev server and
be dead on the deployed site.

Repo state checked before choosing: there is **no** `netlify.toml`, **no**
`public/_redirects`, and **no** `nitro.routeRules` anywhere (02 §D confirms:
`.netlify/netlify.toml` is a local, auto-generated, empty CLI state file — not a
routing config). So neither mechanism "already exists"; `_redirects` is the choice
because it is the only one of the three that survives the static preset without
turning the site into an SSR deploy.

Netlify applies `_redirects` **after** static files unless a rule is forced, and
issue #58 (not this issue) is what deletes `pages/team.vue`, `pages/updates.vue`,
`pages/blog/`, `pages/podcasts/`, `pages/archives/`, `pages/test*.vue`. Until then
those paths still prerender to real files, so every generated rule is written
forced (`301!` / `410!`) to match middleware behaviour exactly.

### Precedence order (identical in both artefacts)

1. `/docs`, `/docs/*` — explicit no-op, returns before anything else (02 §E).
2. Exact 410 rules.
3. Exact 301 rules.
4. Prefix (splat) 301 families.
5. One-segment legacy slug map → `/insights/:slug` or `/projects/:slug`.
6. Fall through untouched.

### The `/:slug*` bucket map

02 §E resolves a bare slug "the same way the legacy `pages/[...slug].vue` branch
resolution does today" — try super-product/product, then publication/video/
infographic. That resolution is a runtime `queryCollection` chain and must not be
reintroduced in middleware. The equivalent answer already exists statically:
issue #151 carried each legacy record's identity onto the `bf-*` document as
`legacy` (`source`, `type`, `workstream`, `product_type`, `id`) and `aka` (the
extra legacy slugs a project absorbed). The bucket a slug belongs to is therefore
just *which `content/bf/**` directory holds it*:

- `content/bf/insights/<slug>.json` → `/insights/<slug>` (371 docs; `legacy.type`
  ∈ publications, publication, videos, infographics, highlights, products, news)
- `content/bf/projects/<slug>.json` → `/projects/<slug>` (38 docs)
- each `aka[].slug` on a project → `/projects/<parent slug>` (7 absorbed slugs,
  e.g. `2022-participants` → `/projects/class-of-2022`)

Measured: no slug appears in two buckets; the only collision with a reserved route
is `democracy` (an insight whose slug equals a program hub slug) — the hub wins,
the insight stays reachable at `/insights/democracy`.

`import.meta.glob` (the pattern `src/utils/bf-programs.ts` uses) is a **Vite**
transform and Nitro bundles `server/**` with rollup, so it is unavailable here.
The map is generated instead: `scripts/generate-legacy-redirects.ts` writes a plain
`Record<string, string>` to `src/server/utils/legacy-slug-map.ts`, statically
imported by the middleware — no runtime file read, no content-layer call, and the
same script emits `public/_redirects` from the same table. `--check` re-derives and
diffs, so staleness is detectable.

## Rows implemented

Every row of spec 57's §E table, plus the three surfaced by residual #182
(`pages/[program].vue`'s `validate` now 404s hollow one-segment legacy paths):

| Route | Result | Source |
|---|---|---|
| `/team` | 301 `/about#team` | 57 §E |
| `/politics-society` | 301 `/transatlantic-relations-global-challenges` | 57 §E |
| `/digital-world` | 301 `/` | 57 §E |
| `/updates` | 301 `/insights` | 57 §E |
| `/blog` | 301 `/insights` | 57 §E (02 §E target, not 410) |
| `/podcasts` | 410 | 57 §E |
| `/podcasts/*` | 301 `/projects/:splat` | 57 §E |
| `/archives` | 301 `/archive` | 57 §E |
| `/test`, `/test-base-layout` | 410 | 57 §E |
| `/digital-economy`, `/digital-economy/*` | 301 `/transatlantic-relations-global-challenges[/:splat]` | 57 §E re-point |
| `/future-of-work`, `/future-of-work/*` | 301 `/future-leadership[/:splat]` | 57 §E re-point |
| `/people` | 301 `/about#team` | #182 |
| `/bertelsmann-stiftung` | 301 `/about` | #182 |
| `/careers` | 410 | #182 (evidence below) |
| ~416 one-segment content slugs | 301 `/insights/:slug` or `/projects/:slug` | 57 §E catch-all branch |
| `/docs`, `/docs/*` | unchanged | 57 §E |

`/careers` evidence: `grep -rni careers` over the whole repo (excluding
`node_modules`) returns no page file, no nav entry, no menus row and no content
document — only the word inside four insight bodies, a comment in
`pages/[program].vue`, and sample data in `pages/bf-probe/36-bf-footer.vue`.
Nothing authored ⇒ 410, per the issue's own instruction.
`/bertelsmann-stiftung` evidence: `components/legacy/organisms/MainNav.vue:121`
links it, 02 §A records it as a catch-all-resolved nav entry with no page file, and
its content now renders on `/about` via `useBfPages().stiftungPage` — hence `/about`.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/scripts/generate-legacy-redirects.ts` | new — generator + `--check` |
| `bfna-website-nuxt/server/utils/legacy-slug-map.ts` | new, generated — slug → target |
| `bfna-website-nuxt/server/middleware/redirects.ts` | rewritten, same `defineEventHandler` shape. **Correction during implementation:** the spec's `src/server/middleware/redirects.ts` is dead code under Nuxt 4's `serverDir` — see D-57.10 |
| `bfna-website-nuxt/public/_redirects` | new, generated — Netlify static rules |
| `bfna-website-nuxt/package.json` | new script `redirects:generate` / `redirects:check` |
| `docs/ds-epic/02-legacy-retirement-inventory.md` | §E table gains the three #182 rows |
| `docs/ds-epic/issues/57-cutover-redirects.md` | Decisions section appended |

No page or component is deleted (that is #58). Nothing under `pages/wireframes/**`,
`components/wireframe/**`, `layouts/wireframe.vue`, `public/css/wireframe.css`.

## Test strategy

- **Middleware (dev server)**: `nuxt dev`, then `curl -sI` every row and assert
  status + `location`. Tabled in the issue journal.
- **Static (`_redirects`)**: assert the generated file's content row-by-row with the
  same table, and assert `.output/public/_redirects` exists after `nuxt generate`.
- **Drift**: `npm run redirects:check` re-derives both artefacts and diffs.
- `/docs` returns 200 with no `location` header.
- Gates: typecheck ≤ 176 errors and 0 in `src/(components/bf|types|composables/bf)`
  or `content.config`; `npx nuxt generate` exit 0; `npx tsx scripts/check-probes.ts`
  exit 0; wireframe-source diff empty.

## Risks

1. **Prerender interaction** — server middleware runs during prerender, so
   `/team`, `/updates`, `/blog`, `/podcasts`, `/archives`, `/test*` now answer 3xx/410
   to the crawler instead of rendering. `failOnError: false` is already set; verify
   `nuxt generate` still exits 0 and that no *kept* route disappears from
   `.output/public`. Mitigation if it bites: those page files are #58's to delete.
2. **Over-broad slug capture** — the map is a closed set of known content slugs and
   an unknown one-segment path falls through untouched, so `/foo` still reaches the
   404. Reserved names (program slugs, real routes, every explicit rule above,
   anything with a dot or a leading `_`) are excluded at generation *and* guarded in
   the middleware.
3. **Generated-artefact drift** — mitigated by `--check`; not wired into CI because
   this repo has no CI workflows.
4. **`/digital-economy/<splat>` lands on a non-existent two-segment program path**
   — spec-mandated (preserve the splat), and `pages/[program].vue` is one segment
   only, so those sub-paths 404 after the redirect. Recorded as a residual rather
   than silently deviating from 57 §E.
