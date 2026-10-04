import { describe, expect, it } from 'vitest'
import { parseAcceptHeader, prefersMarkdown } from '~/utils/accept'

describe('accept negotiation', () => {
  it('prefers markdown when it outranks html', () => {
    expect(prefersMarkdown('text/markdown, text/html;q=0.9')).toBe(true)
  })

  it('rejects markdown when q=0', () => {
    expect(prefersMarkdown('text/markdown;q=0, text/html')).toBe(false)
  })

  it('parses multiple types', () => {
    const parsed = parseAcceptHeader('text/html, text/markdown;q=0.8')
    expect(parsed).toHaveLength(2)
    expect(parsed[1]?.q).toBe(0.8)
  })
})
