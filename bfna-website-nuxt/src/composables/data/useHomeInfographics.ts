export const useHomeInfographics = () => {
  const { data: page } = useAsyncData('home-infographics', () => 
  queryCollection('infographics')
    .limit(6)
    .order('date', 'DESC')
    .all(), 
      {
        transform: (data) => {
          if (!data) return data
          // Spread meta fields back to the top level
          return data.map((infographic) => {
            if (infographic.meta) {
              return {
                ...infographic,
                ...infographic.meta,
              }
            }
            return infographic
          })
        }
      }
    )

  return page
}



