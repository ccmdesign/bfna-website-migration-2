export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string; email?: string; message?: string }>(event)

  const name = (body?.name || '').trim()
  const email = (body?.email || '').trim()
  const message = (body?.message || '').trim()

  if (!name || !email || !message) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  // Basic email shape validation
  const emailOk = /.+@.+\..+/.test(email)
  if (!emailOk) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid email' })
  }

  // TODO: integrate with email provider or persist to storage
  // For now, just log on server and return success
  console.log('[contact] submission', { name, email, len: message.length })

  return { ok: true }
})


