import { describe, it, expect } from 'vitest'
import { parseProse, safeHref, safeImageSrc, safeEmbedId, type ProseBlock, type ProseInline } from '../../utils/proseBlocks'

/**
 * `src/utils/proseBlocks.ts` — the parser behind `bfProse`. Fixtures marked
 * "real" are lifted from `content/bf/insights/*.json` bodies.
 */

const text = (nodes: ProseInline[]): string => nodes.map(n =>
  n.t === 'text' || n.t === 'code' ? n.v : n.t === 'fnref' ? `[${n.n}]` : text(n.c)).join('')

const only = (content: string): ProseBlock => {
  const blocks = parseProse(content)
  expect(blocks).toHaveLength(1)
  return blocks[0]!
}

describe('allow-lists', () => {
  it('keeps web, mail, phone, root-relative and fragment links', () => {
    expect(safeHref('https://www.dw.com/en/x')).toBe('https://www.dw.com/en/x')
    expect(safeHref('mailto:info@bfna.org')).toBe('mailto:info@bfna.org')
    expect(safeHref('/insights')).toBe('/insights')
    expect(safeHref('#fn-1')).toBe('#fn-1')
  })

  it('upgrades protocol-relative links to https', () => {
    expect(safeHref('//images.ctfassets.net/a.jpg')).toBe('https://images.ctfassets.net/a.jpg')
  })

  it('refuses script-bearing and hidden schemes', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull()
    expect(safeHref('JaVaScRiPt:alert(1)')).toBeNull()
    expect(safeHref('java\tscript:alert(1)')).toBeNull()
    expect(safeHref('data:text/html,<script>')).toBeNull()
    expect(safeHref('vbscript:x')).toBeNull()
    expect(safeHref('/\\evil.example')).toBeNull()
  })

  it('serves images over https only', () => {
    expect(safeImageSrc('http://x.org/a.png')).toBe('https://x.org/a.png')
    expect(safeImageSrc('mailto:x@y.z')).toBeNull()
  })

  it('keeps a YouTube embed only, reduced to its video id', () => {
    expect(safeEmbedId('https://www.youtube.com/embed/9MoBn0ftBYA?autoplay=1&onload=x')).toBe('9MoBn0ftBYA')
    expect(safeEmbedId('https://evil.example/embed/9MoBn0ftBYA')).toBeNull()
  })
})

describe('inline', () => {
  it('keeps a link, its URL and its external flag (real)', () => {
    const b = only('The June 2023 [“Deutschlandtrend”](https://www.tagesschau.de/inland/x.html) survey')
    expect(b.tag).toBe('p')
    const link = (b as Extract<ProseBlock, { tag: 'p' }>).c[1]!
    expect(link).toMatchObject({ t: 'link', href: 'https://www.tagesschau.de/inland/x.html', external: true })
  })

  it('renders an unsafe link as its text alone', () => {
    const b = only('see [here](javascript:alert(1)) now') as Extract<ProseBlock, { tag: 'p' }>
    expect(b.c.some(n => n.t === 'link')).toBe(false)
    expect(text(b.c)).toBe('see here now')
  })

  it('handles nested brackets and parentheses in a URL (real)', () => {
    const b = only('fifteen percent.[[1]](https://ig.ft.com/germany-poll-tracker/) The rest') as Extract<ProseBlock, { tag: 'p' }>
    expect(b.c[1]).toMatchObject({ t: 'link', href: 'https://ig.ft.com/germany-poll-tracker/' })
    expect(text(b.c)).toBe('fifteen percent.[1] The rest')
    const w = only('[x](https://en.wikipedia.org/wiki/Foo_(bar)) y') as Extract<ProseBlock, { tag: 'p' }>
    expect(w.c[0]).toMatchObject({ href: 'https://en.wikipedia.org/wiki/Foo_(bar)' })
  })

  it('autolinks a bare URL without its trailing punctuation', () => {
    const b = only('in: http://www.igbildendekunst.at/varela.htm.') as Extract<ProseBlock, { tag: 'p' }>
    expect(b.c[1]).toMatchObject({ t: 'link', href: 'http://www.igbildendekunst.at/varela.htm' })
    expect(text(b.c)).toBe('in: http://www.igbildendekunst.at/varela.htm.')
  })

  it('parses emphasis, and drops an edge delimiter nothing closes (real)', () => {
    const b = only('__*Dr. Vandana Slatter__, a clinical pharmacist') as Extract<ProseBlock, { tag: 'p' }>
    expect(b.c[0]).toMatchObject({ t: 'strong' })
    expect(text(b.c)).toBe('Dr. Vandana Slatter, a clinical pharmacist')
    const i = only('*Michael McKeon is project manager. *') as Extract<ProseBlock, { tag: 'p' }>
    expect(i.c[0]).toMatchObject({ t: 'em' })
  })

  it('leaves snake_case and lone asterisks alone', () => {
    expect(text((only('a snake_case_name and 5 * 3') as Extract<ProseBlock, { tag: 'p' }>).c)).toBe('a snake_case_name and 5 * 3')
  })
})

describe('blocks', () => {
  it('rejoins a hard-wrapped paragraph and keeps paragraphs after a full stop (real)', () => {
    const blocks = parseProse('Some figures will help illustrate\nthis paradox: 76% of firms.\nOne of the EU countries')
    expect(blocks.map(b => b.tag)).toEqual(['p', 'p'])
    expect(text((blocks[0] as Extract<ProseBlock, { tag: 'p' }>).c)).toBe('Some figures will help illustrate this paradox: 76% of firms.')
  })

  it('joins a lower-case line even after a colon (real)', () => {
    const blocks = parseProse('education indicators:\ncountries with solid vocational training')
    expect(blocks).toHaveLength(1)
  })

  it('keeps a year at the start of a wrapped line as prose, and numbered items as a list', () => {
    expect(parseProse('reaching the 1-million mark in 2021-\n2022. Forecasts indicate').map(b => b.tag)).toEqual(['p'])
    const list = parseProse('namely:\n1. The downturn hit Spain hard\n2. The labor market')
    expect(list.map(b => b.tag)).toEqual(['p', 'ol'])
    expect((list[1] as Extract<ProseBlock, { tag: 'ol' }>).items).toHaveLength(2)
  })

  it('parses blockquotes, rules and the `**` section mark (real)', () => {
    expect(only('> Germans are reconsidering the costs.').tag).toBe('blockquote')
    expect(parseProse('a.\n\n---\n\nb.').map(b => b.tag)).toEqual(['p', 'hr', 'p'])
    expect(parseProse('a.\n\n**\n\nb.').map(b => b.tag)).toEqual(['p', 'hr', 'p'])
  })

  it('turns a line-leading image into a figure, with a same-line italic caption (real)', () => {
    const b = only('![](//images.ctfassets.net/9vgcz0fppkl3/x/Picture1.png)*Increasingly repressive: China.*')
    expect(b).toMatchObject({ tag: 'figure', src: 'https://images.ctfassets.net/9vgcz0fppkl3/x/Picture1.png', alt: '' })
    expect(text((b as Extract<ProseBlock, { tag: 'figure' }>).caption!)).toBe('Increasingly repressive: China.')
  })

  it('never prints an image URL as text', () => {
    const blocks = parseProse('![](//images.ctfassets.net/a.png)')
    expect(JSON.stringify(blocks)).not.toContain('"t":"text","v":"//images')
  })

  it('never emits h1, compacts ranks and never skips one', () => {
    const tags = parseProse('# A\n\n### B\n\ntext\n\n##### C').filter(b => /^h/.test(b.tag)).map(b => b.tag)
    expect(tags).toEqual(['h2', 'h3', 'h4'])
    // A body that opens on `###` and reaches `##` later (autocratization, real) still opens on h2.
    expect(parseProse('### Late\n\n## Early').filter(b => /^h/.test(b.tag)).map(b => b.tag)).toEqual(['h2', 'h2'])
  })

  it('flags an all-caps heading and a bold-only paragraph', () => {
    expect(only('## ARE GERMANS DIFFERENT?')).toMatchObject({ tag: 'h2', caps: true })
    expect(only('__Forza Italia (FI)__')).toMatchObject({ tag: 'p', solo: true })
  })

  it('collects footnotes in reference order, colon or not (real shapes)', () => {
    const blocks = parseProse('Claim.[^2] Other.[^1]\n\n[^1]     See Petersen.\n[^2]: See Acemoglu.')
    const notes = blocks.at(-1) as Extract<ProseBlock, { tag: 'footnotes' }>
    expect(notes.tag).toBe('footnotes')
    expect(notes.items.map(n => [n.id, n.n, n.referenced])).toEqual([['2', 1, true], ['1', 2, true]])
    const p = blocks[0] as Extract<ProseBlock, { tag: 'p' }>
    expect(p.c.filter(n => n.t === 'fnref').map(n => (n as { n: number }).n)).toEqual([1, 2])
  })

  it('reads legacy HTML: tags, entities and an iframe (real shapes)', () => {
    const blocks = parseProse('<p>Italy&rsquo;s vote</p><p>### The Establishment</p><p>__Democratic Party (PD)__</p><iframe width="560" src="https://www.youtube.com/embed/9MoBn0ftBYA" allowfullscreen></iframe><p>&lt;script&gt;</p>')
    expect(blocks.map(b => b.tag)).toEqual(['p', 'h2', 'p', 'embed', 'p'])
    expect(text((blocks[0] as Extract<ProseBlock, { tag: 'p' }>).c)).toBe('Italy’s vote')
    expect(text((blocks[4] as Extract<ProseBlock, { tag: 'p' }>).c)).toBe('<script>')
    expect(blocks[3]).toEqual({ tag: 'embed', id: '9MoBn0ftBYA', label: 'The Establishment' })
  })

  it('names an embed from the text around it, never generically (real shape)', () => {
    const lede = 'Why did Italian voters risk putting their future in the hands of untested populists? From youth unemployment to a slumping working class, this documentary goes inside a country at a crossroads.'
    const iframe = '<iframe width="560" src="https://www.youtube.com/embed/9MoBn0ftBYA" title="YouTube video player"></iframe>'
    const [, embed] = parseProse(`<p>${lede}</p>${iframe}`)
    expect(embed).toEqual({ tag: 'embed', id: '9MoBn0ftBYA', label: 'Why did Italian voters risk putting their future in the hands of untested populists?' })
    const [titled] = parseProse('<iframe src="https://youtu.be/9MoBn0ftBYA" title="Disrupting Democracy: Italy"></iframe>')
    expect(titled).toMatchObject({ label: 'Disrupting Democracy: Italy' })
    const [bare] = parseProse('<iframe src="https://youtu.be/9MoBn0ftBYA"></iframe>')
    expect(bare).toMatchObject({ label: 'YouTube' })
  })

  it('parses a pipe table', () => {
    const b = only('| Country | Share |\n|:--|--:|\n| U.S. | 20% |')
    expect(b).toMatchObject({ tag: 'table', align: ['left', 'right'], label: 'Table: Country, Share' })
  })

  it('names each table apart: numbered when there are several, by its lead-in when it has one', () => {
    const table = '| Country | Share |\n|:--|--:|\n| U.S. | 20% |'
    const tables = parseProse(`Patents filed, by region:\n\n${table}\n\nThe gap widened.\n\n${table}`)
      .filter(b => b.tag === 'table')
      .map(b => (b as Extract<ProseBlock, { tag: 'table' }>).label)
    expect(tables).toEqual(['Table 1: Patents filed, by region', 'Table 2: Country, Share'])
  })

  it('renders nothing for an empty body', () => {
    expect(parseProse(null)).toEqual([])
    expect(parseProse('  \n ')).toEqual([])
  })
})
