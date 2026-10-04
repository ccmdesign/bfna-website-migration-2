import { describe, expect, it } from 'vitest'
import { isSitemapExcluded } from '~/utils/agent-sitemap'

describe('agent sitemap exclusions', () => {
  it('excludes internal routes', () => {
    expect(isSitemapExcluded('/docs/components')).toBe(true)
    expect(isSitemapExcluded('/wireframes')).toBe(true)
    expect(isSitemapExcluded('/search')).toBe(true)
    expect(isSitemapExcluded('/about')).toBe(false)
  })
})
