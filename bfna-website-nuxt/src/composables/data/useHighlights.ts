export const useHighlights = async () => {
  const { data } = await useAsyncData('highlights-data', () => {
    return queryCollection('highlights').all()
  })

  return data
}
