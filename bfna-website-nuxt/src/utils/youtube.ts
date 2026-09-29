/**
 * YouTube URLs, read and written — for the insight detail page's player and
 * for `bfProse`'s embeds.
 *
 * 54 of the 371 `bfInsights` rows carry a `video_url`, every one of them on
 * YouTube, in five spellings: `youtu.be/ID`, `youtube.com/watch?v=ID`
 * (sometimes with `&feature=…` or `&list=…` riding along), `/embed/ID`, and
 * one legacy body that embeds `<iframe src="…/embed/ID">`. `youtubeId` reduces
 * all of them to the 11-character video id, and the writers below build every
 * URL the site emits from that id alone — so no stored string, and no query
 * parameter somebody pasted into the CMS, ever reaches an `iframe` `src`.
 *
 * ## Why `youtube-nocookie.com`
 *
 * The embed host is YouTube's privacy-enhanced mode: no tracking cookies are
 * set until the reader presses play. The detail page goes further and renders
 * a poster that loads no player at all until then (`pages/insights/[slug].vue`),
 * so an unplayed video costs one thumbnail request, not the player's script.
 *
 * Plain TypeScript, no Vue and no Nuxt runtime, like `format.ts`.
 */

/** The hosts a video id may be read from. Compared lower-cased, without `www.`/`m.`. */
const YOUTUBE_HOSTS = new Set(['youtube.com', 'youtu.be', 'youtube-nocookie.com'])

/** A video id: 11 characters of the URL-safe base64 alphabet. */
const ID = /^[\w-]{11}$/

/**
 * The video id in a YouTube URL, or `null` when `url` is not one.
 *
 * Absolute (`https://…`) and protocol-relative (`//…`) URLs only. The id is
 * taken from `youtu.be/<id>`, `?v=<id>`, or a `/embed/`, `/shorts/`, `/live/`
 * or `/v/` path segment, and must match the id alphabet exactly — anything
 * else is `null` rather than a best guess.
 */
export function youtubeId(url: string | null | undefined): string | null {
  if (typeof url !== 'string') return null
  const raw = url.trim()
  if (!/^(?:https?:)?\/\//i.test(raw)) return null

  let parsed: URL
  try {
    parsed = new URL(raw.startsWith('//') ? `https:${raw}` : raw)
  }
  catch {
    return null
  }

  const host = parsed.hostname.toLowerCase().replace(/^(?:www|m)\./, '')
  if (!YOUTUBE_HOSTS.has(host)) return null

  const segments = parsed.pathname.split('/').filter(Boolean)
  const candidate = host === 'youtu.be'
    ? segments[0]
    : (parsed.searchParams.get('v')
      ?? (['embed', 'shorts', 'live', 'v'].includes(segments[0] ?? '') ? segments[1] : undefined))

  return candidate && ID.test(candidate) ? candidate : null
}

/** The page a reader can open on YouTube itself. */
export const youtubeWatchUrl = (id: string): string => `https://www.youtube.com/watch?v=${id}`

/**
 * The privacy-enhanced player. `autoplay=1` is for the poster-then-play
 * pattern only — the reader has just pressed play, so starting is what they
 * asked for; an embed that appears on its own never autoplays. `rel=0` keeps
 * the end screen's suggestions to the same channel.
 */
export const youtubeEmbedUrl = (id: string, { autoplay = false } = {}): string =>
  `https://www.youtube-nocookie.com/embed/${id}?rel=0${autoplay ? '&autoplay=1' : ''}`

/**
 * A still for the poster. `hq` (480 × 360, letterboxed 16:9) exists for every
 * video; `maxres` (1280 × 720) exists for most — 46 of the 54 — and for the
 * rest YouTube answers with a 120 × 90 grey placeholder, so a caller that
 * wants the sharp one must check its `naturalWidth` before showing it.
 */
export const youtubePoster = (id: string, size: 'hq' | 'maxres' = 'hq'): string =>
  `https://i.ytimg.com/vi/${id}/${size === 'maxres' ? 'maxresdefault' : 'hqdefault'}.jpg`
