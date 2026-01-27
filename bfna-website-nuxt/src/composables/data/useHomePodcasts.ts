export const useHomePodcasts = () => {
  const { data: page } = useAsyncData("home-podcasts", () => 
  queryCollection("products")
    .where("theme", "=", "podcasts")
    .order("date", "DESC")
    .limit(6)
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

  return page
}



