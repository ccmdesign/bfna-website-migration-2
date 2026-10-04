/** Return true when an Accept header explicitly permits Markdown. */
export const acceptsMarkdown = (header: string | null): boolean => {
  if (!header) return false
  return header.split(',').some(part => {
    const [mediaType, ...parameters] = part.trim().toLowerCase().split(';')
    const quality = parameters.find(parameter => parameter.trim().startsWith('q='))?.trim().slice(2)
    return mediaType === 'text/markdown' && quality !== '0' && quality !== '0.0'
  })
}
