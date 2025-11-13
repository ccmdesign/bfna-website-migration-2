export default defineEventHandler((event) => {
  const url = event.node.req.url || ''
  
  // Redirect /digital-economy/* to /digital-world/*
  if (url.startsWith('/digital-economy/')) {
    const splat = url.replace('/digital-economy', '')
    return sendRedirect(event, `/digital-world${splat}`, 301)
  }
  
  // Redirect /future-of-work/* to /future-leadership/*
  if (url.startsWith('/future-of-work/')) {
    const splat = url.replace('/future-of-work', '')
    return sendRedirect(event, `/future-leadership${splat}`, 301)
  }
  
  // Handle exact matches (without trailing slash)
  if (url === '/digital-economy') {
    return sendRedirect(event, '/digital-world', 301)
  }
  
  if (url === '/future-of-work') {
    return sendRedirect(event, '/future-leadership', 301)
  }
})

