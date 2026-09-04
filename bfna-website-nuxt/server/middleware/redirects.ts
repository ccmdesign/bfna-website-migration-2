/**
 * The legacy → `bf-*` redirect map (gh#66, spec
 * `docs/ds-epic/issues/57-cutover-redirects.md`, table from
 * `docs/ds-epic/02-legacy-retirement-inventory.md` §E).
 *
 * One file, one precedence order, as the spec asks. The rules themselves live in
 * `../utils/legacy-redirect-rules.ts` and the one-segment slug lookup in the
 * generated `../utils/legacy-slug-map.ts`, because `public/_redirects` — the half
 * that actually runs in production, where the site is static and this middleware
 * never executes — is generated from those same two tables. Read the rule module
 * for why each row is what it is; read this one for the order they are applied in.
 *
 * ## Order, most specific first
 *
 * 1. **Untouched prefixes.** `/docs` and `/docs/*` return immediately (02 §E).
 * 2. **Exact 410s** — dev scaffolding and legacy indexes with no successor.
 * 3. **Exact 301s** — one-for-one renames and absorptions.
 * 4. **Prefix families** — `<from>/<rest>` → `<to>/<rest>`, splat preserved.
 * 4b. **Collapsing prefix families** — `<from>/<rest>` → `<to>`, splat dropped,
 *    because the target route takes no second segment (gh#67, residuals #206/#208).
 * 5. **One-segment slug map** — legacy content URLs into `/insights` / `/projects`.
 * 6. Anything else falls through untouched, including every unknown one-segment
 *    path, which still reaches the 404 rather than being guessed at. Since gh#67
 *    deleted `pages/[...slug].vue`, that 404 is `src/error.vue` under the
 *    `bf-default` shell rather than the legacy catch-all's "not found" body.
 *
 * Exact rules are checked before prefix rules because `/podcasts` (410) and
 * `/podcasts/:slug` (301 to `/projects/:slug`) share a stem and disagree, and
 * prefix rules are checked before the slug map because a prefix match is a
 * statement about a whole family while the map is a lookup of individual
 * documents.
 *
 * ## Path handling
 *
 * `event.node.req.url` carries the query string, so it is split off, matched
 * against nothing, and re-attached to the target — a redirect that silently drops
 * `?utm_source=…` loses the attribution the old link was carrying. A single
 * trailing slash is normalised away before matching (`/team/` and `/team` are the
 * same legacy URL) but `/` itself is left alone.
 */

import { LEGACY_SLUG_MAP } from '../utils/legacy-slug-map'
import {
  LEGACY_GONE_EXACT,
  LEGACY_REDIRECT_COLLAPSE_PREFIXES,
  LEGACY_REDIRECT_EXACT,
  LEGACY_REDIRECT_PREFIXES,
  LEGACY_UNTOUCHED_PREFIXES
} from '../utils/legacy-redirect-rules'

/**
 * The three tables as `Set`/`Map`, built once at module load.
 *
 * Not just for the O(1) lookup on a hot path — a plain object indexed by a
 * user-supplied string answers for **inherited** keys too, and
 * `LEGACY_SLUG_MAP['constructor']` is `Object`, which is truthy. A request for
 * `/constructor`, `/toString`, `/valueOf`, `/hasOwnProperty` or
 * `/isPrototypeOf` would otherwise have been 301'd to the source text of a
 * native function. `Map` has no prototype chain to fall through to.
 */
const GONE = new Set(LEGACY_GONE_EXACT)
const EXACT = new Map(Object.entries(LEGACY_REDIRECT_EXACT))
const SLUGS = new Map(Object.entries(LEGACY_SLUG_MAP))

export default defineEventHandler((event) => {
  const rawUrl = event.node.req.url || ''
  const queryStart = rawUrl.indexOf('?')
  const search = queryStart === -1 ? '' : rawUrl.slice(queryStart)
  const rawPath = queryStart === -1 ? rawUrl : rawUrl.slice(0, queryStart)

  // `/team/` and `/team` are the same legacy URL; `/` is not `''`.
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') || '/' : rawPath

  // 1. Explicitly out of scope for the flip — the internal DS docs tool.
  for (const prefix of LEGACY_UNTOUCHED_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return
  }

  // 2. Gone: status only, no body, per spec 57's implementation note.
  if (GONE.has(path)) {
    return sendNoContent(event, 410)
  }

  // 3. Exact renames and absorptions. A target carrying a fragment (`/about#team`)
  //    keeps the query ahead of the hash, which is where a URL puts it.
  const exact = EXACT.get(path)
  if (exact) {
    return sendRedirect(event, withSearch(exact, search), 301)
  }

  // 4. Prefix families, splat preserved.
  for (const [from, to] of LEGACY_REDIRECT_PREFIXES) {
    if (path.startsWith(`${from}/`)) {
      return sendRedirect(event, `${to}${path.slice(from.length)}${search}`, 301)
    }
  }

  // 4b. Prefix families whose splat is dropped (gh#67, residuals #206/#208). The
  //     two sets are disjoint by construction, so the order between 4 and 4b is
  //     not load-bearing; they are separate tables because the target of a
  //     collapsing family is a whole route, not a stem to append to.
  for (const [from, to] of LEGACY_REDIRECT_COLLAPSE_PREFIXES) {
    if (path.startsWith(`${from}/`)) {
      return sendRedirect(event, withSearch(to, search), 301)
    }
  }

  // 5. One-segment legacy content URLs. Guarded so the lookup only ever sees
  //    something that could plausibly be a slug: one segment, no file extension,
  //    not an internal path. The map is a closed set of known documents, so an
  //    unknown slug falls through here regardless — the guard is about not paying
  //    for a lookup on every asset request.
  if (isCandidateSlugPath(path)) {
    const target = SLUGS.get(path.slice(1))
    if (target) {
      return sendRedirect(event, `${target}${search}`, 301)
    }
  }
})

/** Re-attach a query string, before any fragment on the target. */
function withSearch(target: string, search: string): string {
  if (!search) return target
  const hash = target.indexOf('#')
  return hash === -1
    ? `${target}${search}`
    : `${target.slice(0, hash)}${search}${target.slice(hash)}`
}

/**
 * Whether `path` is shaped like a bare legacy content slug: exactly one segment,
 * no dot (so `/favicon.ico` and `/search.json` are never candidates) and not an
 * internal path (`/_nuxt/*`, `/api/*` are multi-segment, but `/_payload.json`-style
 * roots are not — hence the leading-underscore check as well).
 */
function isCandidateSlugPath(path: string): boolean {
  if (path.length < 2 || path[0] !== '/') return false
  const segment = path.slice(1)
  return !segment.includes('/') && !segment.includes('.') && segment[0] !== '_'
}
