/**
 * The legacy → `bf-*` redirect table (gh#66, spec `docs/ds-epic/issues/57-cutover-redirects.md`).
 *
 * This module is the **single source of truth** for both halves of the cutover:
 *
 * - `server/middleware/redirects.ts` reads it at request time (dev server,
 *   prerender, and any SSR deploy);
 * - `scripts/generate-legacy-redirects.ts` reads it to emit `public/_redirects`,
 *   which is what actually holds on the deployed static site — `nuxt generate`
 *   publishes `.output/public` to Netlify's CDN with no Nitro server in front of
 *   it, so server middleware never runs for a prerendered path in production.
 *
 * Keeping one table and generating the second artefact from it is the only way
 * the two can be shown to agree; hand-maintaining `_redirects` alongside this
 * file would drift on the first edit.
 *
 * Rows come from `docs/ds-epic/02-legacy-retirement-inventory.md` §E as amended
 * by spec 57 (the 31 Jul 2026 programme rename), plus the three paths surfaced by
 * residual #182 — `/people`, `/careers`, `/bertelsmann-stiftung` — which no epic
 * issue builds a page for and which `pages/[program].vue`'s `validate` turned from
 * a hollow 200 into a 404.
 */

/**
 * Prefixes this middleware must never touch.
 *
 * `/docs` is the internal design-system tool. 02 §E marks it **explicitly
 * unchanged** — it is out of scope for the flip and keeps its route — so it is
 * matched first and returns before any other rule can look at it.
 */
export const LEGACY_UNTOUCHED_PREFIXES: readonly string[] = ['/docs']

/**
 * Paths that answer `410 Gone`: dev scaffolding and a legacy index with no
 * successor.
 *
 * `/podcasts` has no standalone index in the `bf-*` set — podcast content renders
 * as an "Episodes" band on its parent project page (02 §E, BF-147), so there is
 * nothing to redirect *to*; a 301 to `/projects` would be a lie about what the
 * old URL held. `/test` and `/test-base-layout` are dev scaffolding.
 *
 * `/careers` is the #182 row decided here: a repo-wide `grep -rni careers`
 * (excluding `node_modules`) finds no page file, no nav entry, no `menus` row and
 * no content document — only the word inside four insight bodies, a comment in
 * `pages/[program].vue` and sample data in `pages/bf-probe/36-bf-footer.vue`.
 * Nothing was ever authored at `/careers`, so there is no content to point at and
 * 410 is the honest answer.
 */
export const LEGACY_GONE_EXACT: readonly string[] = [
  '/careers',
  '/podcasts',
  '/test',
  '/test-base-layout'
]

/**
 * Exact one-for-one 301s, legacy path → `bf-*` target.
 *
 * `/team` and `/people` both land on `/about#team`: `about.vue` renders the Team
 * and Board of Directors sections in one page, so there is no standalone people
 * route in the `bf-*` set (02 §E; BRIEF §7).
 *
 * `/bertelsmann-stiftung` is the second #182 row. `components/legacy/organisms/
 * MainNav.vue:121` links it and 02 §A records it as one of two nav entries the
 * legacy catch-all resolved with no page file of its own; its content now renders
 * on `/about` through `useBfPages().stiftungPage`, so `/about` is where it goes.
 *
 * `/digital-economy` → `/transatlantic-relations-global-challenges` is the
 * re-point spec 57 §E asks for. Note it deliberately does **not** chain through
 * `/digital-world` (which 02 §E sends to `/`): the spec table states the final
 * target directly, and one hop is better than two for a permanent redirect.
 */
export const LEGACY_REDIRECT_EXACT: Readonly<Record<string, string>> = {
  '/archives': '/archive',
  '/bertelsmann-stiftung': '/about',
  '/blog': '/insights',
  '/digital-economy': '/transatlantic-relations-global-challenges',
  '/digital-world': '/',
  '/future-of-work': '/future-leadership',
  '/people': '/about#team',
  '/politics-society': '/transatlantic-relations-global-challenges',
  '/team': '/about#team',
  '/updates': '/insights'
}

/**
 * Prefix (splat) families: `<from>/<rest>` → `<to>/<rest>`, `rest` preserved.
 *
 * Only one family can honestly preserve its splat. `/podcasts/:slug` →
 * `/projects/:slug` lands on `pages/projects/[slug].vue`, a route that really
 * takes a second segment, and a podcast's episodes really are on its parent
 * project page.
 *
 * The other two families that lived here — `/digital-economy/*` and
 * `/future-of-work/*` — moved to `LEGACY_REDIRECT_COLLAPSE_PREFIXES` below in
 * gh#67; see that comment for why.
 */
export const LEGACY_REDIRECT_PREFIXES: readonly (readonly [from: string, to: string])[] = [
  ['/podcasts', '/projects']
]

/**
 * Prefix families whose splat is **dropped**: `<from>/<rest>` → `<to>`.
 *
 * Added by gh#67, closing residuals #206 and #208.
 *
 * #206: gh#66 implemented `/digital-economy/*` → `/transatlantic-relations-global-challenges/:splat`
 * and `/future-of-work/*` → `/future-leadership/:splat` exactly as 02 §D and spec
 * 57 §E ask, and measured them working — but the targets do not resolve. Program
 * hubs are served by `src/pages/[program].vue`, which compiles to `/:program()`:
 * **one** segment. There is no `pages/[program]/` directory, so every two-segment
 * program path 404s, and an old link was getting one 301 followed by a 404. The
 * sub-path those URLs carry has no destination in the `bf-*` site, so the honest
 * answer is the hub itself — one hop that always resolves — rather than a 301
 * into a 404 or a guess through the slug map, whose entries are already reachable
 * at their own one-segment URLs.
 *
 * #208: `/blog` → `/insights` was a §E row; `/blog/:slug*` was not, so gh#66 added
 * no rule for it and `/blog/anything` went on rendering the legacy blog template —
 * a 200 saying "Post not found", under a parent that redirects away. gh#67 deletes
 * `pages/blog/`, and this row keeps the family consistent with its parent instead
 * of letting it fall to the 404. The splat is dropped because the `blog`
 * collection has zero documents (02 §A), so no `/insights/<blog-slug>` exists to
 * point at.
 */
export const LEGACY_REDIRECT_COLLAPSE_PREFIXES: readonly (readonly [from: string, to: string])[] = [
  ['/blog', '/insights'],
  ['/digital-economy', '/transatlantic-relations-global-challenges'],
  ['/future-of-work', '/future-leadership']
]

/**
 * The destination the two 410 rules use in `public/_redirects`.
 *
 * Netlify's `_redirects` grammar requires a destination on every rule, including
 * one whose only purpose is a status code. Pointing at a path that does not exist
 * in `.output/public` is what makes Netlify answer with the bare status and no
 * body — the shape spec 57 asks for (`statusCode = 410; return` — no body). The
 * middleware needs no equivalent; it calls `sendNoContent(event, 410)`.
 */
export const LEGACY_GONE_SENTINEL = '/410'
