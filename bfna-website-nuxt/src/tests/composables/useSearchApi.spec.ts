import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { fetchSearchApi, useSearchApi, SEARCH_API_LIMIT } from '../../composables/useSearchApi'

const API = 'https://search.example/search-enhanced'

const respond = (body: unknown, status = 200) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))

const result = (item: Record<string, unknown>, relevance: number) => ({ item, relevance })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchSearchApi', () => {
  it('sends the term, the full format and the API limit', async () => {
    const fetchMock = respond({ total: 0, results: [] })
    vi.stubGlobal('fetch', fetchMock)

    await fetchSearchApi(API, 'diaspora voting')

    const url = new URL(fetchMock.mock.calls[0]![0] as string)
    expect(url.origin + url.pathname).toBe(API)
    expect(url.searchParams.get('term')).toBe('diaspora voting')
    expect(url.searchParams.get('format')).toBe('full')
    expect(url.searchParams.get('limit')).toBe(String(SEARCH_API_LIMIT))
  })

  it('returns relevant matches first, then the weaker ones, flagged', async () => {
    vi.stubGlobal('fetch', respond({
      total: 2,
      results: [result({ collection: 'publications', slug: 'a', heading: 'A', theme: 'democracy' }, 0.9)],
      weaker: [result({ collection: 'htfd_episodes', slug: 'b', heading: 'B', url: 'https://htfd.example/b', type: 'Podcast' }, 0.2)]
    }))

    const matches = await fetchSearchApi(API, 'q')

    expect(matches).toEqual([
      expect.objectContaining({ slug: 'a', url: '/democracy/a', relevance: 0.9, weaker: false }),
      expect.objectContaining({ slug: 'b', url: 'https://htfd.example/b', type: 'Podcast', relevance: 0.2, weaker: true })
    ])
  })

  it('drops items with no heading, no slug or nowhere to link', async () => {
    vi.stubGlobal('fetch', respond({
      results: [
        result({ slug: 'no-heading', theme: 't' }, 0.5),
        result({ heading: 'No slug', theme: 't' }, 0.5),
        result({ heading: 'No url', slug: 'no-url' }, 0.5)
      ]
    }))

    expect(await fetchSearchApi(API, 'q')).toEqual([])
  })

  it('throws on a non-2xx response', async () => {
    vi.stubGlobal('fetch', respond({}, 502))
    await expect(fetchSearchApi(API, 'q')).rejects.toThrow('502')
  })
})

describe('useSearchApi', () => {
  it('is off when the build has no API URL', () => {
    const { status } = useSearchApi(ref(''), '')
    expect(status.value).toBe('off')
  })

  it('does not call the API for a query shorter than two characters', async () => {
    const fetchMock = respond({ results: [] })
    vi.stubGlobal('fetch', fetchMock)
    const { run, status } = useSearchApi(ref(''), API)

    await run(' d ')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(status.value).toBe('idle')
  })

  it('records the trimmed term its matches answer', async () => {
    vi.stubGlobal('fetch', respond({ results: [result({ slug: 'a', heading: 'A', theme: 't' }, 0.8)] }))
    const { run, matches, forTerm, status } = useSearchApi(ref(''), API)

    await run('  democracy ')

    expect(status.value).toBe('ready')
    expect(forTerm.value).toBe('democracy')
    expect(matches.value).toHaveLength(1)
  })

  it('reports an error instead of an empty result when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')))
    const { run, status, matches } = useSearchApi(ref(''), API)

    await run('democracy')

    expect(status.value).toBe('error')
    expect(matches.value).toEqual([])
  })

  it('ignores a slow response that a newer search has overtaken', async () => {
    let releaseFirst!: (r: Response) => void
    const first = new Promise<Response>((resolve) => { releaseFirst = resolve })
    const body = (slug: string) => JSON.stringify({ results: [result({ slug, heading: slug, theme: 't' }, 0.5)] })

    vi.stubGlobal('fetch', vi.fn()
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce(new Response(body('second'))))

    const { run, matches, forTerm } = useSearchApi(ref(''), API)

    const slow = run('first query')
    await run('second query')
    releaseFirst(new Response(body('first')))
    await slow

    expect(forTerm.value).toBe('second query')
    expect(matches.value.map(m => m.slug)).toEqual(['second'])
  })
})
