export const useAnnouncement = () => {
  const { data } = useAsyncData('announcement', () => {
  return queryCollection('announcements').first()
})
  return data
}

