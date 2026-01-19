export const useHomePublications = () => {
  const { data: page } = useAsyncData('home-publications', () =>
    queryCollection('publications')
      .limit(6)
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

  return page
}



