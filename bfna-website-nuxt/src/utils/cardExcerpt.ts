/** Keep card summaries within a shared budget without cutting the final word. */
export function cardExcerpt(excerpt: string | null | undefined, limit = 140): string {
  const text = (excerpt ?? '').replace(/\s+/g, ' ').trim()
  if (text.length <= limit) return text

  const cut = text.slice(0, Math.max(0, limit - 1))
  const boundary = cut.lastIndexOf(' ')
  const wholeWords = /\s/.test(text.charAt(cut.length)) ? cut : cut.slice(0, boundary > 0 ? boundary : cut.length)
  return wholeWords.trimEnd().replace(/[,:;–—-]$/, '').trimEnd() + '…'
}
