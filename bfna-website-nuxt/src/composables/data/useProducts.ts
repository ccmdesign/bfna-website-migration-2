export const useProducts = () => {
  const { data: products } = useAsyncData('products', () => 
    queryCollection('products')
      .order('date', 'DESC')
      .all(), 
    {
      transform: (data) => {
        if (!data) return data
        // Spread meta fields back to the top level
        return data.map((product) => {
          if (product.meta) {
            return {
              ...product,
              ...product.meta,
            }
          }
          return product
        })
      }
    }
  )

  return products
}

