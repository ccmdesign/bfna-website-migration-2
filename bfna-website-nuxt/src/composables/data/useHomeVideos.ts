export const useHomeVideos = () => {
  const { data: page } = useAsyncData('home-videos', () => 
  queryCollection('videos')
    .limit(6)
    .order('date', 'DESC')
    .all(), 
      {
        transform: (data) => {
          if (!data) return data
          // Spread meta fields back to the top level
          return data.map((video) => {
            if (video.meta) {
              return {
                ...video,
                ...video.meta,
              }
            }
            return video
          })
        }
      }
    )

  return page
}



