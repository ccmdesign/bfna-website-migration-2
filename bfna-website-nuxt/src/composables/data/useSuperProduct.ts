const getProducts = async (productList: Array<{id: number, products_id: number, sort: number}>) => {
  if (!productList || productList.length === 0) return []

  // Fetch all products
  const allProducts = await queryCollection('products').all()

  if (!allProducts) return []

  // Filter to only products in the productList
  const filteredProducts = allProducts.filter((product) =>
    productList.includes(product.productId)
  )


  // Spread meta fields back to the top level and add sort value
  const productsWithMeta = filteredProducts.map((product) => {
    if (product.meta) {
      return {
        ...product,
        ...product.meta,
      }
    }
    return { ...product }
  })

  // Sort by the sort field from the relation
  return productsWithMeta.sort((a, b) => b.productId - a.productId)
}

export const useSuperProduct = () => {
  const route = useRoute()
  
  const getSlug = () => {
    const slug = route.params.slug
    return Array.isArray(slug) && slug.length > 1 ? slug[1] : slug
  }

  // Use unique key based on route path to ensure fresh data on navigation
  const { data: product } = useAsyncData(
    `super-product-${route.path}`,
    async () => {
      const currentSlug = getSlug()
      
      if (!currentSlug) return null
      
      const productData = await queryCollection('super_products')
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
      
      // Fetch and attach products if exists
      if (transformedProduct.products && transformedProduct.products.length > 0) {
        transformedProduct.products = await getProducts(transformedProduct.products)
      }

      // Fetch and attach people if exists
      // if (transformedProduct.people && transformedProduct.people.length > 0) {
      //   transformedProduct.people = [].concat(transformedProduct.internalAuthors, transformedProduct.externalCollaborators)
      // }
      
      return transformedProduct
    },
    {
      watch: [() => route.path]
    }
  )

  return product
}
