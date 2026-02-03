export const useProduct = () => {
  const route = useRoute()
  
  const getSlug = () => {
    const slug = route.params.slug
    return Array.isArray(slug) && slug.length > 1 ? slug[1] : undefined
  }

  // Use unique key based on route path to ensure fresh data on navigation
  const { data: product } = useAsyncData(
    `product-${route.path}`,
    async () => {
      const currentSlug = getSlug()
      
      if (!currentSlug) return null
      
      const productData = await queryCollection('products')
        .where('slug', '=', currentSlug as string)
        .first()
      
      if (!productData) return null
      
      // Spread meta fields back to the top level
      let transformedProduct = productData
      if (productData.meta) {
        transformedProduct = {
          ...productData,
          ...productData.meta,
        }
      }
      
      // Fetch and attach people if exists
      if (transformedProduct.people && transformedProduct.people.length > 0) {
        transformedProduct.people = [].concat(transformedProduct.internalAuthors, transformedProduct.externalCollaborators)
      }
      
      return transformedProduct
    },
    {
      watch: [() => route.path]
    }
  )

  return product
}
