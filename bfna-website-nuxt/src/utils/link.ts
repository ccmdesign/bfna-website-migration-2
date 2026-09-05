/**
 * Link classification for the `bf-*` layer — issue 19 / gh#28.
 *
 * One question, answered once: **does this href leave the site?** Before this
 * module every call site re-decided it. `wfFooter` writes a bare
 * `data-external` on socials and on the ccm.design credit; `wfCardProduct`
 * writes one whenever `external_url` is set at all; `wfChip`, `wfNav` and
 * `wfCtaSection` each read an `external` flag that the data happens to carry;
 * `wfMenuLink` marks *every* `href` branch external by construction. Five
 * different rules for one property of a string.
 *
 * `isExternal` is the shared rule those callers converge on. It does not
 * *render* anything: the visible affordance is the `[data-external]` attribute
 * marker, whose style hook lives in
 * `src/public/css/components/external-link.css`. Per the inventory finding the
 * marker stays an **attribute**, not a component — so this module and that
 * stylesheet are the whole of it.
 *
 * No Vue imports, no Nuxt runtime, no `window` — a plain TypeScript unit, the
 * same discipline `src/utils/format.ts` states. `window.location` is
 * deliberately not consulted: the answer would then differ between the
 * prerender and the hydrated page for the site's own absolute URLs, which is a
 * hydration mismatch rather than a feature.
 */

/**
 * The hosts that *are* this site. An absolute URL pointing at one of these is
 * internal even though it is written absolutely.
 *
 * Derived from the real snapshots rather than declared: of the four
 * `bfna`-shaped hosts in `src/assets/wireframe-data/*.json`, only
 * `www.bfna.org` (23 links) is the site itself. `bfna.simplyas.com` (296 — the
 * legacy CMS's asset host), `bfnadocs.org` / `www.bfnadocs.org` (7) and
 * `greenideasbfna.org` (1) are separate properties: microsites and an asset
 * origin. They read as external because they *are* external — a reader
 * following one leaves this site, which is exactly what the marker promises.
 *
 * Bare `bfna.org` is included alongside `www.bfna.org`: the snapshots only ever
 * write the `www` form, but a hand-authored link to the apex is the same site
 * and must not sprout an arrow.
 *
 * Compared case-insensitively and without the port (see `hostOf`).
 */
export const SITE_HOSTS: readonly string[] = ['bfna.org', 'www.bfna.org']

/** `https?://` or a protocol-relative `//`, followed by the authority. */
const ABSOLUTE = /^(?:https?:)?\/\/([^/?#]*)/i

/**
 * The hostname of an absolute URL's authority: userinfo and port removed,
 * lowercased, trailing dot stripped.
 *
 * Hand-parsed rather than handed to `new URL()`, because `URL` needs a base for
 * the protocol-relative form and throws on input this function is expected to
 * classify (`'//'`, `'http://'`) instead of returning a verdict.
 */
const hostOf = (authority: string): string => {
  const afterUserinfo = authority.slice(authority.lastIndexOf('@') + 1)

  // An IPv6 literal keeps its brackets; anything else splits on the first colon.
  const host = afterUserinfo.startsWith('[')
    ? afterUserinfo.slice(0, afterUserinfo.indexOf(']') + 1)
    : (afterUserinfo.split(':')[0] ?? '')

  return host.toLowerCase().replace(/\.$/, '')
}

/**
 * Does `href` point somewhere outside this site?
 *
 * The rule, straight from the spec: **an absolute `http(s)` or
 * protocol-relative URL whose host differs from the site's own is external; a
 * relative path or a `#anchor` is not.**
 *
 * | input | verdict | why |
 * |---|---|---|
 * | `https://bfnadocs.org/x` | `true` | a different host — a microsite |
 * | `//example.com/x` | `true` | protocol-relative, still a different host |
 * | `https://WWW.BFNA.ORG/x` | `false` | the site itself, written absolutely |
 * | `/insights` · `insights` · `../x` | `false` | relative — same site by definition |
 * | `#main` · `''` · `'   '` | `false` | not a navigation off-site at all |
 * | `mailto:…` · `tel:…` | `false` | not an `http(s)` URL; see below |
 *
 * **Non-`http(s)` schemes return `false`**, following the spec's base rule to
 * the letter. `mailto:` and `tel:` hand off to another *application*, not to
 * another website, and the marker this feeds — a `↗` meaning "opens another
 * site" — would misdescribe them. No wireframe link marks one external either.
 * A caller that wants the arrow on such a link can still set `data-external`
 * by hand; this function simply does not decide it for them.
 *
 * A malformed absolute URL with no host at all (`'http://'`, `'//'`) is
 * `false`: an empty host cannot be shown to differ from the site's, and
 * guessing "external" would put an arrow on a broken link.
 *
 * @param href      the value that would go in `href`. Anything non-string,
 *                  `null` or `undefined` is `false` — call sites read this from
 *                  untyped snapshot data.
 * @param siteHosts the hosts to treat as this site. Defaults to `SITE_HOSTS`;
 *                  passed explicitly by the tests and by any caller rendering
 *                  for a different origin.
 */
export function isExternal(
  href: string | null | undefined,
  siteHosts: readonly string[] = SITE_HOSTS
): boolean {
  if (typeof href !== 'string') return false

  const trimmed = href.trim()
  if (trimmed === '') return false

  const match = ABSOLUTE.exec(trimmed)
  if (!match) return false

  const host = hostOf(match[1] ?? '')
  if (host === '') return false

  return !siteHosts.some(own => own.toLowerCase().replace(/\.$/, '') === host)
}

/**
 * The attributes that send an off-site link to a new tab.
 *
 * Same question as `isExternal`, same answer — this only names what the DOM
 * needs once, so five call sites (`bfNav`'s top-level links, `nav/MenuLink`,
 * `bfFooter`'s column heads and socials, `bfButton`'s anchor branch) do not
 * each re-decide the `rel` string. Spread it: `v-bind="newTabAttrs(href)"`.
 *
 * Gated on `isExternal`, deliberately, rather than on the data's own
 * `external: true` flag. Four menu entries in `src/assets/bf-data/menus.json`
 * carry that flag over a **placeholder** href (`#podcast-platform-url`,
 * `#transponder-magazine-url`, `#`) because the real destination is not known
 * yet. Opening `#` in a new tab yields a blank duplicate of the current page,
 * which is worse than doing nothing; `isExternal` returns `false` for those and
 * they stay in-tab until a real URL lands, at which point this starts applying
 * with no further edit.
 *
 * `rel="noopener noreferrer"`: `noopener` severs `window.opener` so the opened
 * page cannot reach back into this one (a `target="_blank"` without it is the
 * reverse-tabnabbing hole), and `noreferrer` withholds the referrer. Modern
 * engines imply `noopener`, but it is written out because the guarantee should
 * not depend on the reader knowing that.
 */
export function newTabAttrs(
  href: string | null | undefined,
  siteHosts: readonly string[] = SITE_HOSTS
): { target: '_blank'; rel: string } | Record<string, never> {
  return isExternal(href, siteHosts)
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {}
}
