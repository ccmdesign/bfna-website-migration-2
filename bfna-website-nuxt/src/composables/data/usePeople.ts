// import { directus, fetchWithFallback, getCachedData, setCachedData } from '~/utils/directus'
// import type { Person, PeopleConfig } from '~/types/directus'

// interface PeopleData {
//   team_list: Person[]
//   board_list: Person[]
//   heading?: string
//   subheading?: string
//   theme?: string
//   image?: {
//     url: string
//     title?: string
//   }
// }

// export const usePeople = () => {
//   return useAsyncData('people', async () => {
//     const cacheKey = 'directus:people'
//     const cached = getCachedData<PeopleData>(cacheKey)
//     if (cached) {
//       return cached
//     }
    
//     const data = await fetchWithFallback<PeopleData>(
//       async () => {
//         const [peopleResponse, configResponse] = await Promise.all([
//           directus.items('people').readByQuery({ limit: -1 }),
//           directus.singleton('people_config').read(),
//         ])
        
//         const people = peopleResponse.data || []
//         const config = configResponse || {}
        
//         const team_list = people.filter((p) => !p.is_board_member)
//         const board_list = people.filter((p) => p.is_board_member)
        
//         return {
//           ...config,
//           team_list,
//           board_list,
//         } as PeopleData
//       },
//       '~/content/data/people.json',
//       'people'
//     )
    
//     setCachedData(cacheKey, data)
//     return data
//   })
// }



// interface PeopleData {
//   team_list: Person[]
//   board_list: Person[]
//   heading?: string
//   subheading?: string
//   theme?: string
//   image?: {
//     url: string
//     title?: string
//   }
// }

const getPeople = async (idList: number[]) => {
  if (!idList || idList.length === 0) return []
  const lsResult = idList.map((item) => item.id)
  
  // Fetch all people and filter by IDs in memory
  // This is efficient for small datasets and avoids potential query builder issues
  const allPeople = await queryCollection('people').all()
    
  if (!allPeople) return []
  
  // Filter to only people in the idList
  const filteredPeople = allPeople.filter((person) => 
    lsResult.includes(person.personId)
  )
  
  // Spread meta fields back to the top level
  return filteredPeople.map((person) => {
    if (person.meta) {
      return {
        ...person,
        ...person.meta,
      }
    }
    return person
  })
}


/**
 * Composable for fetching all workstreams using Directus
 * Returns data in object format keyed by slug for backward compatibility with legacy pages
 * @returns Reactive workstreams data object, loading state, and error state
 */
export const usePeople = () => {
  return useAsyncData('people-workstreams', async () => {
    const workstream = await queryCollection('workstreams')
      .where('heading', '=', 'Team')
      .first()
    
    const [team_list, board_list] = await Promise.all([
      getPeople(workstream?.team || []),
      getPeople(workstream?.boardOfDirectors || [])
    ])
    
    return {
      team_list,
      board_list,
      heading: workstream?.heading,
      subheading: workstream?.excerpt,
      theme: workstream?.theme,
      image: workstream?.image,
    }
  })
}



