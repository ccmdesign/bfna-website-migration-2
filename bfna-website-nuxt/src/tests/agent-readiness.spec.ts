import { describe, expect, it } from 'vitest'
import { acceptsMarkdown } from '../utils/accept'

describe('Markdown content negotiation', () => {
  it('accepts text/markdown and respects q=0', () => {
    expect(acceptsMarkdown('text/html, text/markdown;q=0.9')).toBe(true)
    expect(acceptsMarkdown('text/markdown;q=0')).toBe(false)
    expect(acceptsMarkdown('text/html')).toBe(false)
  })
})
