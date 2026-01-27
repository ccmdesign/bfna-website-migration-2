export const useUpdatesPodcasts = () => {
  const { data: podcasts } = useAsyncData("updates-podcasts", () => 
  queryCollection("products")
    .where("theme", "=", "podcasts")
    .order("date", "DESC")
    .all(), 
      {
        transform: (data) => {
          if (!data) return data
          // Spread meta fields back to the top level
          return data.map((podcast) => {
            if (podcast.meta) {
              return {
                ...podcast,
                ...podcast.meta,
              }
            }
            return podcast
          })
        }
      }
    )

  return podcasts
}

export const usePodcasts = () => {
  const { data: podcasts } = useAsyncData("podcast-podcasts", () => 
  queryCollection("products")
    .where("theme", "=", "podcasts")
    .order("date", "DESC")
    .all(), 
      {
        transform: (data) => {
          if (!data) return data
          // Spread meta fields back to the top level
          return data.map((podcast) => {
            if (podcast.meta) {
              return {
                ...podcast,
                ...podcast.meta,
              }
            }
            return podcast
          })
        }
      }
    )

  return podcasts
}




