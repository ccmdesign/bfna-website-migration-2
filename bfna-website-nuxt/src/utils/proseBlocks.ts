/**
 * The body-string parser behind `bfProse`.
 *
 * Bodies arrive from the `data` collections as plain strings, and what is in
 * them is markdown — measured over the 257 `bfInsights` rows that carry one
 * (Sep 2026): 1,173 links in 135 bodies, 113 inline images in 26, blockquotes
 * in 52, emphasis in 76, ordered lists in 4, footnotes in 2, rules in 7, and a
 * dozen PDF-pasted reports whose paragraphs are hard-wrapped at ~60 characters.
 * Two legacy bodies are Directus-era HTML instead, one of them wrapping a
 * YouTube `<iframe>`.
 *
 * The first port (`wfProse`'s parser, verbatim) kept headings, `-` lists and
 * paragraphs and dropped everything else to text: every link lost its URL,
 * every inline image printed as `!caption` or — with an empty alt — as its
 * raw 100-character URL, which ran the autocratization article 196px past a
 * 1280px viewport and 610px past a phone. Hard-wrapped reports rendered one
 * paragraph per line. This module is the "real renderer" that port's comment
 * deferred to.
 *
 * ## Still no markup from the body is ever inserted as markup
 *
 * The parse produces **data** — a `ProseBlock[]` of plain objects — and
 * `bfProse` renders it with the template and `h()`, so every string goes
 * through Vue's text interpolation or attribute binding. There is no
 * `v-html` anywhere, which was the original construction's whole safety
 * argument, and it holds unchanged.
 *
 * What is new is that some strings now become **attribute values** — a link's
 * `href`, an image's `src`, an embed's `src` — and Vue does not police those.
 * So each one passes an allow-list first:
 *
 * - `safeHref`: `http(s)`, protocol-relative (upgraded to `https:`), `mailto:`,
 *   `tel:`, root-relative `/…` and `#…`. Anything else — `javascript:`,
 *   `data:`, `vbscript:`, a scheme hidden behind control characters — is not
 *   a link, and its text renders as plain text.
 * - `safeImageSrc`: `http(s)` (upgraded to `https:`), protocol-relative and
 *   root-relative only.
 * - `safeEmbedId`: an `iframe` is kept only when it is a YouTube video, and
 *   what is kept is the video **id** alone. `bfProse` rebuilds every URL it
 *   emits from that id (`utils/youtube.ts`) rather than passing the stored
 *   one through, so no attribute or parameter of the stored tag survives.
 *   Every other `iframe` is dropped.
 *
 * ## Names for the things a screen reader lands on
 *
 * An embed and a table each become something a keyboard user reaches and a
 * screen reader names — the video's play link and its player, the table's
 * scrolling region — so each block carries a `label` for it, taken from the
 * body rather than a generic "Video" or "Table" (several regions all called
 * "Table" cannot be told apart). An embed is named by its `iframe`'s own
 * `title` when the author wrote one (not YouTube's stock "YouTube video
 * player"), else by the heading it sits under, else by the first sentence of
 * the paragraph before it. A table is numbered when the body has more than
 * one, and described by the paragraph that introduces it when that is a
 * short lead-in ending in a colon, else by its header row.
 *
 * ## Heading ranks: floored at 2, then compacted
 *
 * Nothing here emits an `h1`: the page's single rank-1 heading belongs to
 * `bfPageHeader` or `bfHero` (BRIEF §5 rule 9). `#` and `##` both map to rank
 * 2, as before. What is new is that the authored ranks are then **compacted**:
 * the distinct depths a body uses map, in order, onto 2, 3, 4 … So a body
 * whose only headings are `###` renders them as `h2`, and a `## `/`#### ` body
 * renders `h2`/`h3`. Before, 22 insight pages opened their body at `h3`
 * directly under the page's `h1` (`scripts/check-routes.ts`'s
 * `HEADING_SKIP_KNOWN`, residual off gh#223); the relative outline an author
 * wrote is kept, the skip is not.
 *
 * ## Paragraphs: a blank line, or a sentence that ends
 *
 * A blank line ends a paragraph, as in markdown. A single newline is the
 * data's own ambiguity: most bodies use it *between* paragraphs, and the
 * PDF-pasted ones use it *inside* them. So a line joins the paragraph (or
 * list item, quote, footnote) above it when that one does not end on
 * terminal punctuation — `…the labor market. On the one hand, there is` +
 * `a high level of overqualification` is one sentence and becomes one — and
 * starts a new paragraph when it does. Measured: 321 hard wraps rejoined
 * across 13 bodies; the 67 single newlines after a full stop still separate.
 *
 * Plain TypeScript, no Vue and no Nuxt runtime.
 */
import { isExternal } from './link'
import { youtubeId } from './youtube'

/** Inline content: a text run, emphasis, code, a link or a footnote reference. */
export type ProseInline =
  | { t: 'text', v: string }
  | { t: 'em' | 'strong', c: ProseInline[] }
  | { t: 'code', v: string }
  | { t: 'link', href: string, external: boolean, c: ProseInline[] }
  /**
   * `n` is the reader-facing number (order of first reference); `first` marks
   * the one occurrence that carries the back-link target `id`; `linked` is
   * false when the body references a note it never defines.
   */
  | { t: 'fnref', id: string, n: number, first: boolean, linked: boolean }

export type ProseHeadingTag = 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

/** One block. A discriminated union, so the template's branches are exhaustive by construction. */
export type ProseBlock =
  /** `caps`: the authored text is all capitals (PDF-derived reports), set as small caps-width type. */
  | { tag: ProseHeadingTag, c: ProseInline[], caps: boolean }
  /** `solo`: the paragraph is one bold run and nothing else — an authored subhead that is not a heading. */
  | { tag: 'p', c: ProseInline[], solo: boolean }
  | { tag: 'ul', items: ProseInline[][] }
  | { tag: 'ol', start: number, items: ProseInline[][] }
  | { tag: 'blockquote', paras: ProseInline[][] }
  | { tag: 'hr' }
  | { tag: 'figure', src: string, alt: string, caption: ProseInline[] | null }
  /** `id`: the YouTube video id, the only part of the stored embed that is kept. `label`: what it shows, for its accessible names. */
  | { tag: 'embed', id: string, label: string }
  /** `label`: the name of the table's scrolling region — see the file header. */
  | { tag: 'table', label: string, head: ProseInline[][], rows: ProseInline[][][], align: ('left' | 'center' | 'right' | null)[] }
  /** `referenced`: the text cites this note, so it has a reference to link back to. */
  | { tag: 'footnotes', items: { id: string, n: number, referenced: boolean, c: ProseInline[] }[] }

/* ------------------------------------------------------------------------ */
/* Allow-lists                                                               */
/* ------------------------------------------------------------------------ */

/** Control characters and whitespace, which browsers strip before reading a scheme (`java\tscript:`). */
// eslint-disable-next-line no-control-regex
const INVISIBLE = /[\u0000-\u0020\u007F-\u009F]/g

/**
 * A link target the page may emit, or `null`. See the file header for the
 * list. Spaces inside an otherwise valid URL are percent-encoded rather than
 * rejected: the CMS let authors paste them, and the browser would encode them
 * anyway.
 */
export function safeHref(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const s = raw.trim().replace(/^<(.*)>$/, '$1')
  const probe = s.replace(INVISIBLE, '')
  if (probe === '') return null
  const tidy = s.replace(/\s/g, '%20')
  if (probe.startsWith('//')) return `https:${tidy}`
  if (/^https?:\/\//i.test(probe)) return tidy
  if (/^(?:mailto|tel):/i.test(probe)) return tidy
  // `/\host` is read by browsers as `//host`, so a backslash after the slash is refused.
  if (/^\/(?!\\)/.test(probe) || probe.startsWith('#')) return tidy
  return null
}

/** An image source the page may emit, or `null`. `http:` is upgraded: a mixed-content image would be blocked. */
export function safeImageSrc(raw: string | null | undefined): string | null {
  const href = safeHref(raw)
  if (!href) return null
  if (/^https:\/\//i.test(href)) return href
  if (/^http:\/\//i.test(href)) return href.replace(/^http:/i, 'https:')
  if (/^\/(?!\/)/.test(href)) return href
  return null
}

/** An embed the page may emit: a YouTube video, reduced to its id. Anything else is `null`. */
export const safeEmbedId = (raw: string | null | undefined): string | null => youtubeId(raw)

/* ------------------------------------------------------------------------ */
/* Legacy HTML                                                               */
/* ------------------------------------------------------------------------ */

/** The entities the two legacy bodies use, plus the ones HTML cannot be written without. */
const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—',
  hellip: '…', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  auml: 'ä', ouml: 'ö', uuml: 'ü', szlig: 'ß', ccedil: 'ç', ntilde: 'ñ'
}

/** Decode named and numeric entities. An unknown name is left as written. */
const decodeEntities = (s: string): string => s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, body: string) => {
  if (body[0] === '#') {
    const code = body[1] === 'x' || body[1] === 'X' ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10)
    return Number.isFinite(code) && code > 0 && code <= 0x10FFFF ? String.fromCodePoint(code) : m
  }
  return ENTITIES[body.toLowerCase()] ?? m
})

/** An `iframe` lifted out of a legacy body: its `src`, and its `title` when the author wrote one. */
interface LegacyEmbed { url: string, title: string }

/** Private-use sentinel standing in for an extracted `iframe`; it cannot occur in authored text. */
const EMBED_MARK = /^\uE000embed:(\d+)\uE000$/

/**
 * Legacy HTML → the markdown the line loop reads. Block closers become blank
 * lines (a hard boundary, never re-joined), anchors and emphasis become their
 * markdown spelling so they survive, `iframe`s are lifted out to sentinels,
 * every other tag is dropped, and entities are decoded **after** the tags are
 * gone — so an encoded `&lt;script&gt;` becomes the literal text `<script>`,
 * rendered as text.
 */
function fromLegacyHtml(src: string, embeds: LegacyEmbed[]): string {
  return decodeEntities(src
    .replace(/<iframe\b[^>]*?\ssrc\s*=\s*["']([^"']+)["'][^>]*>(?:\s*<\/iframe>)?/gi, (tag: string, url: string) => {
      const title = /\stitle\s*=\s*"([^"]*)"|\stitle\s*=\s*'([^']*)'/i.exec(tag)
      embeds.push({ url, title: decodeEntities(title?.[1] ?? title?.[2] ?? '').trim() })
      return `\n\n\uE000embed:${embeds.length - 1}\uE000\n\n`
    })
    .replace(/<a\b[^>]*?\shref\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, text: string) => `[${text}](${href})`)
    .replace(/<\/?(?:strong|b)>/gi, '**')
    .replace(/<\/?(?:em|i)>/gi, '*')
    .replace(/<\/(?:p|h[1-6]|li|div|blockquote)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ''))
}

/* ------------------------------------------------------------------------ */
/* Inline                                                                    */
/* ------------------------------------------------------------------------ */

interface InlineState {
  /** Footnote ids the body defines — a reference to any other stays plain text. */
  defined: Set<string>
  /** Reader-facing numbers, assigned in order of first reference. */
  numbers: Map<string, number>
}

/** Index of the `]` matching the `[` at `open`, allowing nested pairs; -1 if none. */
function matchBracket(s: string, open: number): number {
  let depth = 0
  for (let i = open; i < s.length; i++) {
    if (s[i] === '\\') { i++; continue }
    if (s[i] === '[') depth++
    else if (s[i] === ']' && --depth === 0) return i
  }
  return -1
}

/** Index of the `)` matching the `(` at `open`, allowing balanced pairs inside a URL; -1 if none. */
function matchParen(s: string, open: number): number {
  let depth = 0
  for (let i = open; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')' && --depth === 0) return i
    else if (s[i] === '\n') return -1
  }
  return -1
}

/** Can `ch` (the character before an underscore run) open intraword emphasis? Only at a word edge. */
const isWordChar = (ch: string | undefined): boolean => ch !== undefined && /[\p{L}\p{N}]/u.test(ch)

/**
 * The closing delimiter for an emphasis run opened at `from`, or -1. The
 * closer must follow a non-space; a single `*` does not close on half of a
 * `**`; an underscore closer must end a word.
 */
function findCloser(s: string, from: number, delim: string): number {
  let i = from
  while (i < s.length) {
    const j = s.indexOf(delim, i)
    if (j === -1) return -1
    const before = s[j - 1]
    const after = s[j + delim.length]
    const doubled = delim.length === 1 && (after === delim || before === delim)
    const edge = delim[0] !== '_' || !isWordChar(after)
    if (j > from && before !== undefined && !/\s/.test(before) && !doubled && edge) return j
    i = j + 1
  }
  return -1
}

/** Trailing punctuation a bare URL does not own: `(see https://x.org).` ends at `org`. */
function trimAutolink(url: string): string {
  let out = url.replace(/[.,;:!?'"”’*_]+$/, '')
  while (out.endsWith(')') && (out.match(/\(/g) ?? []).length < (out.match(/\)/g) ?? []).length) out = out.slice(0, -1)
  return out
}

/**
 * An emphasis delimiter at either edge of a run that nothing closes — a
 * typo (`__*Dr. Vandana Slatter__`) or an italic the author spread across
 * two paragraphs (`*Rob Riemen, …` … `©Rob Riemen 2019*`) — is dropped
 * rather than printed as a literal asterisk. A trailing space before an
 * edge closer (`…the Bertelsmann Foundation. *`) is tolerated the same way.
 */
function balanceEdges(text: string): string {
  let t = text.replace(/\s+(\*{1,2}|_{1,2})$/, '$1').replace(/^(\*{1,2}|_{1,2})\s+/, '$1')
  const lead = /^(\*\*|__|\*|_)(?=\S)/.exec(t)
  if (lead && findCloser(t, lead[1]!.length, lead[1]!) === -1) t = t.slice(lead[1]!.length)
  const tail = /(?<=\S)(\*\*|__|\*|_)$/.exec(t)
  if (tail && !t.slice(0, -tail[1]!.length).includes(tail[1]!)) t = t.slice(0, -tail[1]!.length)
  return t
}

/** Does `text` open an emphasis run it never closes? Then the next line belongs to it. */
function opensEmphasis(text: string): boolean {
  const lead = /^(\*\*|__|\*|_)(?=\S)/.exec(text)
  return !!lead && findCloser(text, lead[1]!.length, lead[1]!) === -1
}

/**
 * Inline markdown → nodes. A single forward scan: escapes, code spans,
 * footnote references, links (nested brackets and balanced parentheses
 * allowed — the data has `[[1]](…)` citations and `…/Foo_(bar)` URLs), bare
 * and angle-bracket autolinks, then `**`/`__` and `*`/`_` emphasis. Link text
 * is parsed without links, so an anchor never nests inside another.
 */
function parseInline(input: string, state: InlineState, allowLinks = true): ProseInline[] {
  const s = balanceEdges(input)
  const out: ProseInline[] = []
  let buf = ''
  const flush = () => {
    if (buf) out.push({ t: 'text', v: buf })
    buf = ''
  }

  for (let i = 0; i < s.length;) {
    const ch = s[i]!

    // Escaped punctuation is literal.
    if (ch === '\\' && /[\\`*_[\]()#!>+\-.|]/.test(s[i + 1] ?? '')) {
      buf += s[i + 1]
      i += 2
      continue
    }

    // Code span.
    if (ch === '`') {
      const j = s.indexOf('`', i + 1)
      if (j > i + 1) {
        flush()
        out.push({ t: 'code', v: s.slice(i + 1, j) })
        i = j + 1
        continue
      }
    }

    // Footnote reference `[^id]` (never followed by `:` mid-line; that is a definition).
    const fn = ch === '[' ? /^\[\^([^\]\s]+)\]/.exec(s.slice(i, i + 64)) : null
    if (fn) {
      const id = fn[1]!
      flush()
      const linked = state.defined.has(id)
      let n = state.numbers.get(id)
      const first = n === undefined
      if (n === undefined) {
        n = state.numbers.size + 1
        state.numbers.set(id, n)
      }
      out.push({ t: 'fnref', id, n, first, linked })
      i += fn[0].length
      continue
    }

    // Inline image mid-paragraph: not a figure (the line loop takes line-leading ones). Keep its alt only.
    if (ch === '!' && s[i + 1] === '[') {
      const close = matchBracket(s, i + 1)
      if (close > 0 && s[close + 1] === '(') {
        const end = matchParen(s, close + 1)
        if (end > 0) {
          buf += s.slice(i + 2, close)
          i = end + 1
          continue
        }
      }
    }

    // Link `[text](url "title")`.
    if (ch === '[' && allowLinks) {
      const close = matchBracket(s, i)
      if (close > 0 && s[close + 1] === '(') {
        const end = matchParen(s, close + 1)
        if (end > 0) {
          const target = s.slice(close + 2, end).trim().replace(/\s+"[^"]*"$/, '')
          const href = safeHref(target)
          const children = parseInline(s.slice(i + 1, close), state, false)
          flush()
          if (href) out.push({ t: 'link', href, external: isExternal(href), c: children })
          else out.push(...children)
          i = end + 1
          continue
        }
      }
    }

    // Autolinks: `<https://…>` and a bare `https://…` at a word edge.
    if (allowLinks && ch === '<') {
      const auto = /^<(https?:\/\/[^\s<>]+)>/i.exec(s.slice(i))
      if (auto) {
        flush()
        out.push({ t: 'link', href: auto[1]!, external: isExternal(auto[1]), c: [{ t: 'text', v: auto[1]! }] })
        i += auto[0].length
        continue
      }
    }
    if (allowLinks && (ch === 'h' || ch === 'H') && !isWordChar(s[i - 1]) && s[i - 1] !== '/') {
      const bare = /^https?:\/\/[^\s<>"'[\]]+/i.exec(s.slice(i))
      if (bare) {
        const url = trimAutolink(bare[0])
        if (url.length > 'https://'.length) {
          flush()
          out.push({ t: 'link', href: url, external: isExternal(url), c: [{ t: 'text', v: url }] })
          i += url.length
          continue
        }
      }
    }

    // Emphasis.
    if (ch === '*' || ch === '_') {
      const delim = s[i + 1] === ch ? ch + ch : ch
      const opensWord = ch === '*' || !isWordChar(s[i - 1])
      const next = s[i + delim.length]
      if (opensWord && next !== undefined && !/\s/.test(next)) {
        const j = findCloser(s, i + delim.length, delim)
        if (j > -1) {
          flush()
          out.push({ t: delim.length === 2 ? 'strong' : 'em', c: parseInline(s.slice(i + delim.length, j), state, allowLinks) })
          i = j + delim.length
          continue
        }
      }
    }

    buf += ch
    i++
  }

  flush()
  return out
}

/* ------------------------------------------------------------------------ */
/* Blocks                                                                    */
/* ------------------------------------------------------------------------ */

/** Raw blocks, before inline parsing — text is still joinable across lines. */
type Raw =
  | { k: 'h', level: number, text: string }
  | { k: 'p', text: string }
  | { k: 'ul', items: string[] }
  | { k: 'ol', start: number, items: string[] }
  | { k: 'quote', paras: string[] }
  | { k: 'hr' }
  | { k: 'figure', src: string, alt: string, caption: string | null }
  | { k: 'embed', id: string, title: string }
  | { k: 'table', head: string[], rows: string[][], align: ('left' | 'center' | 'right' | null)[] }

/** Does this line of prose end a sentence (so a following line starts a new paragraph)? */
const ENDS_SENTENCE = /[.!?:;…"”’»)\]*_]$/

const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/
/** A thematic break — `---`, `***`, `___` — or the `**` alone on a line one essay uses as its section mark. */
const RULE = /^(?:-\s*){3,}$|^(?:\*\s*){2,}$|^(?:_\s*){3,}$/
const BULLET = /^[-*+]\s+(.*)$/
const ORDERED = /^(\d{1,2})[.)]\s+(.*)$/
const QUOTE = /^>\s?(.*)$/
const FIGURE = /^!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)(.*)$/
const FOOTNOTE_DEF = /^\[\^([^\]\s]+)\]:?\s+(.*)$/
const TABLE_ROW = /^\|.*\|$/
const TABLE_RULE = /^\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?$/

const cells = (row: string): string[] => row.replace(/^\||\|$/g, '').split('|').map(c => c.trim())

/** Is every letter in `text` a capital (and are there enough letters to call it a word)? */
const isAllCaps = (text: string): boolean => {
  const letters = text.replace(/[^\p{L}]/gu, '')
  return letters.length >= 4 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()
}

/** Inline nodes as the words a reader hears — footnote numbers left out. */
const plainText = (nodes: ProseInline[]): string => nodes.map(n =>
  n.t === 'text' || n.t === 'code' ? n.v : n.t === 'fnref' ? '' : plainText(n.c)).join('').replace(/\s+/g, ' ').trim()

/** At most `max` characters, cut at a word and marked with an ellipsis when cut. */
const clip = (s: string, max = 100): string => s.length <= max ? s : `${s.slice(0, max).replace(/\s+\S*$/, '')}…`

/** YouTube's stock embed-code title, which names the widget and not the video. */
const STOCK_TITLE = /^youtube(?: video)?(?: player)?$/i

/**
 * What an embed shows, for its play link and its player: the `iframe`'s own
 * title, else the heading above it, else the first sentence of the paragraph
 * before it, else just "YouTube".
 */
function embedLabel(title: string, before: ProseBlock[]): string {
  if (title && !STOCK_TITLE.test(title)) return clip(title)
  const heading = before.findLast(b => /^h[2-6]$/.test(b.tag)) as Extract<ProseBlock, { caps: boolean }> | undefined
  if (heading) return clip(plainText(heading.c))
  const para = before.at(-1)
  if (para?.tag === 'p') {
    const text = plainText(para.c)
    return clip(/^.+?[.!?](?=\s|$)/.exec(text)?.[0] ?? text)
  }
  return 'YouTube'
}

/** The paragraph introducing a table, when it is a short lead-in ending in a colon — without the colon. */
function leadIn(block: ProseBlock | undefined): string | null {
  if (block?.tag !== 'p') return null
  const text = plainText(block.c)
  return text.endsWith(':') && text.length <= 120 ? text.slice(0, -1).trim() : null
}

/**
 * The body, parsed into blocks. Empty, `null` or whitespace-only content is
 * `[]`, which `bfProse` renders as an empty root (residual #186).
 */
export function parseProse(content: string | null | undefined): ProseBlock[] {
  let src = (content ?? '').replace(/\r\n?/g, '\n')
  const embeds: LegacyEmbed[] = []
  if (/<[a-z][^>]*>/i.test(src)) src = fromLegacyHtml(src, embeds)

  const lines = src.split('\n').map(l => l.trim())

  const defined = new Set<string>()
  for (const line of lines) {
    const def = FOOTNOTE_DEF.exec(line)
    if (def) defined.add(def[1]!)
  }

  const raw: Raw[] = []
  const defs: { id: string, text: string }[] = []
  /** The text container the next line may join, or `null` after a blank line or a non-text block. */
  let open: { get: () => string, set: (v: string) => void } | null = null

  /*
    Three signals that a line continues the text above it rather than
    starting a paragraph: the text above does not end a sentence, it opens an
    emphasis run it has not closed yet (a bold subhead wrapped after its
    colon), or this line starts in lower case (`…education indicators:` +
    `countries with solid vocational training …`).
  */
  const joinable = (line: string): boolean => open !== null && line !== ''
    && (!ENDS_SENTENCE.test(open.get()) || opensEmphasis(open.get()) || /^\p{Ll}/u.test(line))

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const last = raw[raw.length - 1]

    if (line === '') {
      open = null
      continue
    }

    const embed = EMBED_MARK.exec(line)
    if (embed) {
      const found = embeds[Number(embed[1])]
      const id = safeEmbedId(found?.url)
      if (id) raw.push({ k: 'embed', id, title: found!.title })
      open = null
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      if (heading[2]) raw.push({ k: 'h', level: Math.max(2, heading[1]!.length), text: heading[2] })
      open = null
      continue
    }

    if (RULE.test(line)) {
      raw.push({ k: 'hr' })
      open = null
      continue
    }

    if (TABLE_ROW.test(line) && TABLE_RULE.test(lines[i + 1] ?? '')) {
      const align = cells(lines[i + 1]!).map(c => c.startsWith(':') && c.endsWith(':') ? 'center' as const : c.endsWith(':') ? 'right' as const : c.startsWith(':') ? 'left' as const : null)
      const rows: string[][] = []
      let j = i + 2
      while (j < lines.length && TABLE_ROW.test(lines[j]!)) rows.push(cells(lines[j++]!))
      raw.push({ k: 'table', head: cells(line), rows, align })
      i = j - 1
      open = null
      continue
    }

    const quote = QUOTE.exec(line)
    if (quote) {
      const text = quote[1]!.trim()
      if (last?.k === 'quote' && open !== null) {
        if (text === '') {
          last.paras.push('')
        }
        else {
          const p = last.paras.length - 1
          const prev = last.paras[p] ?? ''
          if (prev === '') last.paras[p] = text
          else if (!ENDS_SENTENCE.test(prev)) last.paras[p] = `${prev} ${text}`
          else last.paras.push(text)
        }
      }
      else if (text !== '') {
        raw.push({ k: 'quote', paras: [text] })
      }
      const q = raw[raw.length - 1]
      open = q?.k === 'quote'
        ? { get: () => q.paras[q.paras.length - 1] ?? '', set: (v) => { q.paras[q.paras.length - 1] = v } }
        : null
      continue
    }

    const figure = FIGURE.exec(line)
    if (figure) {
      const src = safeImageSrc(figure[2])
      const tail = figure[3]!.trim()
      const wrapped = /^(\*|_)(?!\1)(.+)\1$/.exec(tail)
      if (src) raw.push({ k: 'figure', src, alt: figure[1]!.trim(), caption: wrapped ? wrapped[2]!.trim() : null })
      if (tail && !wrapped) {
        const p = { k: 'p' as const, text: tail }
        raw.push(p)
        open = { get: () => p.text, set: (v) => { p.text = v } }
      }
      else {
        open = null
      }
      continue
    }

    const def = FOOTNOTE_DEF.exec(line)
    if (def) {
      const d = { id: def[1]!, text: def[2]!.trim() }
      defs.push(d)
      open = { get: () => d.text, set: (v) => { d.text = v } }
      continue
    }

    /*
      A hard-wrapped continuation joins the text above it. A list marker
      interrupts that only when it is plainly a list: any bullet, a `1.`, or
      the next number of the list already open. So `2. The structure …` after
      item 1 is item 2, and `2022. Forecasts indicate …` in the middle of a
      wrapped sentence stays prose.
    */
    const bullet = BULLET.exec(line)
    const orderedMatch = bullet ? null : ORDERED.exec(line)
    const n = orderedMatch ? Number(orderedMatch[1]) : Number.NaN
    const ordered = orderedMatch && (n === 1 || (last?.k === 'ol' && n === last.start + last.items.length) || !joinable(line))
      ? orderedMatch
      : null

    if (!bullet && !ordered && joinable(line)) {
      open!.set(`${open!.get()} ${line}`)
      continue
    }

    if (bullet || ordered) {
      const text = (bullet ? bullet[1] : ordered![2])!.trim()
      let list: Extract<Raw, { k: 'ul' | 'ol' }>
      if (bullet && last?.k === 'ul') list = last
      else if (ordered && last?.k === 'ol') list = last
      else {
        list = bullet ? { k: 'ul', items: [] } : { k: 'ol', start: Number(ordered![1]), items: [] }
        raw.push(list)
      }
      list.items.push(text)
      const target = list
      const idx = target.items.length - 1
      open = { get: () => target.items[idx]!, set: (v) => { target.items[idx] = v } }
      continue
    }

    const p = { k: 'p' as const, text: line }
    raw.push(p)
    open = { get: () => p.text, set: (v) => { p.text = v } }
  }

  /*
    Heading ranks: floored at 2 above, compacted here (file header), then
    clamped in document order so no heading sits more than one rank below
    the one before it — a body that opens on `###` and only later reaches
    `##` (the autocratization article) still opens on `h2`.
  */
  const depths = [...new Set(raw.flatMap(b => b.k === 'h' ? [b.level] : []))].sort((a, b) => a - b)
  let previous = 1
  const rank = (level: number): ProseHeadingTag => {
    const r = Math.min(6, 2 + depths.indexOf(level), previous + 1)
    previous = r
    return `h${r}` as ProseHeadingTag
  }

  const state: InlineState = { defined, numbers: new Map() }
  const inline = (text: string) => parseInline(text.trim(), state)

  const tableCount = raw.filter(b => b.k === 'table').length
  let tableIndex = 0

  const blocks: ProseBlock[] = []

  /** One raw block → its final shape. `blocks` holds everything before it, which the labels read. */
  const toBlock = (b: Raw): ProseBlock => {
    switch (b.k) {
      case 'h': return { tag: rank(b.level), c: inline(b.text), caps: isAllCaps(b.text) }
      case 'p': {
        const c = inline(b.text)
        return { tag: 'p', c, solo: c.length === 1 && c[0]!.t === 'strong' }
      }
      case 'ul': return { tag: 'ul', items: b.items.map(inline) }
      case 'ol': return { tag: 'ol', start: b.start, items: b.items.map(inline) }
      case 'quote': return { tag: 'blockquote', paras: b.paras.filter(Boolean).map(inline) }
      case 'hr': return { tag: 'hr' }
      case 'figure': return { tag: 'figure', src: b.src, alt: b.alt, caption: b.caption ? inline(b.caption) : null }
      case 'embed': return { tag: 'embed', id: b.id, label: embedLabel(b.title, blocks) }
      case 'table': {
        const head = b.head.map(inline)
        const number = tableCount > 1 ? `Table ${++tableIndex}` : 'Table'
        const about = leadIn(blocks.at(-1)) ?? head.map(plainText).filter(Boolean).join(', ')
        return { tag: 'table', label: about ? `${number}: ${about}` : number, head, rows: b.rows.map(r => r.map(inline)), align: b.align }
      }
    }
  }

  for (const b of raw) blocks.push(toBlock(b))

  if (defs.length) {
    const items = defs.map(d => ({ id: d.id, referenced: state.numbers.has(d.id), c: inline(d.text) }))
    // Referenced notes in reference order, then any the body defines but never cites.
    for (const d of items) if (!state.numbers.has(d.id)) state.numbers.set(d.id, state.numbers.size + 1)
    blocks.push({
      tag: 'footnotes',
      items: items
        .map(d => ({ ...d, n: state.numbers.get(d.id)! }))
        .sort((a, b) => a.n - b.n)
    })
  }

  return blocks
}
