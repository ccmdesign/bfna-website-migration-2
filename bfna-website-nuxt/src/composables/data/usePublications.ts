export const usePublications = () => {
  const { data: publications } = useAsyncData('updates-publications', () => 
  queryCollection('publications')
    .order('date', 'DESC')
    .all(), 
      {
        transform: (data) => {
          if (!data) return data
          // Spread meta fields back to the top level
          return data.map((publication) => {
            if (publication.meta) {
              return {
                ...publication,
                ...publication.meta,
              }
            }
            return publication
          })
        }
      }
    )

  return publications
}
