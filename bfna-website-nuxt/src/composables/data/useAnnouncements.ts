import { directus, fetchWithFallback, getCachedData, setCachedData } from '~/utils/directus'
import type { Announcement } from '~/types/directus'

export const useAnnouncements = () => {
  return useAsyncData('announcements', async () => {
    const cacheKey = 'directus:announcements'
    const cached = getCachedData<Announcement>(cacheKey)
    if (cached) {
      return cached
    }
    
    const data = await fetchWithFallback<Announcement>(
      async () => {
        const response = await directus.singleton('announcements').read()
        return response || null
      },
      '~/content/data/announcement.json',
      'announcements'
    )
    
    setCachedData(cacheKey, data)
    return data
  })
}

