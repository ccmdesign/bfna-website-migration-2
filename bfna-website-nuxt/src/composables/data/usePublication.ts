export const usePublication = () => {
  const route = useRoute()
  
  const getSlug = () => {
    const slug = route.params.slug
    return Array.isArray(slug) && slug.length > 1 ? slug[1] : undefined
  }

  // Use unique key based on route path to ensure fresh data on navigation
  const { data: publication } = useAsyncData(
    `publication-${route.path}`,
    async () => {
      const currentSlug = getSlug()
      
      if (!currentSlug) return null
      
      const publicationsData = await queryCollection('publications')
        .where('slug', '=', currentSlug as string)
        .first()
      
      if (!publicationsData) return null
      
      // Spread meta fields back to the top level
      let transformedPublication = publicationsData
      if (publicationsData.meta) {
        transformedPublication = {
          ...publicationsData,
          ...publicationsData.meta,
        }
      }
      
      return transformedPublication
    },
    {
      watch: [() => route.path]
    }
  )

  return publication
}
