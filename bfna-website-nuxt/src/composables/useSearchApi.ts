/**
 * The BFNA search API (`bfna-search-api`, `/search-enhanced`) — an embedding
 * search over the whole BFNA catalogue, including the content that lives off
 * this site (How to Fix Democracy episodes, Barometer topics, documentaries).
 *
 * Called **from the browser**: the site is generated statically, so there is
 * no Nitro route to proxy it through, and the API allows any origin. The URL
 * is `runtimeConfig.public.searchApiUrl`, baked in at build time from
 * `NUXT_PUBLIC_SEARCH_API_URL` or `SEARCH_BASE_URL` — a build without either
 * has no API, and `/search` keeps its in-page ranking (see `pages/search.vue`).
 *
 * This file only fetches and normalises. It knows nothing about the site's
 * routes: matching a result to an insight or a project, and deciding where an
 * unmatched one links, is the page's job.
 */
import { ref, watch, type Ref } from 'vue'

/** One match, flattened from the API's `{ item, relevance }` envelope. */
export interface SearchApiMatch {
  /** The API's own collection — `publications`, `htfd_episodes`, … */
  collection: string
  slug: string
  heading: string
  subheading?: string
  excerpt?: string
  /** The API's type label — `Publication`, `Podcast`, `Barometer`, … */
  type?: string
  /** Absolute for off-site content; a legacy `/{theme}/{slug}` path otherwise. */
  url: string
  /** 0–1, the API's similarity. */
  relevance: number
  /** Below the API's own relevance threshold (its `weaker` list). */
  weaker: boolean
}

export type SearchApiStatus = 'off' | 'idle' | 'loading' | 'ready' | 'error'

interface ApiItem {
  collection?: string
  type?: string
  heading?: string
  subheading?: string
  excerpt?: string
  theme?: string
  slug?: string
  url?: string
}

interface ApiResult {
  item?: ApiItem
  relevance?: number
  score?: number
}

interface ApiResponse {
  results?: ApiResult[]
  weaker?: ApiResult[]
}

/** The API caps `results` + `weaker` at 25 combined. */
export const SEARCH_API_LIMIT = 25
const SEARCH_API_TIMEOUT_MS = 10000

const toMatches = (list: ApiResult[] = [], weaker: boolean): SearchApiMatch[] =>
  list.flatMap(({ item, relevance, score }) => {
    if (!item?.heading || !item.slug) return []
    const url = item.url || (item.theme ? `/${item.theme}/${item.slug}` : '')
    if (!url) return []
    return [{
      collection: item.collection ?? '',
      slug: item.slug,
      heading: item.heading,
      subheading: item.subheading || undefined,
      excerpt: item.excerpt || undefined,
      type: item.type || undefined,
      url,
      relevance: relevance ?? score ?? 0,
      weaker
    }]
  })

/**
 * One request. Relevant matches first, then the weaker ones, each in the
 * API's order. Throws on a network error, a timeout or a non-2xx, so the
 * caller can tell an outage from "nothing matched".
 */
export async function fetchSearchApi(apiUrl: string, term: string): Promise<SearchApiMatch[]> {
  const params = new URLSearchParams({ term, format: 'full', limit: String(SEARCH_API_LIMIT) })
  const res = await fetch(`${apiUrl}?${params}`, {
    signal: AbortSignal.timeout(SEARCH_API_TIMEOUT_MS)
  })
  if (!res.ok) throw new Error(`Search API error: ${res.status}`)

  const data: ApiResponse = await res.json()
  return [...toMatches(data?.results, false), ...toMatches(data?.weaker, true)]
}

/**
 * The API's matches for `term`, kept in step with it.
 *
 * - `status` is `off` when the build has no API URL, and stays there.
 * - `forTerm` is the term `matches` answers, so the page never ranks the
 *   current query with the last one's results while a request is in flight.
 * - A response that arrives after a newer request was made is dropped: a
 *   slow first search cannot overwrite a fast second one.
 * - Only runs in the browser. The prerendered `/search` has no query, and a
 *   build should not depend on the API being up.
 */
export function useSearchApi(term: Ref<string>, apiUrl: string) {
  const matches = ref<SearchApiMatch[]>([])
  const forTerm = ref('')
  const status = ref<SearchApiStatus>(apiUrl ? 'idle' : 'off')

  let latest = 0

  const run = async (raw: string) => {
    const value = raw.trim()
    const id = ++latest

    if (value.length < 2) {
      matches.value = []
      forTerm.value = ''
      status.value = 'idle'
      return
    }

    status.value = 'loading'
    try {
      const found = await fetchSearchApi(apiUrl, value)
      if (id !== latest) return
      matches.value = found
      forTerm.value = value
      status.value = 'ready'
    } catch (error) {
      if (id !== latest) return
      if (import.meta.dev) console.error('Search API:', error)
      matches.value = []
      forTerm.value = value
      status.value = 'error'
    }
  }

  if (apiUrl && import.meta.client) {
    watch(term, run, { immediate: true })
  }

  return { matches, forTerm, status, run }
}
