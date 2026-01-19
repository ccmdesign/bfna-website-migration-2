export const useHomeDocs = () => {
  const { data: page } = useAsyncData('home-docs', () => 
  queryCollection('docs')
    .limit(4)
    .order('order', 'ASC')
    .all(), 
      {
        transform: (data) => {
          if (!data) return data
          // Spread meta fields back to the top level
          return data.map((doc) => {
            if (doc.meta) {
              return {
                ...doc,
                ...doc.meta,
              }
            }
            return doc
          })
        }
      }
    )

  return page
}



