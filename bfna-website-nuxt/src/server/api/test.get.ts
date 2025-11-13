export default defineEventHandler(async (event) => {
  return {
    message: 'API routes are working!',
    timestamp: new Date().toISOString()
  }
})
