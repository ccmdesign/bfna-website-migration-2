import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useSearch } from '../../composables/legacy/useSearch'

const DEBOUNCE_MS = 550
const API_URL = 'https://search.test/search-enhanced'

const card = (heading: string) => ({ item: { url: `/democracy/${heading}`, heading } })

const resultFor = (heading: string, weaker: string[] = []) => ({
  results: [card(heading)],
  weaker: weaker.map(card),
  min_relevance: 0.7,
})

// fetch mock whose responses resolve only when the test says so
const createControlledFetch = () => {
  const pending = new Map<string, (response: unknown) => void>()

  const fetchMock = vi.fn((url: string) => {
    const term = new URL(url, 'http://localhost').searchParams.get('term') || ''
    return new Promise((resolve) => {
      pending.set(term, resolve)
    })
  })

  const settle = async (term: string, response: unknown) => {
    pending.get(term)?.(response)
    // let the awaited fetch/json chain settle
    await vi.runAllTimersAsync()
  }

  const respond = (term: string, body: unknown) =>
    settle(term, { ok: true, status: 200, json: async () => body })

  const fail = (term: string, status: number) =>
    settle(term, { ok: false, status, json: async () => ({}) })

  return { fetchMock, respond, fail }
}

const typeQuery = async (search: ReturnType<typeof useSearch>, value: string) => {
  search.query.value = value
  await nextTick()
  await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)
}

describe('useSearch - stale responses', () => {
  let controlled: ReturnType<typeof createControlledFetch>

  beforeEach(() => {
    vi.useFakeTimers()
    controlled = createControlledFetch()
    vi.stubGlobal('fetch', controlled.fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('keeps the newest results when an older search resolves last', async () => {
    const search = useSearch({ apiUrl: API_URL })

    await typeQuery(search, 'germany')
    await typeQuery(search, 'hungary')
    expect(controlled.fetchMock).toHaveBeenCalledTimes(2)

    await controlled.respond('hungary', resultFor('hungary'))
    await controlled.respond('germany', resultFor('germany'))

    expect(search.results.value.map(r => r.heading)).toEqual(['hungary'])
    expect(search.resultCount.value).toBe(1)
    expect(search.isLoading.value).toBe(false)
  })

  it('stays loading until the newest search resolves', async () => {
    const search = useSearch({ apiUrl: API_URL })

    await typeQuery(search, 'germany')
    await typeQuery(search, 'hungary')

    await controlled.respond('germany', resultFor('germany'))
    expect(search.isLoading.value).toBe(true)
    expect(search.results.value).toEqual([])

    await controlled.respond('hungary', resultFor('hungary'))
    expect(search.isLoading.value).toBe(false)
    expect(search.results.value.map(r => r.heading)).toEqual(['hungary'])
  })

  it('does not repopulate results after the query is cleared', async () => {
    const search = useSearch({ apiUrl: API_URL })

    await typeQuery(search, 'germany')
    await typeQuery(search, '')

    await controlled.respond('germany', resultFor('germany'))

    expect(search.results.value).toEqual([])
    expect(search.resultCount.value).toBe(0)
    expect(search.isLoading.value).toBe(false)
  })
})

describe('useSearch - less relevant results', () => {
  let controlled: ReturnType<typeof createControlledFetch>

  beforeEach(() => {
    vi.useFakeTimers()
    controlled = createControlledFetch()
    vi.stubGlobal('fetch', controlled.fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  const headings = (search: ReturnType<typeof useSearch>) =>
    search.visibleResults.value.map(r => r.heading)

  it('hides weaker matches until expanded, then appends them', async () => {
    const search = useSearch({ apiUrl: API_URL })

    await typeQuery(search, 'germany')
    await controlled.respond('germany', resultFor('germany', ['weak-1', 'weak-2']))

    expect(headings(search)).toEqual(['germany'])
    expect(search.resultCount.value).toBe(1)
    expect(search.weakerResults.value).toHaveLength(2)
    expect(search.hiddenCount.value).toBe(2)

    search.toggleWeaker()
    expect(headings(search)).toEqual(['germany', 'weak-1', 'weak-2'])
    // the count follows what is on screen
    expect(search.resultCount.value).toBe(3)
    expect(search.hiddenCount.value).toBe(0)

    search.toggleWeaker()
    expect(headings(search)).toEqual(['germany'])
    expect(search.resultCount.value).toBe(1)
    expect(search.hiddenCount.value).toBe(2)
  })

  it('collapses the weaker matches again on a new search', async () => {
    const search = useSearch({ apiUrl: API_URL })

    await typeQuery(search, 'germany')
    await controlled.respond('germany', resultFor('germany', ['weak-1']))
    search.toggleWeaker()

    await typeQuery(search, 'hungary')
    await controlled.respond('hungary', resultFor('hungary', ['weak-2']))

    expect(search.showWeaker.value).toBe(false)
    expect(headings(search)).toEqual(['hungary'])
  })

  it('keeps the weaker matches open when the same term is searched again', async () => {
    const search = useSearch({ apiUrl: API_URL })

    await typeQuery(search, 'germany')
    await controlled.respond('germany', resultFor('germany', ['weak-1']))
    search.toggleWeaker()

    // e.g. a duplicate request fired when the input loses focus
    search.performSearch('germany')
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)
    await controlled.respond('germany', resultFor('germany', ['weak-1']))

    expect(search.showWeaker.value).toBe(true)
    expect(headings(search)).toEqual(['germany', 'weak-1'])
  })

  it('handles a response with only weaker matches', async () => {
    const search = useSearch({ apiUrl: API_URL })

    await typeQuery(search, 'a')
    await controlled.respond('a', { results: [], weaker: [card('weak-1')], min_relevance: 0.7 })

    expect(search.hasSearched.value).toBe(true)
    expect(search.resultCount.value).toBe(0)
    expect(headings(search)).toEqual([])

    search.toggleWeaker()
    expect(headings(search)).toEqual(['weak-1'])
  })
})

describe('useSearch - search API', () => {
  let controlled: ReturnType<typeof createControlledFetch>

  beforeEach(() => {
    vi.useFakeTimers()
    controlled = createControlledFetch()
    vi.stubGlobal('fetch', controlled.fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('calls the search API directly with the full format and limit', async () => {
    const search = useSearch({ apiUrl: API_URL })

    await typeQuery(search, 'west virginia')

    const requested = new URL(controlled.fetchMock.mock.calls[0][0])
    expect(`${requested.origin}${requested.pathname}`).toBe(API_URL)
    expect(requested.searchParams.get('term')).toBe('west virginia')
    expect(requested.searchParams.get('format')).toBe('full')
    expect(requested.searchParams.get('limit')).toBe('25')
  })

  it('maps API items to cards, falling back to /theme/slug and dropping linkless items', async () => {
    const search = useSearch({ apiUrl: API_URL })

    await typeQuery(search, 'germany')
    await controlled.respond('germany', {
      total: 3,
      results: [
        {
          item: {
            id: 'docs:1',
            collection: 'docs',
            heading: 'External doc',
            url: 'https://bfnadocs.org/doc',
            theme: 'democracy',
            type: 'Documentary',
            related: [
              { id: 'p:1', heading: 'Related page', theme: 'democracy', slug: 'related', reason: 'Similar topic' },
              { id: 'p:2', heading: 'No link' },
            ],
          },
        },
        { item: { id: 'pub:1', collection: 'publications', heading: 'Internal page', theme: 'politics-society', slug: 'internal' } },
        { item: { id: 'x:1', collection: 'x', heading: 'No link at all' } },
      ],
      weaker: [],
      min_relevance: 0.65,
    })

    expect(search.results.value).toEqual([
      {
        url: 'https://bfnadocs.org/doc',
        heading: 'External doc',
        subheading: undefined,
        excerpt: undefined,
        theme: 'democracy',
        type: 'Documentary',
        related: [
          { url: '/democracy/related', heading: 'Related page', type: undefined, theme: 'democracy', reason: 'Similar topic' },
        ],
      },
      expect.objectContaining({ url: '/politics-society/internal', heading: 'Internal page', related: [] }),
    ])
  })

  it('flags an error instead of showing "no results" when the API fails', async () => {
    const search = useSearch({ apiUrl: API_URL })

    await typeQuery(search, 'germany')
    await controlled.fail('germany', 404)

    expect(search.hasError.value).toBe(true)
    expect(search.hasSearched.value).toBe(true)
    expect(search.results.value).toEqual([])
    expect(search.isLoading.value).toBe(false)

    // a later successful search clears the error
    await typeQuery(search, 'hungary')
    await controlled.respond('hungary', resultFor('hungary'))

    expect(search.hasError.value).toBe(false)
    expect(search.results.value.map(r => r.heading)).toEqual(['hungary'])
  })

  it('flags an error without calling fetch when no API URL is configured', async () => {
    const search = useSearch({ apiUrl: '' })

    await typeQuery(search, 'germany')
    await vi.runAllTimersAsync()

    expect(controlled.fetchMock).not.toHaveBeenCalled()
    expect(search.hasError.value).toBe(true)
  })
})
