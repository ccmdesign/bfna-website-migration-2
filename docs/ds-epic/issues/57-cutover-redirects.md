# 57 — cutover-redirects — Redirect map + legacy route retirement

One-line objective: implement the full redirect map from
`docs/ds-epic/02-legacy-retirement-inventory.md` §E in
`src/server/middleware/redirects.ts`, re-pointing the two existing 301
families at the new program slugs.

## Context

Depends on #47–#56 (every template must exist and prerender before its
target is a valid redirect destination). Builds from
`src/server/middleware/redirects.ts` (existing file, 22 lines today —
`git blame`-visible content quoted below) per `02-legacy-retirement-inventory.md`
§D/§E. Provenance: 02 §D, §E. **Deletes no page or component** — that is
#58's job; this issue only adds/edits middleware.

## Scope

- Edit `src/server/middleware/redirects.ts` (currently: two `if
  (url.startsWith('/digital-economy/'))` / `/future-of-work/'` 301 blocks
  plus two exact-match blocks, all targeting `/digital-world`/
  `/future-leadership` — **re-point these four blocks** at the final
  `bf-*` program slugs: `democracy`, `transatlantic-relations-global-challenges`,
  `future-leadership` (BRIEF §4, final — no confirmation step remains).
- Add every row of the redirect plan, `02-legacy-retirement-inventory.md`
  §E, verbatim:

| Legacy route | Target | Status | Note |
|---|---|---|---|
| `/` | `/` | n/a | already direct, no middleware needed |
| `/about` | `/about` | n/a | already direct |
| `/team` | `/about#team` | 301 | also covers `/team` → `#board` intent; single target per 02 §E |
| `/democracy`, `/future-leadership` | same slugs | n/a | already direct, served by `[program].vue` (#48) |
| `/politics-society` | `/transatlantic-relations-global-challenges` | 301 | programme renamed 31 Jul 2026 |
| `/digital-world` | `/` | 301 | programme dropped; its insights remain reachable via `/insights` |
| `/updates` | `/insights` | 301 | rename |
| `/blog` | `/insights` | 301 | tentative per 02 §E — zero authored content today, but 02 §E specifies this target, not 410; follow 02, don't invent |
| `/podcasts` | 410 | 410 | no standalone index in the wireframe set |
| `/podcasts/:slug` | `/projects/:slug` | 301 | preserve `:slug` |
| `/:slug*` (product/publication/video/infographic branch) | `/projects/:slug` or `/insights/:slug` | 301 | branches per 02 §E — product/super-product → `/projects/:slug`; publication/video/infographic → `/insights/:slug`; resolve which bucket a given slug is in the same way the legacy `pages/[...slug].vue` branch-resolution does today (it tries `useSuperProduct/useProduct/usePublication/useVideo/useInfographic` in order) |
| `/archives` | `/archive` | 301 | rename, singular; source route already unreachable from nav today |
| `/search` | `/search` | n/a | already direct |
| `/docs`, `/docs/*` | unchanged | — | **explicitly no redirect** — out of scope for the flip |
| `/test`, `/test-base-layout` | 410 | 410 | dev scaffolding |
| `/digital-economy/*` | `/transatlantic-relations-global-challenges/*` | 301 | re-point, don't remove — see above |
| `/future-of-work/*` | `/future-leadership/*` | 301 | re-point, don't remove — see above |

- Implementation pattern: extend the existing `defineEventHandler`
  middleware (do not create a second middleware file — one file, one
  precedence order) with `sendRedirect(event, target, 301)` per rule above,
  and `event.node.res.statusCode = 410; return` (no body) for the two 410
  rules — same shape the file already uses for the two live 301 families.

## Out of scope

- No edits under `pages/wireframes/**` or `components/wireframe/**` — fails the epic.
- Deleting any page or component file (#58's job — this issue is
  middleware-only).
- `/docs` and `/docs/*` — explicitly unchanged per 02 §E.

## Styling

N/A — server middleware, no CSS/component surface.

## Acceptance / verification

```bash
cd bfna-website-nuxt && npm run typecheck
cd bfna-website-nuxt && npx nuxt generate   # NEVER `npm run generate`
```

Issue-specific — every row of 02 §E returns its specified status/target
against the generated site (preview server or `nuxt preview` over
`.output`):
```bash
for pair in "/team:/about#team:301" "/updates:/insights:301" "/blog:/insights:301" \
            "/podcasts::410" "/podcasts/foo:/projects/foo:301" \
            "/archives:/archive:301" "/test::410" "/test-base-layout::410"; do
  IFS=: read -r from to status <<< "$pair"
  curl -s -o /dev/null -w "%{http_code} $from\n" "http://localhost:3000$from"
done
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/digital-economy/foo   # 301 → re-pointed bf slug, not 404
curl -s -I http://localhost:3000/docs | grep -q "200"                                # /docs unchanged, no redirect
```

## Decisions

**D-57.1 — Two artefacts, one source of truth: middleware *and* Netlify
`_redirects`.** The spec's implementation note asks for middleware only, and
middleware only would have shipped a redirect map that does not run. `nuxt
generate` publishes `.output/public` to Netlify's CDN; there is no Nitro server
in front of a prerendered path in production, so `src/server/middleware/
redirects.ts` executes in `nuxt dev`, during prerender, and on an SSR deploy —
and nowhere else. The spec's own `curl … localhost:3000` acceptance would have
passed against a dev server while every rule was dead on the deployed site.

Which second mechanism: the repo has **no** `netlify.toml`, **no**
`public/_redirects` and **no** `nitro.routeRules` (02 §D is explicit that
`.netlify/netlify.toml` is a local, auto-generated, empty CLI state file, not a
routing config), so nothing pre-existed to extend. `_redirects` is the choice
because it is the only one of the three that survives the static preset without
converting the site to an SSR deploy — `routeRules` redirects are Nitro rules and
share the middleware's fate.

Drift between the two is prevented structurally, not by discipline: both are
generated from `src/server/utils/legacy-redirect-rules.ts` (the hand-authored
table) by `scripts/generate-legacy-redirects.ts`. `npm run redirects:check`
re-derives and diffs, exiting 1 on staleness.

**D-57.2 — Every generated `_redirects` rule is forced (`301!` / `410!`).**
Netlify serves a matching static file ahead of an unforced rule. `pages/team.vue`,
`updates.vue`, `blog/`, `podcasts/`, `archives/` and `test*.vue` still exist and
still prerender — deleting them is #58's job, not this issue's — so an unforced
`/team  /about#team  301` would have been shadowed by `.output/public/team/
index.html` for as long as that file exists. Forcing makes the static behaviour
identical to the middleware's, before and after #58.

**D-57.3 — 410 needs a destination in `_redirects`; `/410` is the sentinel.**
Netlify's grammar requires a target on every rule including a status-only one.
The target `/410` does not exist in `.output/public`, which is what makes Netlify
answer with the bare status and no body — the shape the spec's `statusCode = 410;
return` asks for. The middleware needs no equivalent: it calls
`sendNoContent(event, 410)` (h3 1.15.11), which sets the status, sends
`content-length: 0` and ends the response. Setting `event.node.res.statusCode`
and returning `undefined`, as the spec's note literally reads, would let the
request fall through to the page renderer and lose the status.

**D-57.4 — The `/:slug*` bucket is resolved from the content tree at build time,
never queried at runtime.** 02 §E says to resolve a bare slug "the same way the
legacy `pages/[...slug].vue` branch-resolution does today" — a chain of five
`queryCollection` calls. Reproducing that inside middleware would put the content
layer on the critical path of every request. The static equivalent already exists
because issue #151 carried each legacy record's identity onto its `bf-*` document
as `legacy` and `aka`: the bucket is simply which `content/bf/**` directory holds
the slug. 371 insights → `/insights/<slug>`; 38 projects → `/projects/<slug>`; the
7 `aka` slugs a project absorbed → `/projects/<parent slug>` (e.g.
`/2022-participants` → `/projects/class-of-2022`). Measured: no slug appears in
two buckets.

`src/utils/bf-programs.ts` derives its list with `import.meta.glob`, but that is a
**Vite** transform and Nitro bundles `server/**` with rollup, so the same trick is
unavailable here. The map is generated instead — `src/server/utils/legacy-slug-map.ts`,
a plain `Record<string, string>` statically imported by the middleware. **415**
entries, not 416: `content/bf/insights/democracy.json` has the slug `democracy`,
which is also a program hub, and the hub wins (the insight stays reachable at
`/insights/democracy`). The reserved set that produced that exclusion is derived,
not hand-listed — top-level route names under `src/pages`, the three program
slugs, every path the rule table names, and every entry at the root of `public/`.
An unknown one-segment path is absent from the map and falls through untouched to
the 404.

**D-57.5 — Residual #182's three rows, decided on evidence.** #182 handed this
issue `/people`, `/careers` and `/bertelsmann-stiftung`: the three hollow
one-segment legacy paths that no epic issue builds a page for, and which
`pages/[program].vue`'s `validate` turned from a 200 into a 404.

- `/people` → `/about#team`, 301. Same target as `/team`: `about.vue` renders Team
  and Board of Directors in one page (BRIEF §7, 02 §E).
- `/bertelsmann-stiftung` → `/about`, 301. `components/legacy/organisms/
  MainNav.vue:121` links it and 02 §A records it as one of two nav entries the
  legacy catch-all resolved with no page file; its content now renders on `/about`
  through `useBfPages().stiftungPage`.
- `/careers` → **410**. A repo-wide `grep -rni careers` (excluding `node_modules`)
  finds no page file, no nav entry, no `menus` row and no content document — only
  the word inside four insight bodies, a comment in `pages/[program].vue`, and
  sample data in `pages/bf-probe/36-bf-footer.vue`. Nothing was authored, so there
  is nothing to point at; 410 is honest where a 301 to `/about` would be a guess.

All three are appended to the 02 §E table, marked as added here.

**D-57.6 — `/digital-economy` re-points straight at
`/transatlantic-relations-global-challenges`, one hop, not two.** The spec table
states that target directly. It deliberately does not chain through
`/digital-world` (which 02 §E sends to `/`): a permanent redirect should land in
one hop, and chaining would have sent every `/digital-economy` URL to the homepage
rather than to a programme.

**D-57.7 — Test-harness substitution.** Per the epic's harness rule, no vitest
test is added (the harness on `dev` is pre-existing broken, residual #86). The
equivalent-strength check is `scripts/verify-legacy-redirects.ts`, which asserts
every row of this table twice — once against a live `nuxt dev` server (the
middleware path: status code plus `location` header) and once against the
generated `public/_redirects` (the static path) — and exits non-zero on the first
mismatch. It also runs `--check` on the generator, so a stale artefact fails the
same command.

**D-57.8 — Known limitation, filed rather than silently deviated from.**
`/digital-economy/<rest>` and `/future-of-work/<rest>` preserve the splat, as 02
§D and the spec both require, so they land on
`/transatlantic-relations-global-challenges/<rest>` and
`/future-leadership/<rest>`. Program hubs are served by `pages/[program].vue`,
which matches **one** segment, so those two-segment targets 404. Preserving the
splat is what the spec says; second-guessing it into a hub-root redirect would
have thrown away the only information those URLs carry. Recorded as a residual.

**D-57.9 — Query strings survive, trailing slashes are normalised.** A redirect
that drops `?utm_source=…` loses the attribution the inbound link was carrying, so
the query is split off before matching and re-attached to the target — ahead of a
fragment, where a URL puts it (`/team?x=1` → `/about?x=1#team`). `/team/` and
`/team` are the same legacy URL and normalise to the same rule; `/` is left alone.
Netlify normalises trailing slashes itself, so `_redirects` carries no duplicate
rows.
