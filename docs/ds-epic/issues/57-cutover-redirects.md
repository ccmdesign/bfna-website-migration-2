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

_Runner appends here._
