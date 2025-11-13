import { directus, fetchWithFallback, getCachedData, setCachedData } from '~/utils/directus'
import type { Person, PeopleConfig } from '~/types/directus'

interface PeopleData {
  team_list: Person[]
  board_list: Person[]
  heading?: string
  subheading?: string
  theme?: string
  image?: {
    url: string
    title?: string
  }
}

export const usePeople = () => {
  return useAsyncData('people', async () => {
    const cacheKey = 'directus:people'
    const cached = getCachedData<PeopleData>(cacheKey)
    if (cached) {
      return cached
    }
    
    const data = await fetchWithFallback<PeopleData>(
      async () => {
        const [peopleResponse, configResponse] = await Promise.all([
          directus.items('people').readByQuery({ limit: -1 }),
          directus.singleton('people_config').read(),
        ])
        
        const people = peopleResponse.data || []
        const config = configResponse || {}
        
        const team_list = people.filter((p) => !p.is_board_member)
        const board_list = people.filter((p) => p.is_board_member)
        
        return {
          ...config,
          team_list,
          board_list,
        } as PeopleData
      },
      '~/content/data/people.json',
      'people'
    )
    
    setCachedData(cacheKey, data)
    return data
  })
}

