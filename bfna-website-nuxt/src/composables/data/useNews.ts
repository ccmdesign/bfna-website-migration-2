import { directus, fetchWithFallback, getCachedData, setCachedData } from '~/utils/directus'
import type { News } from '~/types/directus'

export const useNews = () => {
  return useAsyncData('news', async () => {
    const cacheKey = 'directus:news'
    const cached = getCachedData<News[]>(cacheKey)
    if (cached) {
      return cached
    }
    
    const data = await fetchWithFallback<News[]>(
      async () => {
        const response = await directus.items('news').readByQuery({
          limit: -1,
        })
        return response.data || []
      },
      '~/content/data/news.json',
      'news'
    )
    
    setCachedData(cacheKey, data)
    return data
  })
}

